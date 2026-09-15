/**
 * Authentication Controller
 * Handles registration, login, logout, token refresh, password reset
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const { generateTokenPair, verifyRefreshToken, getTokenExpiry } = require('../utils/jwt');
const { blacklistToken, setCache, getCache, deleteCache } = require('../config/redis');
const { ConflictError, AuthenticationError, ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { serialize } = require('../utils/serialize');

const SALT_ROUNDS = 12;

const sanitizeUser = (user) => {
  const safe = serialize(user);
  delete safe.password_hash;
  delete safe.refresh_token_hash;
  delete safe.password_reset_token;
  delete safe.password_reset_expires;
  delete safe.email_verification_token;
  return safe;
};

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, username, password, full_name, timezone } = req.body;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    }).lean();

    if (existing) {
      throw new ConflictError('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = uuidv4();

    const user = await User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      password_hash: passwordHash,
      full_name: full_name || null,
      timezone: timezone || 'UTC',
      email_verification_token: verificationToken,
    });

    const safeUser = sanitizeUser(user);
    const tokens = generateTokenPair(safeUser);

    await setCache(`verify:${verificationToken}`, safeUser.id, 86400);

    logger.info(`New user registered: ${safeUser.email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: safeUser,
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account has been deactivated');
    }

    user.updated_at = new Date();
    await user.save();

    const safeUser = sanitizeUser(user);
    const tokens = generateTokenPair(safeUser);

    logger.info(`User logged in: ${safeUser.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;
    const expiry = getTokenExpiry(token);
    const ttl = expiry ? expiry - Math.floor(Date.now() / 1000) : 86400;

    if (ttl > 0) {
      await blacklistToken(token, ttl);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw new AuthenticationError('Refresh token required');
    }

    const decoded = verifyRefreshToken(refresh_token);
    const user = await User.findById(decoded.id).lean();

    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    const tokens = generateTokenPair(sanitizeUser(user));

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password_reset_token: resetToken,
          password_reset_expires: expiresAt,
        },
      }
    );

    logger.info(`Password reset requested for: ${normalizedEmail}`);

    res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      password_reset_token: token,
      password_reset_expires: { $gt: new Date() },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    user.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: sanitizeUser(req.user) },
  });
};

/**
 * POST /auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = await getCache(`verify:${token}`);

    if (!userId) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        is_verified: true,
        email_verification_token: null,
      },
    });

    await deleteCache(`verify:${token}`);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
};
