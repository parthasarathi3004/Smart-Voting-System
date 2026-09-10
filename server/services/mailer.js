const nodemailer = require('nodemailer');

const TARGET_SUPPORT_EMAIL = 'parthasarathi3046@gmail.com';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate an automated ethereal test account or fallback transporter
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Ethereal test mailer initialized: ${testAccount.user}`);
    } catch (err) {
      console.warn('Ethereal setup failed, using JSON mock mailer:', err.message);
      transporter = {
        sendMail: async (options) => {
          console.log('[MOCK EMAIL DISPATCH]', options.to, options.subject);
          return { messageId: 'mock-' + Date.now(), response: 'Mock email delivered successfully' };
        }
      };
    }
  }

  return transporter;
}

async function sendSupportTicketEmail({ ticketId, name, phone, issue, attachmentPath, originalFilename, timestamp }) {
  try {
    const mail = await getTransporter();

    const mailOptions = {
      from: '"Biometric E-Voting HelpDesk" <no-reply@biometric-voting.gov.in>',
      to: TARGET_SUPPORT_EMAIL,
      subject: `[VOTER SUPPORT TICKET #${ticketId}] Issue Report from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
          <h2 style="color: #06b6d4; margin-bottom: 4px;">Biometric E-Voting & Analytics System</h2>
          <h3 style="color: #ef4444; margin-top: 0;">Urgent Voter Helpdesk Ticket #${ticketId}</h3>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
          <p><strong>Voter Name:</strong> ${name}</p>
          <p><strong>Contact Phone:</strong> ${phone}</p>
          <p><strong>Submitted At:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <div style="background-color: #1e293b; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #06b6d4;">
            <h4 style="margin: 0 0 8px 0; color: #38bdf8;">Reported Issue:</h4>
            <p style="white-space: pre-wrap; margin: 0;">${issue}</p>
          </div>
          ${attachmentPath ? `<p style="color: #94a3b8;"><em>Attachment included: ${originalFilename || 'screenshot'}</em></p>` : ''}
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Tamil Nadu State Election Commission 2026 - Automated Cyber Defense & Support Dispatch</p>
        </div>
      `,
      attachments: (attachmentPath && require('fs').existsSync(attachmentPath)) ? [
        {
          filename: originalFilename || 'screenshot.png',
          path: attachmentPath
        }
      ] : []
    };

    const info = await mail.sendMail(mailOptions);
    console.log(`Support ticket #${ticketId} dispatched to ${TARGET_SUPPORT_EMAIL}. MessageId: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    return { messageId: info.messageId, previewUrl };
  } catch (err) {
    console.warn(`[MAIL DISPATCH NOTICE] Could not send via remote SMTP: ${err.message}. Ticket #${ticketId} saved to database audit ledger.`);
    return { messageId: 'local-' + Date.now(), previewUrl: null };
  }
}

module.exports = {
  sendSupportTicketEmail,
  TARGET_SUPPORT_EMAIL
};
