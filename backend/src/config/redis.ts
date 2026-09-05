import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.redisUrl) return null;
  if (!redis) {
    redis = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.warn('[redis] error:', err.message);
    });
  }
  return redis;
}

export async function disconnectRedis() {
  if (redis) await redis.quit();
  redis = null;
}