const express = require('express');
const router = express.Router();
const { getSmsConfig, saveSmsConfig, sendRealSms } = require('../services/otpService');

// GET current SMS gateway status
router.get('/config', (req, res) => {
  const cfg = getSmsConfig();
  const maskedKey = cfg.fast2smsApiKey 
    ? `${cfg.fast2smsApiKey.slice(0, 4)}••••••••${cfg.fast2smsApiKey.slice(-4)}`
    : '';

  return res.json({
    success: true,
    provider: cfg.provider || 'fast2sms',
    hasApiKey: Boolean(cfg.fast2smsApiKey && cfg.fast2smsApiKey.trim()),
    maskedKey
  });
});

// POST update SMS gateway credentials
router.post('/config', (req, res) => {
  const { provider = 'fast2sms', fast2smsApiKey = '', twoFactorApiKey = '' } = req.body;
  const current = getSmsConfig();

  const updated = {
    ...current,
    provider,
    fast2smsApiKey: fast2smsApiKey !== undefined ? fast2smsApiKey.trim() : current.fast2smsApiKey,
    twoFactorApiKey: twoFactorApiKey !== undefined ? twoFactorApiKey.trim() : current.twoFactorApiKey
  };

  const saved = saveSmsConfig(updated);
  if (!saved) {
    return res.status(500).json({ success: false, message: 'Failed to save SMS gateway settings.' });
  }

  return res.json({
    success: true,
    message: 'SMS Gateway configuration updated successfully! Real SMS dispatch is active.',
    hasApiKey: Boolean(updated.fast2smsApiKey)
  });
});

// POST test real SMS dispatch
router.post('/test', async (req, res) => {
  const { phoneNumber } = req.body;
  const cleanPhone = String(phoneNumber || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
    });
  }

  const testCode = Math.floor(100000 + Math.random() * 900000).toString();
  const testMsg = `TN State Election Commission: Test SMS verification code is ${testCode}. Valid for 10 minutes.`;

  const result = await sendRealSms(cleanPhone, testCode, testMsg);
  if (result.delivered) {
    return res.json({
      success: true,
      message: `Real SMS successfully delivered to +91 ${cleanPhone} via ${result.provider}! Check your phone.`
    });
  } else {
    return res.status(400).json({
      success: false,
      message: result.error || result.message || 'Failed to dispatch real SMS.'
    });
  }
});

module.exports = router;
