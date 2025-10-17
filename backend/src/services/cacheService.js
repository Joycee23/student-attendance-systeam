const redis = require('redis');
const Settings = require('../models/Settings');

/**
 * Cache Service
 * Redis-based caching for performance optimization
 */
class CacheService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  /**
   * Initialize cache service
   */
  async init() {
    try {
      const settings = await Settings.getSettings();

      if (!settings.redisEnabled) {
        console.warn('Redis cache disabled');
        this.enabled = false;
        return;
      }

      this.client = redis.createClient({
        host: settings.redisHost || process.env.REDIS_HOST || 'localhost',
        port: settings.redisPort || process.env.REDIS_PORT || 6379,
        password: settings.redisPassword || process.env.REDIS_PASSWORD,
        db: settings.redisDb || process.env.REDIS_DB || 0
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.enabled = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.enabled = true;
      });

      await this.client.connect();

    } catch (error) {
      console.error('Cache service init error:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable() {
    return this.enabled && this.client && this.client.isOpen;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   */
  async get(key) {
    try {
      if (!this.isAvailable()) return null;

      const value = await this.client.get(key);
      if (value) {
        console.log(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      console.log(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  async set(key, value, ttl = null) {
    try {
      if (!this.isAvailable()) return false;

      const ttlValue = ttl || this.defaultTTL;
      await this.client.setEx(key, ttlValue, JSON.stringify(value));
      console.log(`Cache set: ${key} (TTL: ${ttlValue}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    try {
      if (!this.isAvailable()) return false;

      await this.client.del(key);
      console.log(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys
   * @param {Array} keys - Array of cache keys
   */
  async delMultiple(keys) {
    try {
      if (!this.isAvailable()) return false;

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Cache deleted multiple: ${keys.length} keys`);
      }
      return true;
    } catch (error) {
      console.error('Cache delete multiple error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (!this.isAvailable()) return false;

      await this.client.flushDb();
      console.log('Cache cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   */
  async getKeys(pattern) {
    try {
      if (!this.isAvailable()) return [];

      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      console.error('Cache get keys error:', error);
      return [];
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   */
  async exists(key) {
    try {
      if (!this.isAvailable()) return false;

      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (!this.isAvailable()) {
        return { available: false };
      }

      const info = await this.client.info();
      const dbInfo = info.split('\n').find(line => line.startsWith('db0:'));

      let keyCount = 0;
      if (dbInfo) {
        const match = dbInfo.match(/keys=(\d+)/);
        if (match) keyCount = parseInt(match[1]);
      }

      return {
        available: true,
        keyCount,
        memory: info.split('\n').find(line => line.startsWith('used_memory:')),
        connected_clients: info.split('\n').find(line => line.startsWith('connected_clients:'))
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in seconds
   */
  middleware(ttl = null) {
    return async (req, res, next) => {
      if (!this.isAvailable()) {
        return next();
      }

      const key = this.generateKey(req);

      // Try to get from cache
      const cached = await this.get(key);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Override res.json to cache response
      const originalJson = res.json;
      res.json = (body) => {
        if (res.statusCode < 400) {
          this.set(key, body, ttl);
        }
        return originalJson.call(res, body);
      };

      next();
    };
  }

  /**
   * Generate cache key from request
   */
  generateKey(req) {
    const parts = [
      req.method,
      req.originalUrl,
      JSON.stringify(req.query),
      JSON.stringify(req.body),
      req.user?.id || 'anonymous'
    ];
    return parts.join(':');
  }

  /**
   * Cache user data
   * @param {string} userId - User ID
   * @param {Object} data - User data
   */
  async cacheUser(userId, data) {
    const key = `user:${userId}`;
    await this.set(key, data, 1800); // 30 minutes
  }

  /**
   * Get cached user data
   * @param {string} userId - User ID
   */
  async getCachedUser(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  /**
   * Cache attendance session
   * @param {string} sessionId - Session ID
   * @param {Object} data - Session data
   */
  async cacheSession(sessionId, data) {
    const key = `session:${sessionId}`;
    await this.set(key, data, 3600); // 1 hour
  }

  /**
   * Get cached session
   * @param {string} sessionId - Session ID
   */
  async getCachedSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  /**
   * Cache statistics
   * @param {string} type - Statistics type
   * @param {Object} data - Statistics data
   */
  async cacheStats(type, data) {
    const key = `stats:${type}`;
    await this.set(key, data, 600); // 10 minutes
  }

  /**
   * Get cached statistics
   * @param {string} type - Statistics type
   */
  async getCachedStats(type) {
    const key = `stats:${type}`;
    return await this.get(key);
  }

  /**
   * Invalidate user cache
   * @param {string} userId - User ID
   */
  async invalidateUser(userId) {
    const key = `user:${userId}`;
    await this.del(key);

    // Also invalidate related caches
    const relatedKeys = await this.getKeys(`*:${userId}`);
    await this.delMultiple(relatedKeys);
  }

  /**
   * Invalidate session cache
   * @param {string} sessionId - Session ID
   */
  async invalidateSession(sessionId) {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  /**
   * Graceful shutdown
   */
  async close() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }
}

// Export singleton instance
module.exports = new CacheService();