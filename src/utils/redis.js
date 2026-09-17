const { createClient } = require("redis");
const logger = require('../utils/logger');

const inMemoryStore = new Map();

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        return false; // Stop reconnecting after 3 attempts if Redis is down
      }
      return Math.min(retries * 500, 2000);
    }
  }
});

client.on('error', (err) => {
  logger.warn(`Redis notice: ${err.message}`);
});

const connectRedis = async () => {
  if (!client.isOpen) {
    try {
      await client.connect();
      logger.info('Successfully connected to Redis!');
    } catch (err) {
      logger.warn(`Redis connection unavailable (${err.message}). Using in-memory fallback store.`);
    }
  }
};

const setUserOnline = async (userId, socketId) => {
  try {
    if (client.isOpen) {
      await client.set(`user:${userId}`, socketId);
    } else {
      inMemoryStore.set(`user:${userId}`, socketId);
    }
    logger.debug(`Set user ${userId} online`);
  } catch (err) {
    inMemoryStore.set(`user:${userId}`, socketId);
  }
};

const setUserOffline = async (userId) => {
  try {
    if (client.isOpen) {
      await client.del(`user:${userId}`);
    } else {
      inMemoryStore.delete(`user:${userId}`);
    }
    logger.debug(`Set user ${userId} offline`);
  } catch (err) {
    inMemoryStore.delete(`user:${userId}`);
  }
};

const getSocketIdForUser = async (userId) => {
  try {
    if (client.isOpen) {
      return await client.get(`user:${userId}`);
    } else {
      return inMemoryStore.get(`user:${userId}`) || null;
    }
  } catch (err) {
    return inMemoryStore.get(`user:${userId}`) || null;
  }
};

module.exports = { client, connectRedis, getSocketIdForUser, setUserOffline, setUserOnline };