import Redis from "ioredis";

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
  }

  return redis;
}

export async function cacheJson<T>(key: string, payload: T, ttlSeconds = 900): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    await client.set(key, JSON.stringify(payload), "EX", ttlSeconds);
  } catch {
    // best effort cache, ignore failures
  }
}

export async function readCachedJson<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
