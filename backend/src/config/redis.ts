/**
 * Redis Configuration
 *
 * Provides Redis connection for BullMQ job queues
 */

import Redis from 'ioredis';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Redis');

/**
 * Redis connection configuration
 */
const useTLS = process.env.REDIS_TLS === 'true';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || (useTLS ? '6380' : '6379'), 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  tls: useTLS ? {} : undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,    // Required for BullMQ
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

/**
 * Create Redis connection
 */
export function createRedisConnection(): Redis {
  const redis = new Redis(redisConfig);

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redis;
}

/**
 * Get Redis connection options for BullMQ
 */
export function getRedisConnectionOptions() {
  return redisConfig;
}

export default { createRedisConnection, getRedisConnectionOptions };
