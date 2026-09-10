require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./services/db');

// Global process error handlers to ensure high availability
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const authRoutes = require('./routes/auth');
const votersRoutes = require('./routes/voters');
const candidatesRoutes = require('./routes/candidates');
const { router: electionRoutes } = require('./routes/election');
const voteRoutes = require('./routes/vote');
const analyticsRoutes = require('./routes/analytics');
const supportRoutes = require('./routes/support');
const smsRoutes = require('./routes/smsConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client dev server
app.use(cors());

// Body parsing with large limits for webcam base64 snapshots
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/voters', votersRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/sms', smsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Biometric-Secured Anti-Fraud E-Voting System',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build in production (e.g. on Render)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}


// Initialize database & seed data
initDatabase();

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ Biometric E-Voting & Analytics Server Running on Port ${PORT}`);
  console.log(`🛡️  2FA Security: Real-Time Face Biometrics & Official Mobile OTP active`);
  console.log(`📧 HelpDesk Ticket Dispatcher configured for: parthasarathi3046@gmail.com`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
