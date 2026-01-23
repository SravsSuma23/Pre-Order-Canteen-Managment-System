const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { protect, sensitiveRateLimit } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  password: Joi.string().min(6).required(),
  upi_id: Joi.string().optional(),
  role: Joi.string().valid('student', 'faculty').default('student')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Helper function to create user session
const createUserSession = async (userId, token, req) => {
  const sessionId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.execute(
    'INSERT INTO user_sessions (session_id, user_id, token_hash, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      sessionId,
      userId,
      await bcrypt.hash(token, 10),
      req.get('User-Agent') || 'Unknown',
      req.ip,
      expiresAt
    ]
  );

  return sessionId;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { name, email, phone, password, upi_id, role } = value;

  // Check if user already exists
  const { rows: existingUsers } = await db.execute(
    'SELECT user_id FROM users WHERE email = ? OR phone = ?',
    [email, phone]
  );

  if (existingUsers.length > 0) {
    throw new AppError('User with this email or phone already exists', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const userId = uuidv4();
  await db.execute(
    'INSERT INTO users (user_id, name, email, phone, password_hash, upi_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, name, email, phone, hashedPassword, upi_id || null, role]
  );

  // Generate token and create session
  const token = generateToken(userId);
  const sessionId = await createUserSession(userId, token, req);

  logger.logUserActivity(userId, 'USER_REGISTERED', { email, role });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        user_id: userId,
        name,
        email,
        phone,
        role,
        upi_id
      },
      token,
      sessionId
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, password } = value;

  // Check if user exists
  const { rows } = await db.execute(
    'SELECT user_id, name, email, phone, password_hash, role, upi_id, is_active FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new AppError('Account is deactivated. Please contact administrator', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token and create session
  const token = generateToken(user.user_id);
  const sessionId = await createUserSession(user.user_id, token, req);

  logger.logUserActivity(user.user_id, 'USER_LOGIN', { email });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        upi_id: user.upi_id
      },
      token,
      sessionId
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await db.execute(
    'SELECT user_id, name, email, phone, role, upi_id, created_at FROM users WHERE user_id = ?',
    [req.user.user_id]
  );

  if (rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: rows[0]
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const updateSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    upi_id: Joi.string().optional()
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { name, phone, upi_id } = value;

  // Check if phone already exists for another user
  if (phone) {
    const { rows: existingUsers } = await db.execute(
      'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
      [phone, req.user.user_id]
    );

    if (existingUsers.length > 0) {
      throw new AppError('Phone number already in use', 400);
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (upi_id !== undefined) {
    updates.push('upi_id = ?');
    values.push(upi_id);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push('updated_at = NOW()');
  values.push(req.user.user_id);

  await db.execute(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
    values
  );

  // Get updated user data
  const { rows } = await db.execute(
    'SELECT user_id, name, email, phone, role, upi_id, created_at FROM users WHERE user_id = ?',
    [req.user.user_id]
  );

  logger.logUserActivity(req.user.user_id, 'PROFILE_UPDATED', value);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: rows[0]
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { currentPassword, newPassword } = value;

  // Get current password hash
  const { rows } = await db.execute(
    'SELECT password_hash FROM users WHERE user_id = ?',
    [req.user.user_id]
  );

  if (rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  await db.execute(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
    [hashedNewPassword, req.user.user_id]
  );

  // Invalidate all existing sessions
  await db.execute(
    'UPDATE user_sessions SET is_active = false WHERE user_id = ?',
    [req.user.user_id]
  );

  logger.logUserActivity(req.user.user_id, 'PASSWORD_CHANGED');

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Invalidate current session
  const token = req.headers.authorization.split(' ')[1];
  
  await db.execute(
    'UPDATE user_sessions SET is_active = false WHERE user_id = ? AND token_hash = ?',
    [req.user.user_id, await bcrypt.hash(token, 10)]
  );

  logger.logUserActivity(req.user.user_id, 'USER_LOGOUT');

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  // Invalidate all sessions for user
  await db.execute(
    'UPDATE user_sessions SET is_active = false WHERE user_id = ?',
    [req.user.user_id]
  );

  logger.logUserActivity(req.user.user_id, 'LOGOUT_ALL_DEVICES');

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// Apply rate limiting to sensitive routes
router.post('/register', sensitiveRateLimit(15 * 60 * 1000, 3), register);
router.post('/login', sensitiveRateLimit(15 * 60 * 1000, 5), login);
router.put('/password', protect, sensitiveRateLimit(15 * 60 * 1000, 3), changePassword);

// Regular routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;