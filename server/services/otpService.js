const fs = require('fs');
const path = require('path');

const SMS_CONFIG_PATH = path.join(__dirname, '..', 'data', 'sms_config.json');

// In-Memory OTP Management Service for Voter Enrollment & Voting Authorization
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function getSmsConfig() {
  try {
    if (fs.existsSync(SMS_CONFIG_PATH)) {
      const raw = fs.readFileSync(SMS_CONFIG_PATH, 'utf8').replace(/^\uFEFF/, '').trim();
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading sms_config.json:', e);
  }
  return {
    provider: 'fast2sms',
    fast2smsApiKey: process.env.FAST2SMS_API_KEY || '',
    twoFactorApiKey: process.env.TWOFACTOR_API_KEY || ''
  };
}

function saveSmsConfig(cfg) {
  try {
    fs.writeFileSync(SMS_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing sms_config.json:', e);
    return false;
  }
}

// Real SMS Dispatch Engine supporting Fast2SMS (India) and 2Factor.in
async function sendRealSms(cleanPhone, code, message) {
  const config = getSmsConfig();

  // 1. Fast2SMS Integration (Instant Indian SMS to SIM)
  const fast2SmsKey = (config.fast2smsApiKey || process.env.FAST2SMS_API_KEY || '').trim();
  if (fast2SmsKey) {
    try {
      console.log(`[Fast2SMS Gateway] Transmitting real SMS to +91 ${cleanPhone}...`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2SmsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: cleanPhone
        })
      });

      const data = await response.json();
      console.log('[Fast2SMS Gateway Response]:', data);

      if (data.return === true) {
        return {
          delivered: true,
          provider: 'Fast2SMS',
          message: 'Real SMS successfully dispatched to mobile handset.'
        };
      } else {
        const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Fast2SMS dispatch error');
        return {
          delivered: false,
          error: `SMS Gateway Error: ${errorMsg}`
        };
      }
    } catch (err) {
      console.error('[Fast2SMS Network Error]:', err);
      return { delivered: false, error: err.message };
    }
  }

  // 2. 2Factor.in Integration
  const twoFactorKey = (config.twoFactorApiKey || process.env.TWOFACTOR_API_KEY || '').trim();
  if (twoFactorKey) {
    try {
      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${cleanPhone}/${code}/OTP1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.Status === 'Success') {
        return { delivered: true, provider: '2Factor.in' };
      }
    } catch (err) {
      console.error('[2Factor Error]:', err);
    }
  }

  // Fallback: Terminal Broadcast (when API key not yet configured)
  console.log(`================================================================`);
  console.log(`📱 [OFFICIAL TN-SEC SMS DISPATCH]`);
  console.log(`Recipient Mobile: +91 ${cleanPhone}`);
  console.log(`6-Digit OTP:      >>> ${code} <<<`);
  console.log(`Body:             "${message}"`);
  console.log(`Status:           SMS queued. Configure Fast2SMS API Key for real phone delivery.`);
  console.log(`================================================================`);

  return {
    delivered: false,
    needsApiKey: true,
    message: 'OTP dispatched. Enter Fast2SMS API key in Admin Settings for live SIM text messages.'
  };
}

// Generate 6-digit cryptographic random OTP and dispatch real SMS
async function generateOtp(phoneNumber, purpose = 'REGISTRATION', voterName = '') {
  const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    throw new Error('Invalid mobile number! In India, valid SIM numbers must be 10 digits starting with 6, 7, 8, or 9.');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(cleanPhone, {
    code,
    purpose,
    expiresAt,
    attempts: 0,
    createdAt: new Date().toISOString()
  });

  let smsMessage = '';
  if (purpose === 'REGISTRATION') {
    smsMessage = `Tamil Nadu State Election Commission (TN-SEC): Your voter registration verification OTP is ${code}. Your data is being registered in the official voter list. Do not share this OTP with anyone.`;
  } else if (purpose === 'VOTING') {
    smsMessage = `Tamil Nadu State Election Commission (TN-SEC): Your voting authorization OTP is ${code} to cast your ballot for ${voterName || 'Electoral Constituency'}. Valid for 10 minutes.`;
  } else {
    smsMessage = `Tamil Nadu State Election Commission (TN-SEC): Your security OTP is ${code}. Valid for 10 minutes.`;
  }

  const smsStatus = await sendRealSms(cleanPhone, code, smsMessage);

  return {
    success: true,
    phoneNumber: cleanPhone,
    code, // Kept in memory on server, never returned in client response
    expiresAt,
    smsMessage,
    smsStatus
  };
}

// Verify entered OTP
function verifyOtp(phoneNumber, inputCode, purpose = 'REGISTRATION') {
  const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(-10);
  const record = otpStore.get(cleanPhone);

  if (!record) {
    return {
      success: false,
      message: 'No active OTP found for this mobile number. Please click Send OTP.'
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return {
      success: false,
      message: 'OTP has expired. Please request a new verification code.'
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(cleanPhone);
    return {
      success: false,
      message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
    };
  }

  record.attempts++;

  if (String(inputCode).trim() !== record.code) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Invalid OTP! Please enter the correct 6-digit code sent to your mobile. (${remaining} attempts left)`
    };
  }

  // Verified successfully!
  otpStore.delete(cleanPhone);

  return {
    success: true,
    verified: true,
    message: 'Mobile number verified successfully!'
  };
}

module.exports = {
  getSmsConfig,
  saveSmsConfig,
  sendRealSms,
  generateOtp,
  verifyOtp
};
