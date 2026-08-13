import { getDb } from "./mongodb";

// Configuration
const RATE_LIMIT_MAX_REQUESTS = 10;
const CACHE_TTL_SECONDS = 86400; // 24 hours

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
 * Checks if the given identifier has exceeded the rate limit.
 * Uses a Fixed Window counter stored in MongoDB.
 * @returns { success: boolean }
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  try {
    const db = getDb();
    const collection = db.collection("rate_limits");
    
    // Create a TTL index if it doesn't exist (expires documents 2 minutes after their timestamp)
    // Note: In production, it's better to create indexes outside the hot path, but this is safe because ensureIndex caches.
    await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const currentMinute = Math.floor(Date.now() / 60000);
    const windowId = `${identifier}:${currentMinute}`;

    // Upsert the counter for this minute window
    const result = await collection.findOneAndUpdate(
      { _id: windowId as any },
      {
        $inc: { count: 1 },
        $setOnInsert: { expireAt: new Date(Date.now() + 120000) } // Expire in 2 minutes
      },
      { upsert: true, returnDocument: "after" }
    );

    const count = result?.count || 1;
    
    if (count > RATE_LIMIT_MAX_REQUESTS) {
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[ratelimit] error:", error);
    // Fail open if MongoDB is unreachable
    return { success: true };
  }
}

/**
 * Helper to get a cached optimization response from MongoDB.
 */
export async function getCachedOptimization(promptHash: string): Promise<any | null> {
  try {
    const db = getDb();
    const collection = db.collection("cache");
    
    const cached = await collection.findOne({ _id: promptHash as any });
    if (cached && cached.expireAt > new Date()) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error("[cache] getCache error:", error);
    return null;
  }
}

/**
 * Helper to cache an optimization response in MongoDB.
 */
export async function cacheOptimization(promptHash: string, data: any): Promise<void> {
  try {
    const db = getDb();
    const collection = db.collection("cache");
    
    await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    await collection.updateOne(
      { _id: promptHash as any },
      {
        $set: {
          data,
          expireAt: new Date(Date.now() + CACHE_TTL_SECONDS * 1000)
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("[cache] setCache error:", error);
  }
}
