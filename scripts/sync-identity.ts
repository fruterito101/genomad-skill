#!/usr/bin/env npx tsx
// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - SYNC IDENTITY
// Encrypts and uploads SOUL.md/IDENTITY.md to Monad
// ═══════════════════════════════════════════════════════════════════

import { createChainClient } from "../lib/chain-client";
import { encryptSoul, encryptIdentity, generateNonce, hashContent } from "../lib/encryption";
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

// Find workspace files
function findWorkspaceFile(filename: string): string | null {
  const searchPaths = [
    path.join(process.cwd(), filename),
    path.join(process.env.HOME || "", ".openclaw/workspace", filename),
    path.join(process.env.HOME || "", "clawd", filename),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

async function main() {
  const tokenId = parseInt(process.env.GENOMAD_TOKEN_ID || "0");
  const privateKey = process.env.GENOMAD_AGENT_PRIVATE_KEY;
  const ownerAddress = process.env.GENOMAD_OWNER_ADDRESS || "";

  if (!tokenId) {
    console.error("❌ GENOMAD_TOKEN_ID not set");
    process.exit(1);
  }

  if (!privateKey) {
    console.error("❌ GENOMAD_AGENT_PRIVATE_KEY not set (needed to sign transaction)");
    process.exit(1);
  }

  if (!ownerAddress) {
    console.error("❌ GENOMAD_OWNER_ADDRESS not set (needed for encryption)");
    process.exit(1);
  }

  console.log("🔄 Sync Identity to Monad");
  console.log("═══════════════════════════════════════");
  console.log(`Token ID: ${tokenId}`);
  console.log("");

  // Find and read files
  const soulPath = findWorkspaceFile("SOUL.md");
  const identityPath = findWorkspaceFile("IDENTITY.md");

  if (!soulPath) {
    console.error("❌ SOUL.md not found in workspace");
    process.exit(1);
  }

  if (!identityPath) {
    console.error("❌ IDENTITY.md not found in workspace");
    process.exit(1);
  }

  console.log(`📄 SOUL.md: ${soulPath}`);
  console.log(`📄 IDENTITY.md: ${identityPath}`);
  console.log("");

  const soulContent = fs.readFileSync(soulPath, "utf-8");
  const identityContent = fs.readFileSync(identityPath, "utf-8");

  // Validate content
  if (soulContent.length < 200) {
    console.error("❌ SOUL.md too short (min 200 chars)");
    process.exit(1);
  }

  if (identityContent.length < 100) {
    console.error("❌ IDENTITY.md too short (min 100 chars)");
    process.exit(1);
  }

  // Generate content hashes for verification
  const soulHash = hashContent(soulContent).slice(0, 16);
  const identityHash = hashContent(identityContent).slice(0, 16);

  console.log(`SOUL hash: ${soulHash}...`);
  console.log(`IDENTITY hash: ${identityHash}...`);
  console.log("");

  // Encrypt
  console.log("🔐 Encrypting...");
  const nonce = generateNonce();
  const soulCiphertext = encryptSoul(soulContent, ownerAddress);
  const identityCiphertext = encryptIdentity(identityContent, ownerAddress);

  console.log(`  SOUL: ${soulCiphertext.length} chars encrypted`);
  console.log(`  IDENTITY: ${identityCiphertext.length} chars encrypted`);
  console.log("");

  // Check current on-chain data
  const client = createChainClient({ privateKey });
  
  const currentData = await client.getEncryptedData(tokenId);
  if (currentData.success && currentData.data?.soulCiphertext) {
    console.log("📊 Current on-chain data found");
    console.log(`   Last updated: ${new Date(currentData.data.lastUpdated * 1000).toISOString()}`);
    console.log("");
  }

  // Check custody
  const custodyResult = await client.getCustody(tokenId, ownerAddress);
  if (!custodyResult.success || (custodyResult.data || 0) < 100) {
    console.error(`❌ Need 100% custody to update data (you have ${custodyResult.data || 0}%)`);
    process.exit(4);
  }

  // Upload
  console.log("📤 Uploading to Monad...");
  const result = await client.updateEncryptedData(
    tokenId,
    soulCiphertext,
    identityCiphertext,
    nonce
  );

  if (!result.success) {
    console.error(`❌ ${result.error}`);
    process.exit(3);
  }

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("✅ Identity synced to Monad!");
  console.log(`TX: ${result.txHash}`);
  console.log("");
  console.log("Your SOUL.md and IDENTITY.md are now encrypted on-chain.");
  console.log("Only you (with your wallet) can decrypt them.");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(99);
});
