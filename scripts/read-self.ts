#!/usr/bin/env npx tsx
// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - READ SELF
// Reads and decrypts SOUL.md and IDENTITY.md from on-chain storage
// ═══════════════════════════════════════════════════════════════════

import { createChainClient } from "../lib/chain-client";
import { decryptSoul, decryptIdentity } from "../lib/encryption";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load env
const envPaths = [
  path.join(process.cwd(), ".env.genomad"),
  path.join(process.env.HOME || "", ".openclaw/workspace/.env.genomad"),
  path.join(__dirname, "..", ".env.genomad"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

async function main() {
  const tokenId = parseInt(process.env.GENOMAD_TOKEN_ID || "0");
  const ownerAddress = process.env.GENOMAD_OWNER_ADDRESS || "";

  if (!tokenId) {
    console.error("❌ GENOMAD_TOKEN_ID not set");
    process.exit(1);
  }

  if (!ownerAddress) {
    console.error("❌ GENOMAD_OWNER_ADDRESS not set (needed for decryption)");
    process.exit(1);
  }

  console.log("🔐 Reading On-Chain Data...");
  console.log(`Token ID: ${tokenId}`);
  console.log("");

  const client = createChainClient();

  // Get encrypted data
  const result = await client.getEncryptedData(tokenId);
  if (!result.success || !result.data) {
    console.error(`❌ ${result.error}`);
    process.exit(2);
  }

  const { soulCiphertext, identityCiphertext, lastUpdated } = result.data;

  if (!soulCiphertext || soulCiphertext === "") {
    console.log("⚠️ No encrypted data found on-chain");
    console.log("Run sync-identity.ts to upload your data");
    process.exit(0);
  }

  console.log(`Last Updated: ${new Date(lastUpdated * 1000).toISOString()}`);
  console.log("");

  // Decrypt SOUL.md
  console.log("═══════════════════════════════════════");
  console.log("📜 SOUL.md");
  console.log("═══════════════════════════════════════");
  try {
    const soul = decryptSoul(soulCiphertext, ownerAddress);
    console.log(soul);
  } catch (err) {
    console.error("❌ Failed to decrypt SOUL.md:", err instanceof Error ? err.message : "Unknown error");
  }

  console.log("");

  // Decrypt IDENTITY.md
  console.log("═══════════════════════════════════════");
  console.log("🪪 IDENTITY.md");
  console.log("═══════════════════════════════════════");
  try {
    const identity = decryptIdentity(identityCiphertext, ownerAddress);
    console.log(identity);
  } catch (err) {
    console.error("❌ Failed to decrypt IDENTITY.md:", err instanceof Error ? err.message : "Unknown error");
  }

  console.log("");
  console.log("✅ Read complete");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(99);
});
