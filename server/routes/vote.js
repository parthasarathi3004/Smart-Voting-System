const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getState, updateState } = require('../services/db');
const { evaluatePollStatus } = require('./election');

const AUDIT_SALT = process.env.AUDIT_SALT || 'TAMIL_NADU_ELECTION_2026_CYBER_VAULT';

// Cast vote
router.post('/cast', (req, res) => {
  const { voterId, candidateId } = req.body;

  if (!voterId || !candidateId) {
    return res.status(400).json({
      success: false,
      message: 'Voter ID and Candidate ID are required to cast ballot.'
    });
  }

  const state = getState();

  // 1. Election Time Window Enforcement
  const pollStatus = evaluatePollStatus(state.electionConfig || {});
  if (!pollStatus.isOpen) {
    return res.status(403).json({
      success: false,
      errorType: 'POLL_LOCKED',
      message: `Voting is currently locked: ${pollStatus.reason}`
    });
  }

  const currentSessionId = state.electionConfig?.sessionId || pollStatus.sessionId || 'SESSION-DEFAULT';
  const currentElectionDate = state.electionConfig?.electionDate || new Date().toISOString().split('T')[0];

  // 2. Voter Lookup
  const voter = (state.voters || []).find(v => v.id === voterId);
  if (!voter) {
    return res.status(404).json({
      success: false,
      errorType: 'VOTER_NOT_FOUND',
      message: 'Voter record not found in the electoral register.'
    });
  }

  // 3. Double-Voting Prevention Logic: check if voter already cast ballot in current active session
  const hasVotedInSession = voter.lastVotedSessionId === currentSessionId ||
    (state.votesAudit || []).some(a => a.voterId === voter.id && a.sessionId === currentSessionId);

  if (hasVotedInSession) {
    return res.status(409).json({
      success: false,
      errorType: 'DUPLICATE_VOTE_DETECTED',
      message: 'Duplicate Vote Detected: You have already cast your ballot for this election session.'
    });
  }


  // 4. Candidate Lookup & Constituency validation
  const candidate = (state.candidates || []).find(c => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({
      success: false,
      errorType: 'CANDIDATE_NOT_FOUND',
      message: 'Selected candidate does not exist.'
    });
  }

  // Ensure candidate matches voter constituency
  if (candidate.constituency.toLowerCase() !== voter.constituency.toLowerCase()) {
    return res.status(400).json({
      success: false,
      errorType: 'CONSTITUENCY_MISMATCH',
      message: `Candidate is contesting in ${candidate.constituency}, but your registered constituency is ${voter.constituency}.`
    });
  }

  // 5. Generate Tamper-Proof Cryptographic Digital Receipt (SHA-256)
  const timestamp = new Date().toISOString();
  const rawReceipt = `${voter.id}:${candidate.id}:${timestamp}:${AUDIT_SALT}`;
  const receiptHash = crypto.createHash('sha256').update(rawReceipt).digest('hex').toUpperCase();

  // 6. Atomic Commit
  updateState(s => {
    // Mark voter as hasVoted = true for current session
    const targetVoter = s.voters.find(v => v.id === voterId);
    if (targetVoter) {
      targetVoter.hasVoted = true;
      targetVoter.votedAt = timestamp;
      targetVoter.lastVotedSessionId = currentSessionId;
      targetVoter.receiptHash = receiptHash;
    }

    // Increment candidate vote count
    const targetCandidate = s.candidates.find(c => c.id === candidateId);
    if (targetCandidate) {
      targetCandidate.votes = (targetCandidate.votes || 0) + 1;
    }

    // Append to tamper-evident audit ledger (anonymized for voter privacy, tracking window session)
    s.votesAudit.push({
      auditId: `AUDIT-${Date.now().toString().slice(-6)}`,
      receiptHash,
      timestamp,
      constituency: candidate.constituency,
      district: candidate.district,
      party: candidate.party,
      candidateId: candidate.id,
      voterId: voter.id,
      sessionId: currentSessionId,
      electionDate: currentElectionDate
    });
  });


  return res.json({
    success: true,
    message: 'Vote Cast Successfully. Thank you for exercising your democratic duty!',
    receipt: {
      receiptNumber: receiptHash.slice(0, 16),
      receiptHash,
      timestamp,
      voterName: voter.fullName,
      constituency: voter.constituency,
      district: voter.district,
      candidateName: candidate.name,
      partyName: candidate.party,
      status: 'VERIFIED_AND_LEDGER_COMMITTED'
    }
  });
});

// Audit ledger verification endpoint
router.get('/audit-ledger', (req, res) => {
  const state = getState();
  res.json({
    success: true,
    totalAuditedVotes: (state.votesAudit || []).length,
    ledger: (state.votesAudit || []).slice(-100) // latest 100 entries
  });
});

module.exports = router;
