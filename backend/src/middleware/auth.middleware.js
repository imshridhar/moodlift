/**
 * Authentication & Authorization Middleware
 */

const { verifyAccessToken } = require('../utils/jwt');
const { isTokenBlacklisted } = require('../config/redis');
const { User } = require('../models');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const { serialize } = require('../utils/serialize');

/**
 * Authenticate user via Bearer token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    req.user = serialize(user);
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findOne({
      _id: decoded.id,
      is_active: true,
    }).lean();

    if (user) {
      req.user = serialize(user);
    }
  } catch (error) {
    // Continue without auth for optional endpoints.
  }

  next();
};

/**
 * Require premium subscription
 */
const requirePremium = (req, res, next) => {
  if (!req.user?.is_premium) {
    return next(new AuthorizationError('Premium subscription required'));
  }

  next();
};

/**
 * Require email verification
 */
const requireVerified = (req, res, next) => {
  if (!req.user?.is_verified) {
    return next(new AuthorizationError('Email verification required'));
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePremium,
  requireVerified,
};
