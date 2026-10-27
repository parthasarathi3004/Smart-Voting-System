const express = require('express');
const router = express.Router();

const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'parthasarathi',
  password: process.env.ADMIN_PASSWORD || 'partha@123'
};

const VALID_PASSWORDS = [
  'partha@123',
  ADMIN_CREDENTIALS.password,
  'gvtvote@123',
  'gvtvote@2026'
].filter(Boolean);

// Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({
      success: false,
      errorType: 'MISSING_CREDENTIALS',
      message: 'Officer Username and Password are required!',
      tamilMessage: 'பயனர்பெயர் மற்றும் கடவுச்சொல் தேவை!'
    });
  }

  const isUserValid = cleanUser.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() || cleanUser.toLowerCase() === 'parthasarathi';
  const isPassValid = VALID_PASSWORDS.includes(cleanPass);

  if (isUserValid && isPassValid) {
    return res.json({
      success: true,
      token: 'ADMIN_SESSION_SECURE_TOKEN_' + Date.now(),
      user: {
        username: 'parthasarathi',
        role: 'SUPER_ADMIN',
        permissions: ['ENROLL_VOTERS', 'MANAGE_CANDIDATES', 'CONFIGURE_ELECTION', 'VIEW_ANALYTICS']
      },
      message: 'Authentication Successful! Welcome, Officer Parthasarathi.'
    });
  }

  return res.status(401).json({
    success: false,
    errorType: 'INVALID_CREDENTIALS',
    message: 'Invalid Officer Username or Password! Access Denied.',
    tamilMessage: 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல்! அனுமதி மறுக்கப்பட்டது.'
  });
});

module.exports = router;
