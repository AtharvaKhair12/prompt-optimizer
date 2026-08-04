/**
 * MongoDB client singleton — cached globally to prevent connection leaks during HMR.
 * Used by Auth.js adapter and application queries.
 *
 * Safe to import without MONGODB_URI — the client is only instantiated when a
 * valid URI is present. Callers should check `isMongoConfigured()` before use.
 */

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export const isMongoConfigured = !!uri;

if (!isMongoConfigured) {
  console.warn(
    "[mongodb] MONGODB_URI not set — auth and cloud sync features will be unavailable."
  );
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient | null = null;

if (isMongoConfigured) {
  if (process.env.NODE_ENV === "development") {
    // Use a global variable in development to prevent multiple connections during HMR
    const globalWithMongo = global as typeof globalThis & {
      _mongoClient?: MongoClient;
    };
    if (!globalWithMongo._mongoClient) {
      globalWithMongo._mongoClient = new MongoClient(uri!, options);
    }
    client = globalWithMongo._mongoClient;
  } else {
    client = new MongoClient(uri!, options);
  }
}

/**
 * Returns the MongoClient. Throws if MONGODB_URI is not configured.
 */
export function getClient(): MongoClient {
  if (!client) {
    throw new Error(
      "MongoDB is not configured. Set MONGODB_URI in your .env.local file."
    );
  }
  return client;
}

export default client;

/**
 * Get the prompt-optimizer database instance.
 */
export function getDb() {
  return getClient().db();
}

