const express = require('express');
const router = express.Router();
const { calculateAnalytics } = require('../services/analyticsEngine');

router.get('/', (req, res) => {
  const { district, constituency, session } = req.query;
  try {
    const analytics = calculateAnalytics(district, constituency, session || 'ACTIVE');
    res.json({
      success: true,
      analytics
    });

  } catch (err) {
    console.error('Analytics calculation error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to compute election analytics: ' + err.message
    });
  }
});

module.exports = router;
