import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Use a singleton pattern to reuse the Redis connection
const redisClient =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Export the Redis client (may be null if not configured)
export const redis = redisClient;

// Set up a sliding window rate limiter (10 requests per minute)
export const rateLimiter = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      // Prefix for all keys
      prefix: "@upstash/ratelimit/prompt-optimizer",
    })
  : null;

/**
 * Creates a stable hash for a given string using the Web Crypto API.
 */
export async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Helper to get a cached optimization response.
 */
export async function getCachedOptimization(promptHash: string): Promise<any | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get(`cache:optimize:${promptHash}`);
    return cached ? cached : null;
  } catch (error) {
    console.error("[redis] getCache error:", error);
    return null;
  }
}

/**
 * Helper to cache an optimization response for 24 hours.
 */
export async function cacheOptimization(promptHash: string, data: any): Promise<void> {
  if (!redis) return;
  try {
    // Cache for 24 hours (86400 seconds)
    await redis.set(`cache:optimize:${promptHash}`, data, { ex: 86400 });
  } catch (error) {
    console.error("[redis] setCache error:", error);
  }
}
