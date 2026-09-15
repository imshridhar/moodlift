/**
 * MoodLift API Server
 * Production-ready Express.js application
 */

'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { logger } = require('./utils/logger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const authRoutes = require('./routes/auth.routes');
const moodRoutes = require('./routes/mood.routes');
const journalRoutes = require('./routes/journal.routes');
const userRoutes = require('./routes/user.routes');
const quoteRoutes = require('./routes/quote.routes');
const insightRoutes = require('./routes/insight.routes');
const notificationRoutes = require('./routes/notification.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const extraRoutes = require('./routes/_extra.routes');
const coachRoutes = require('./routes/coach.routes');
const playbookRoutes = require('./routes/playbook.routes');
const challengeRoutes = require('./routes/challenge.routes');
const profileRoutes = require('./routes/profile.routes');
const interventionRoutes = require('./routes/intervention.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const triggerRoutes = require('./routes/trigger.routes');
const searchRoutes = require('./routes/search.routes');
const storageRoutes = require('./routes/storage.routes');
const privacyRoutes = require('./routes/privacy.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

app.use(API_PREFIX, limiter);
app.use(`${API_PREFIX}/auth/login`, authLimiter);
app.use(`${API_PREFIX}/auth/register`, authLimiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  }));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/moods`, moodRoutes);
app.use(`${API_PREFIX}/journal`, journalRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/profile`, profileRoutes);
app.use(`${API_PREFIX}/quotes`, quoteRoutes);

// Mount extra endpoints (like / and /overview) before the standard routers
app.use(`${API_PREFIX}/insights`, extraRoutes.insightRouter);
app.use(`${API_PREFIX}/insights`, insightRoutes);

app.use(`${API_PREFIX}/notifications`, notificationRoutes);

app.use(`${API_PREFIX}/analytics`, extraRoutes.analyticsRouter);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

app.use(`${API_PREFIX}/coach`, coachRoutes);
app.use(`${API_PREFIX}/playbooks`, playbookRoutes);
app.use(`${API_PREFIX}/challenges`, challengeRoutes);
app.use(`${API_PREFIX}/interventions`, interventionRoutes);
app.use(`${API_PREFIX}/recommendations`, recommendationRoutes);
app.use(`${API_PREFIX}/triggers`, triggerRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/files`, storageRoutes);
app.use(`${API_PREFIX}/privacy`, privacyRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    await connectRedis();
    logger.info('Cache layer ready');

    const server = app.listen(PORT, () => {
      logger.info(`MoodLift API running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base: http://localhost:${PORT}${API_PREFIX}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

module.exports = app;
