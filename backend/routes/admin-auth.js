const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const db = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const adminLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// Helper function to generate JWT token for admin
const generateAdminToken = (adminId, canteenId) => {
  return jwt.sign(
    { 
      id: adminId, 
      type: 'admin',
      canteen_id: canteenId 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// @desc    Admin Login
// @route   POST /api/admin/auth/login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = adminLoginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { username, password } = value;

  // Check if admin exists and is active
  const { rows } = await db.execute(`
    SELECT 
      a.admin_id, a.name, a.username, a.password_hash, a.canteen_id, a.role,
      c.name as canteen_name, c.location as canteen_location
    FROM admins a
    JOIN canteens c ON a.canteen_id = c.canteen_id
    WHERE a.username = ? AND a.is_active = true AND c.is_active = true
  `, [username]);

  if (rows.length === 0) {
    throw new AppError('Invalid username or password', 401);
  }

  const admin = rows[0];

  // Check password
  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid username or password', 401);
  }

  // Update last login
  await db.execute(
    'UPDATE admins SET last_login = NOW() WHERE admin_id = ?',
    [admin.admin_id]
  );

  // Generate token
  const token = generateAdminToken(admin.admin_id, admin.canteen_id);

  logger.logUserActivity(admin.admin_id, 'ADMIN_LOGIN', { 
    username: admin.username,
    canteen_id: admin.canteen_id
  });

  res.json({
    success: true,
    message: 'Admin login successful',
    data: {
      admin: {
        admin_id: admin.admin_id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        canteen: {
          canteen_id: admin.canteen_id,
          name: admin.canteen_name,
          location: admin.canteen_location
        }
      },
      token
    }
  });
});

// @desc    Admin Logout
// @route   POST /api/admin/auth/logout
// @access  Private (Admin)
const adminLogout = asyncHandler(async (req, res) => {
  logger.logUserActivity(req.user.admin_id, 'ADMIN_LOGOUT', {
    canteen_id: req.user.canteen_id
  });

  res.json({
    success: true,
    message: 'Admin logout successful'
  });
});

// @desc    Get current admin profile
// @route   GET /api/admin/auth/profile
// @access  Private (Admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  const { rows } = await db.execute(`
    SELECT 
      a.admin_id, a.name, a.username, a.role, a.last_login, a.created_at,
      c.canteen_id, c.name as canteen_name, c.location as canteen_location,
      c.contact as canteen_contact, c.description as canteen_description
    FROM admins a
    JOIN canteens c ON a.canteen_id = c.canteen_id
    WHERE a.admin_id = ?
  `, [req.user.admin_id]);

  if (rows.length === 0) {
    throw new AppError('Admin not found', 404);
  }

  res.json({
    success: true,
    data: {
      admin: rows[0]
    }
  });
});

// Routes
router.post('/login', adminLogin);
router.post('/logout', require('../middleware/authMiddleware').protectAdmin, adminLogout);
router.get('/profile', require('../middleware/authMiddleware').protectAdmin, getAdminProfile);

module.exports = router;