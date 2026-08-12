const { sendMail } = require('../config/mailer');

// ── Common Styles ─────────────────────────────────────────────────────────────
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CSE Notice System</title>
  <style>
    body { margin:0; padding:0; background:#0f0f1a; font-family:'Segoe UI',Arial,sans-serif; }
    .container { max-width:600px; margin:40px auto; background:#1a1a2e; border-radius:16px; overflow:hidden; border:1px solid #2a2a3e; }
    .header { background:linear-gradient(135deg,#6c63ff,#00d4aa); padding:32px 24px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:24px; font-weight:700; letter-spacing:0.5px; }
    .header p { margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; }
    .body { padding:32px 24px; color:#e0e0e0; }
    .body h2 { color:#ffffff; font-size:20px; margin-top:0; }
    .body p { line-height:1.7; font-size:15px; color:#a0a0b8; margin:12px 0; }
    .credential-box { background:#0f0f1a; border:1px solid #2a2a3e; border-radius:12px; padding:20px 24px; margin:24px 0; }
    .credential-box .label { font-size:12px; color:#606078; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
    .credential-box .value { font-size:16px; color:#ffffff; font-weight:600; margin-bottom:16px; }
    .credential-box .value:last-child { margin-bottom:0; }
    .btn { display:inline-block; background:linear-gradient(135deg,#6c63ff,#8b84ff); color:#fff; text-decoration:none; padding:14px 32px; border-radius:50px; font-size:15px; font-weight:600; margin:16px 0; }
    .warning { background:#2a1a0e; border:1px solid #ffb800; border-radius:8px; padding:12px 16px; color:#ffb800; font-size:13px; margin-top:16px; }
    .footer { background:#0f0f1a; padding:20px 24px; text-align:center; color:#606078; font-size:12px; border-top:1px solid #2a2a3e; }
    .divider { height:1px; background:#2a2a3e; margin:24px 0; }
    .notice-box { background:#0f0f1a; border-left:4px solid #6c63ff; border-radius:0 8px 8px 0; padding:16px 20px; margin:20px 0; }
    .notice-box .notice-title { color:#ffffff; font-size:18px; font-weight:700; margin:0 0 8px; }
    .notice-box .notice-body { color:#a0a0b8; font-size:14px; line-height:1.6; margin:0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 CSE Notice System</h1>
      <p>Department of Computer Science & Engineering</p>
    </div>
    ${content}
    <div class="footer">
      <p>This is an automated message from the CSE Notice Management System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ── 1. Send Credentials Email ─────────────────────────────────────────────────
/**
 * Sends welcome email with login credentials to a newly registered user.
 * @param {Object} user - User document
 * @param {string} temporaryPassword - Plain-text temporary password
 */
const sendCredentialsEmail = async (user, temporaryPassword) => {
  const roleLabel = user.role === 'STUDENT' ? 'Student' : user.role === 'TEACHER' ? 'Teacher' : 'Admin';

  const html = emailWrapper(`
    <div class="body">
      <h2>Welcome to CSE Notice System! 👋</h2>
      <p>Hello <strong style="color:#6c63ff">${user.name}</strong>,</p>
      <p>Your account has been created by the administrator. Use the credentials below to log in to the CSE Notice mobile app.</p>
      
      <div class="credential-box">
        <div class="label">Account Type</div>
        <div class="value">${roleLabel}</div>
        <div class="label">Email</div>
        <div class="value">${user.email}</div>
        <div class="label">Temporary Password</div>
        <div class="value" style="font-family:monospace;font-size:18px;letter-spacing:2px;color:#00d4aa">${temporaryPassword}</div>
      </div>

      <div class="warning">
        ⚠️ For security, you will be required to change this password on your first login.
      </div>

      <div class="divider"></div>
      <p style="color:#606078;font-size:13px;">If you did not expect this email, please contact your department administrator.</p>
    </div>
  `);

  await sendMail({
    to: user.email,
    subject: '🎓 Your CSE Notice App Credentials',
    html,
    text: `Welcome to CSE Notice System!\n\nEmail: ${user.email}\nTemporary Password: ${temporaryPassword}\n\nPlease change your password on first login.`,
  });
};

// ── 2. Send Notice Email (Fallback) ──────────────────────────────────────────
/**
 * Sends a notice via email to students who don't have push tokens.
 * @param {Object} student - Student user document
 * @param {Object} notice - Notice document
 * @param {Object} teacher - Teacher user document
 */
const sendNoticeEmail = async (student, notice, teacher) => {
  const bodyPreview =
    notice.body
      ? notice.body.length > 300
        ? notice.body.substring(0, 300) + '...'
        : notice.body
      : '';

  const html = emailWrapper(`
    <div class="body">
      <h2>📢 New Notice from Your Department</h2>
      <p>Hello <strong style="color:#6c63ff">${student.name}</strong>,</p>
      <p>You have received a new notice from <strong style="color:#00d4aa">${teacher.name}</strong>${teacher.designation ? ` (${teacher.designation})` : ''}.</p>

      <div class="notice-box">
        <div class="notice-title">${notice.title}</div>
        ${bodyPreview ? `<p class="notice-body">${bodyPreview}</p>` : ''}
        ${notice.type === 'PDF' ? `<p style="color:#6c63ff;font-size:13px;margin:8px 0 0;">📄 This notice contains a PDF attachment. Open the app to view it.</p>` : ''}
      </div>

      <p style="color:#606078;font-size:13px;">
        Please open the <strong>CSE Notice App</strong> to read the full notice and reply if needed.
      </p>
      <div class="divider"></div>
      <p style="color:#606078;font-size:13px;">You received this because you are a registered student in the CSE Department.</p>
    </div>
  `);

  await sendMail({
    to: student.email,
    subject: `📢 New Notice: ${notice.title}`,
    html,
    text: `New notice from ${teacher.name}: ${notice.title}\n\n${bodyPreview}`,
  });
};

// ── 3. Password Reset Email ───────────────────────────────────────────────────
/**
 * Sends a password reset link via email.
 * @param {Object} user - User document
 * @param {string} resetToken - JWT reset token
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}reset-password?token=${resetToken}`;

  const html = emailWrapper(`
    <div class="body">
      <h2>🔐 Password Reset Request</h2>
      <p>Hello <strong style="color:#6c63ff">${user.name}</strong>,</p>
      <p>We received a request to reset your password. Use the button below to reset it.</p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>

      <p style="color:#606078;font-size:13px;">Or copy and paste this link into your browser:</p>
      <p style="color:#6c63ff;font-size:13px;word-break:break-all;">${resetUrl}</p>

      <div class="divider"></div>
      <div class="warning">
        ⚠️ This link expires in <strong>15 minutes</strong>. If you didn't request a password reset, please ignore this email.
      </div>
    </div>
  `);

  await sendMail({
    to: user.email,
    subject: '🔐 Reset Your CSE Notice App Password',
    html,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 15 minutes.`,
  });
};

module.exports = { sendCredentialsEmail, sendNoticeEmail, sendPasswordResetEmail };
