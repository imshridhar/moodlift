/**
 * Global Error Handler Middleware
 */

const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Default to 500
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // MongoDB duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
    const field = Object.keys(err.keyPattern || {})[0];
    if (field) {message = `${field} is already in use`;}
  } else if (err.name === 'CastError' || err.name === 'BSONError') {
    statusCode = 400;
    code = 'INVALID_FORMAT';
    message = 'Invalid MongoDB id or data format';
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors)[0]?.message || 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  } else {
    logger.warn('Client error:', {
      statusCode,
      code,
      message,
      url: req.url,
      method: req.method,
    });
  }

  // Hide internals in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'An unexpected error occurred. Please try again later.';
    details = null;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
};

module.exports = errorHandler;
