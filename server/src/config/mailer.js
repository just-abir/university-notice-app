const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection on startup (non-blocking)
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Mailer connection issue:', error.message);
  } else {
    console.log('✅ Mailer ready (Gmail SMTP)');
  }
});

/**
 * Send an email
 * @param {Object} options - Mail options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 */
const sendMail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || `"CSE Notice System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    ...(text && { text }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = { transporter, sendMail };
