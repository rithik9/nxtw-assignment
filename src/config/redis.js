const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redis = null;
let isConnected = false;

try {
  // initialize redis client with recovery and connection limits
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false, // don't queue commands when offline to fail fast
    connectTimeout: 2000,      // wait max 2s to connect
  });

  redis.on('connect', () => {
    isConnected = true;
    console.log('Redis connected successfully!');
  });

  redis.on('error', (err) => {
    isConnected = false;
    // log silently so we don't spam console, but warn developers
    console.warn('Redis connection failed. Caching is disabled temporarily.');
  });
} catch (err) {
  console.warn('Could not initialize Redis client. Caching is disabled.');
}

// helper to get keys matching a pattern
async function getKeysByPattern(pattern) {
  if (!isConnected || !redis) return [];
  let cursor = '0';
  let matchedKeys = [];
  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        matchedKeys.push(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn('Redis scan error:', err);
  }
  return matchedKeys;
}

// helper to delete keys matching a pattern (invalidation)
async function invalidateKeys(pattern) {
  if (!isConnected || !redis) return;
  try {
    const keys = await getKeysByPattern(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn('Redis key invalidation failed:', err);
  }
}

// safe wrappers to prevent app crashes if redis goes offline
async function getCache(key) {
  if (!isConnected || !redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 300) {
  if (!isConnected || !redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    // silently fail
  }
}

module.exports = {
  redis,
  isConnected: () => isConnected,
  getCache,
  setCache,
  invalidateKeys,
};
