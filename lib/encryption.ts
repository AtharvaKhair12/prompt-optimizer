/**
 * AES-256-GCM encryption/decryption for API key storage.
 * Keys are encrypted before writing to MongoDB and decrypted only server-side.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Support both hex (64 chars) and base64 (44 chars) formats
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars or 44 base64 chars)"
    );
  }
  return buf;
}

export interface EncryptedData {
  iv: string;
  tag: string;
  ciphertext: string;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns base64-encoded iv, auth tag, and ciphertext.
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted,
  };
}

/**
 * Decrypt data that was encrypted with `encrypt()`.
 * Returns the original plaintext string.
 */
export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, "base64");
  const tag = Buffer.from(data.tag, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data.ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
