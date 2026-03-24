interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}

setInterval(cleanExpired, 60000);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        const val = await redis.get<T>(key);
        return val;
      } catch {
        // fall through to memory cache
      }
    }

    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value as T;
  },

  async set(key: string, value: unknown, ttlSeconds: number = 60): Promise<void> {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        await redis.set(key, value, { ex: ttlSeconds });
        return;
      } catch {
        // fall through to memory cache
      }
    }

    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        await redis.del(key);
        return;
      } catch {
        // fall through
      }
    }
    memoryCache.delete(key);
  },
};
