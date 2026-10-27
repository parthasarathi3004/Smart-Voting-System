const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendSupportTicketEmail, TARGET_SUPPORT_EMAIL } = require('../services/mailer');
const { getState, updateState } = require('../services/db');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `ticket-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/ticket', upload.single('attachment'), async (req, res) => {
  try {
    const { name, email, phone, issue } = req.body;

    if (!name || !issue) {
      return res.status(400).json({
        success: false,
        message: 'Name and issue description are required.'
      });
    }

    const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();
    const attachmentPath = req.file ? req.file.path : null;
    const originalFilename = req.file ? req.file.originalname : null;

    const ticket = {
      id: ticketId,
      name: name.trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      issue: issue.trim(),
      attachmentPath,
      originalFilename,
      timestamp,
      status: 'DISPATCHED_TO_SUPPORT'
    };

    updateState(s => {
      if (!s.supportTickets) s.supportTickets = [];
      s.supportTickets.push(ticket);
    });

    // Send email to parthasarathi3046@gmail.com
    const mailResult = await sendSupportTicketEmail({
      ticketId,
      name: ticket.name,
      phone: ticket.phone,
      issue: ticket.issue,
      attachmentPath,
      originalFilename,
      timestamp
    });

    return res.status(201).json({
      success: true,
      message: 'Ticket submitted. Support has been notified.',
      ticketId,
      targetEmail: TARGET_SUPPORT_EMAIL,
      previewUrl: mailResult.previewUrl
    });
  } catch (err) {
    console.error('Support ticket error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch support ticket: ' + err.message
    });
  }
});

// View tickets list (Admin view)
router.get('/tickets', (req, res) => {
  const state = getState();
  res.json({
    success: true,
    tickets: state.supportTickets || []
  });
});

module.exports = router;
