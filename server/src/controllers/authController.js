const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

// ── Token Generators ──────────────────────────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Include password for comparison (select: false by default)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store hashed refresh token
  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  // Remove sensitive fields
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  res.status(200).json({
    success: true,
    data: {
      user: userObj,
      accessToken,
      refreshToken,
    },
  });
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ _id: decoded.userId, refreshToken: hashedToken });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Refresh token is invalid or has been revoked' });
  }

  const newAccessToken = generateAccessToken(user._id);

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken },
  });
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
const updateMe = async (req, res) => {
  const allowedFields = ['name', 'profilePicture', 'expoPushToken'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updated = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: { user: updated } });
};

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(oldPassword))) {
    return res.status(400).json({ success: false, message: 'Old password is incorrect' });
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always respond with success to avoid user enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  }

  const resetToken = jwt.sign({ userId: user._id, purpose: 'reset' }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (error) {
    console.error('Failed to send reset email:', error.message);
    // Don't fail the request even if email fails
  }

  res.status(200).json({
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
  });
};

// ── POST /api/auth/reset-password ────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
  }

  if (decoded.purpose !== 'reset') {
    return res.status(400).json({ success: false, message: 'Invalid reset token' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
};

module.exports = { login, refreshToken, logout, getMe, updateMe, changePassword, forgotPassword, resetPassword };
