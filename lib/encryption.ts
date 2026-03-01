// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - ENCRYPTION
// AES-256-GCM with wallet-derived key
// ═══════════════════════════════════════════════════════════════════

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16;
const SALT = "genomad-agent-v1"; // Consistent salt for key derivation

/**
 * Derives an encryption key from wallet address
 * Uses SHA-256 to create a 32-byte key
 */
export function deriveKeyFromWallet(walletAddress: string): Buffer {
  const normalized = walletAddress.toLowerCase();
  const combined = `${SALT}:${normalized}`;
  return createHash("sha256").update(combined).digest();
}

/**
 * Encrypts data using AES-256-GCM
 * Returns: iv:ciphertext:authTag (hex encoded)
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return [
    iv.toString("hex"),
    encrypted,
    authTag.toString("hex"),
  ].join(":");
}

/**
 * Decrypts data using AES-256-GCM
 * Input format: iv:ciphertext:authTag (hex encoded)
 */
export function decrypt(ciphertext: string, key: Buffer): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }
  
  const [ivHex, encryptedHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString("utf8");
}

/**
 * Encrypts SOUL.md content for on-chain storage
 */
export function encryptSoul(content: string, walletAddress: string): string {
  const key = deriveKeyFromWallet(walletAddress);
  return encrypt(content, key);
}

/**
 * Decrypts SOUL.md content from on-chain storage
 */
export function decryptSoul(ciphertext: string, walletAddress: string): string {
  const key = deriveKeyFromWallet(walletAddress);
  return decrypt(ciphertext, key);
}

/**
 * Encrypts IDENTITY.md content for on-chain storage
 */
export function encryptIdentity(content: string, walletAddress: string): string {
  const key = deriveKeyFromWallet(walletAddress);
  return encrypt(content, key);
}

/**
 * Decrypts IDENTITY.md content from on-chain storage
 */
export function decryptIdentity(ciphertext: string, walletAddress: string): string {
  const key = deriveKeyFromWallet(walletAddress);
  return decrypt(ciphertext, key);
}

/**
 * Creates a hash of the content for verification
 */
export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Generates a secure random nonce
 */
export function generateNonce(): string {
  return randomBytes(32).toString("hex");
}
