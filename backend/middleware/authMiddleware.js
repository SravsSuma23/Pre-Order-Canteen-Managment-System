const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { asyncHandler, AppError } = require('./errorMiddleware');
const logger = require('../utils/logger');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
      const { rows } = await db.execute(
        'SELECT user_id, name, email, phone, role, is_active FROM users WHERE user_id = ?',
        [decoded.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        throw new AppError('User not found or inactive', 401);
      }

      // Check if session is valid
      const { rows: sessions } = await db.execute(
        'SELECT session_id FROM user_sessions WHERE user_id = ? AND is_active = true AND expires_at > NOW()',
        [decoded.id]
      );

      if (sessions.length === 0) {
        throw new AppError('Session expired', 401);
      }

      req.user = rows[0];
      next();
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token', 401);
      } else if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401);
      } else {
        throw error;
      }
    }
  }

  if (!token) {
    throw new AppError('Not authorized, no token', 401);
  }
});

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(`Role '${req.user.role}' is not authorized to access this resource`, 403);
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { rows } = await db.execute(
        'SELECT user_id, name, email, phone, role, is_active FROM users WHERE user_id = ? AND is_active = true',
        [decoded.id]
      );

      if (rows.length > 0) {
        req.user = rows[0];
      }
    } catch (error) {
      // Don't throw error for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }

  next();
});

// Check if user owns resource or is admin
const checkOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authorized', 401);
    }

    // Admin and canteen_staff can access any resource
    if (['admin', 'canteen_staff'].includes(req.user.role)) {
      return next();
    }

    // Get user ID from request (params, body, or query)
    const resourceUserId = req.params[userIdField] || 
                          req.body[userIdField] || 
                          req.query[userIdField];

    if (!resourceUserId) {
      throw new AppError('Resource user ID not provided', 400);
    }

    if (req.user.user_id !== resourceUserId) {
      throw new AppError('Not authorized to access this resource', 403);
    }

    next();
  };
};

// Canteen access control
const canteenAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError('Not authorized', 401);
  }

  // Admin can access all canteens
  if (req.user.role === 'admin') {
    return next();
  }

  // Canteen staff can only access their assigned canteen
  if (req.user.role === 'canteen_staff') {
    const canteenId = req.params.canteenId || req.body.canteen_id;
    
    if (!canteenId) {
      throw new AppError('Canteen ID not provided', 400);
    }

    // Check if staff is assigned to this canteen (you might need a staff_canteens table)
    const { rows } = await db.execute(
      'SELECT * FROM staff_canteen_assignments WHERE user_id = ? AND canteen_id = ? AND is_active = true',
      [req.user.user_id, canteenId]
    );

    if (rows.length === 0) {
      throw new AppError('Not authorized to access this canteen', 403);
    }
  }

  next();
});

// Protect admin routes - verify admin JWT token
const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an admin token
      if (decoded.type !== 'admin') {
        throw new AppError('Invalid admin token', 401);
      }

      // Check if admin still exists and is active
      const { rows } = await db.execute(
        'SELECT admin_id, name, username, canteen_id, role, is_active FROM admins WHERE admin_id = ?',
        [decoded.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        throw new AppError('Admin not found or inactive', 401);
      }

      // Add admin info to request
      req.user = {
        admin_id: rows[0].admin_id,
        name: rows[0].name,
        username: rows[0].username,
        canteen_id: rows[0].canteen_id,
        role: rows[0].role,
        type: 'admin'
      };
      
      next();
    } catch (error) {
      logger.error('Admin token verification failed:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid admin token', 401);
      } else if (error.name === 'TokenExpiredError') {
        throw new AppError('Admin token expired', 401);
      } else {
        throw error;
      }
    }
  }

  if (!token) {
    throw new AppError('Not authorized, no admin token', 401);
  }
});

// Rate limiting for sensitive endpoints
const sensitiveRateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.ip + (req.user?.user_id || 'anonymous');
    const now = Date.now();
    
    if (!requests.has(identifier)) {
      requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const requestData = requests.get(identifier);
    
    if (now > requestData.resetTime) {
      requestData.count = 1;
      requestData.resetTime = now + windowMs;
      return next();
    }

    if (requestData.count >= max) {
      throw new AppError('Too many requests, please try again later', 429);
    }

    requestData.count++;
    next();
  };
};

module.exports = {
  protect,
  protectAdmin,
  authorize,
  optionalAuth,
  checkOwnership,
  canteenAccess,
  sensitiveRateLimit
};
