/**
 * MongoDB migration placeholder
 * Collections and indexes are managed through Mongoose schemas.
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const { logger } = require('../utils/logger');

async function migrate() {
  try {
    await connectDB();
    logger.info('MongoDB connection verified. No SQL migration is required.');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
