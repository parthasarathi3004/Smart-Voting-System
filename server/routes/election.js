const express = require('express');
const router = express.Router();
const { getState, updateState } = require('../services/db');

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if current time is within election active window
function evaluatePollStatus(config) {
  const sessionId = config.sessionId || 'SESSION-DEFAULT';

  if (config.isLiveOverride === true) {
    return {
      isOpen: true,
      reason: 'Polls are OPEN (Live Poll Override Active)',
      status: 'POLLS_OPEN',
      sessionId
    };
  }

  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (config.electionDate && todayStr !== config.electionDate) {
    return {
      isOpen: false,
      reason: `Election Day is scheduled for ${config.electionDate}. Today is ${todayStr}. Voting is locked.`,
      status: 'DATE_MISMATCH',
      sessionId
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (config.startTime || '07:00').split(':').map(Number);
  const [endH, endM] = (config.endTime || '18:00').split(':').map(Number);

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  if (currentMinutes < startTotalMinutes) {
    return {
      isOpen: false,
      reason: `Polls open at ${config.startTime}. Active polling hours: ${config.startTime} - ${config.endTime}. Please wait.`,
      status: 'BEFORE_HOURS',
      sessionId
    };
  }

  if (currentMinutes > endTotalMinutes) {
    return {
      isOpen: false,
      reason: `Polls closed at ${config.endTime}. Voting window for this session has concluded.`,
      status: 'AFTER_HOURS',
      sessionId
    };
  }

  return {
    isOpen: true,
    reason: `Polls are OPEN (Active Hours: ${config.startTime} - ${config.endTime})`,
    status: 'POLLS_OPEN',
    sessionId
  };
}

// Get election status and configuration
router.get('/config', (req, res) => {
  const state = getState();
  const config = state.electionConfig || {};
  const status = evaluatePollStatus(config);

  res.json({
    success: true,
    config,
    status
  });
});

// Update election configuration (Admin only)
router.post('/config', (req, res) => {
  const { electionDate, startTime, endTime, isLiveOverride, title, resetWindowVotes } = req.body;

  const state = getState();
  const oldConfig = state.electionConfig || {};

  const dateChanged = electionDate && electionDate !== oldConfig.electionDate;
  const timeChanged = (startTime && startTime !== oldConfig.startTime) || (endTime && endTime !== oldConfig.endTime);
  const isNewSessionRequested = Boolean(resetWindowVotes || dateChanged || timeChanged);

  const targetDate = electionDate || oldConfig.electionDate || getLocalDateString();
  const newSessionId = isNewSessionRequested
    ? `SESSION-${targetDate.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`
    : (oldConfig.sessionId || `SESSION-${targetDate.replace(/-/g, '')}-001`);

  updateState(s => {
    s.electionConfig = {
      ...s.electionConfig,
      electionDate: targetDate,
      startTime: startTime || s.electionConfig.startTime || '07:00',
      endTime: endTime || s.electionConfig.endTime || '18:00',
      isLiveOverride: typeof isLiveOverride === 'boolean' ? isLiveOverride : s.electionConfig.isLiveOverride,
      title: title || s.electionConfig.title,
      sessionId: newSessionId,
      sessionCreatedAt: isNewSessionRequested ? new Date().toISOString() : (s.electionConfig.sessionCreatedAt || new Date().toISOString())
    };

    // When starting a fresh session / new window:
    if (isNewSessionRequested) {
      // Clear voter hasVoted flags so enrolled voters can participate in the new window!
      if (Array.isArray(s.voters)) {
        s.voters.forEach(v => {
          v.hasVoted = false;
          v.votedAt = null;
          v.receiptHash = null;
        });
      }
      // Reset candidate cumulative votes to 0 for this fresh window!
      if (Array.isArray(s.candidates)) {
        s.candidates.forEach(c => {
          c.votes = 0;
        });
      }
    }
  });

  const updatedState = getState();
  const status = evaluatePollStatus(updatedState.electionConfig);

  res.json({
    success: true,
    message: isNewSessionRequested
      ? 'New election window started! PowerBI analytics and voter statuses reset for fresh voting.'
      : 'Election configuration updated successfully.',
    isNewSession: isNewSessionRequested,
    config: updatedState.electionConfig,
    status
  });
});

// Explicit endpoint to start a brand new polling session
router.post('/new-session', (req, res) => {
  const state = getState();
  const config = state.electionConfig || {};
  const targetDate = config.electionDate || getLocalDateString();
  const newSessionId = `SESSION-${targetDate.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

  updateState(s => {
    s.electionConfig = {
      ...s.electionConfig,
      sessionId: newSessionId,
      sessionCreatedAt: new Date().toISOString()
    };

    if (Array.isArray(s.voters)) {
      s.voters.forEach(v => {
        v.hasVoted = false;
        v.votedAt = null;
        v.receiptHash = null;
      });
    }

    if (Array.isArray(s.candidates)) {
      s.candidates.forEach(c => {
        c.votes = 0;
      });
    }
  });

  const updatedState = getState();
  const status = evaluatePollStatus(updatedState.electionConfig);

  res.json({
    success: true,
    message: 'New polling session started! PowerBI visuals are now reset to 0 for fresh voting.',
    config: updatedState.electionConfig,
    status
  });
});

module.exports = {
  router,
  evaluatePollStatus,
  getLocalDateString
};

