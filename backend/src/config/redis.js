/**
 * Redis Configuration
 * Falls back to in-memory storage when Redis is unavailable in development.
 */

const redis = require('redis');
const { logger } = require('../utils/logger');

let client;
let useMemoryStore = false;
const memoryStore = new Map();

const cleanupExpiredMemoryKeys = () => {
  const now = Date.now();

  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt && entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
};

const patternToRegex = (pattern) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

const connectRedis = async () => {
  if (process.env.REDIS_DISABLED === 'true') {
    useMemoryStore = true;
    logger.warn('Redis disabled via REDIS_DISABLED=true. Using in-memory cache.');
    return;
  }

  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis: Max reconnection attempts reached');
          return new Error('Max reconnection attempts');
        }

        return Math.min(retries * 100, 3000);
      },
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => logger.error('Redis client error:', err));
  client.on('connect', () => logger.info('Redis client connected'));
  client.on('reconnecting', () => logger.warn('Redis client reconnecting...'));

  try {
    await client.connect();
  } catch (error) {
    useMemoryStore = true;
    client = null;
    logger.warn('Redis unavailable. Falling back to in-memory cache.', { error: error.message });
  }
};

const getRedisClient = () => {
  if (useMemoryStore) {
    return null;
  }

  if (!client) {
    throw new Error('Redis not initialized');
  }

  return client;
};

const setMemoryValue = (key, value, ttlSeconds) => {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null,
  });
};

const getMemoryValue = (key) => {
  cleanupExpiredMemoryKeys();
  return memoryStore.get(key)?.value ?? null;
};

const setCache = async (key, value, ttlSeconds = null) => {
  const ttl = ttlSeconds || parseInt(process.env.REDIS_TTL, 10) || 86400;

  if (useMemoryStore) {
    setMemoryValue(key, value, ttl);
    return;
  }

  await getRedisClient().setEx(key, ttl, JSON.stringify(value));
};

const getCache = async (key) => {
  if (useMemoryStore) {
    return getMemoryValue(key);
  }

  const data = await getRedisClient().get(key);
  return data ? JSON.parse(data) : null;
};

const deleteCache = async (key) => {
  if (useMemoryStore) {
    memoryStore.delete(key);
    return;
  }

  await getRedisClient().del(key);
};

const deleteCachePattern = async (pattern) => {
  if (useMemoryStore) {
    cleanupExpiredMemoryKeys();
    const regex = patternToRegex(pattern);

    for (const key of memoryStore.keys()) {
      if (regex.test(key)) {
        memoryStore.delete(key);
      }
    }

    return;
  }

  const keys = await getRedisClient().keys(pattern);
  if (keys.length > 0) {
    await getRedisClient().del(keys);
  }
};

const incrementCounter = async (key, ttlSeconds = 3600) => {
  if (useMemoryStore) {
    const current = Number(getMemoryValue(key) || 0) + 1;
    setMemoryValue(key, current, ttlSeconds);
    return current;
  }

  const redisClient = getRedisClient();
  const value = await redisClient.incr(key);
  if (value === 1) {
    await redisClient.expire(key, ttlSeconds);
  }

  return value;
};

const blacklistToken = async (token, expiresIn) => {
  const ttl = expiresIn || 86400;

  if (useMemoryStore) {
    setMemoryValue(`blacklist:${token}`, '1', ttl);
    return;
  }

  await getRedisClient().setEx(`blacklist:${token}`, ttl, '1');
};

const isTokenBlacklisted = async (token) => {
  if (useMemoryStore) {
    return getMemoryValue(`blacklist:${token}`) === '1';
  }

  const result = await getRedisClient().get(`blacklist:${token}`);
  return result === '1';
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  incrementCounter,
  blacklistToken,
  isTokenBlacklisted,
};
