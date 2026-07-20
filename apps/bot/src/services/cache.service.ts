import type Redis from 'ioredis';
import type { Logger } from '../utils/logger';

/** Small JSON-oriented wrapper over Redis used for conversation memory. */
export class CacheService {
  constructor(
    private readonly redis: Redis,
    private readonly logger?: Logger,
  ) {}

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger?.warn({ err, key }, 'cache get failed');
      return null;
    }
  }

  async setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.set(key, raw, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, raw);
      }
    } catch (err) {
      this.logger?.warn({ err, key }, 'cache set failed');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger?.warn({ err, key }, 'cache del failed');
    }
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
