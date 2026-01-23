const logger = require('../utils/logger');

// Not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.logError(err, req);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    message = 'Duplicate entry - resource already exists';
    statusCode = 400;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    message = 'Referenced resource does not exist';
    statusCode = 400;
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    message = 'Data too long for field';
    statusCode = 400;
  }

  if (err.code === 'ER_BAD_NULL_ERROR') {
    message = 'Required field cannot be null';
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    message = err.details.map(detail => detail.message).join(', ');
    statusCode = 400;
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large';
    statusCode = 400;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files';
    statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field';
    statusCode = 400;
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    message = 'Too many requests, please try again later';
    statusCode = 429;
  }

  const response = {
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  res.status(statusCode).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database connection error handler
const handleDBError = (err, req, res, next) => {
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.error('Database connection error:', err.message);
    return res.status(503).json({
      success: false,
      error: {
        message: 'Service temporarily unavailable. Please try again later.',
        statusCode: 503
      }
    });
  }
  next(err);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  AppError,
  handleDBError
};