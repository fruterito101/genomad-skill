#!/usr/bin/env npx tsx
// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - APPROVE BREEDING
// Approves a breeding request on-chain
// ═══════════════════════════════════════════════════════════════════

import { createChainClient } from "../lib/chain-client";
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
  // Parse args
  const args = process.argv.slice(2);
  let requestId: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--request-id" && args[i + 1]) {
      requestId = parseInt(args[i + 1]);
    } else if (!args[i].startsWith("--") && !requestId) {
      requestId = parseInt(args[i]);
    }
  }

  if (!requestId || isNaN(requestId)) {
    console.error("❌ Usage: approve-breeding.ts --request-id <id>");
    console.error("   or:   approve-breeding.ts <id>");
    process.exit(1);
  }

  const tokenId = parseInt(process.env.GENOMAD_TOKEN_ID || "0");
  const privateKey = process.env.GENOMAD_AGENT_PRIVATE_KEY;

  if (!tokenId) {
    console.error("❌ GENOMAD_TOKEN_ID not set");
    process.exit(1);
  }

  if (!privateKey) {
    console.error("❌ GENOMAD_AGENT_PRIVATE_KEY not set (needed to sign transaction)");
    process.exit(1);
  }

  console.log("🧬 Approve Breeding Request");
  console.log("═══════════════════════════════════════");
  console.log(`Request ID: ${requestId}`);
  console.log(`Your Token: ${tokenId}`);
  console.log("");

  const client = createChainClient({ privateKey });

  // Get request details first
  const requestResult = await client.getBreedingRequest(requestId);
  if (!requestResult.success || !requestResult.data) {
    console.error(`❌ ${requestResult.error}`);
    process.exit(5);
  }

  const request = requestResult.data;

  // Verify this agent is involved
  if (request.parentATokenId !== tokenId && request.parentBTokenId !== tokenId) {
    console.error(`❌ This agent (${tokenId}) is not part of this breeding request`);
    console.error(`   Request involves tokens ${request.parentATokenId} and ${request.parentBTokenId}`);
    process.exit(4);
  }

  // Show request details
  console.log("Request Details:");
  console.log(`  Parent A: Token #${request.parentATokenId}`);
  console.log(`  Parent B: Token #${request.parentBTokenId}`);
  console.log(`  Status: ${request.status}`);
  console.log(`  A Approved: ${request.parentAApproved ? "✅" : "⏳"}`);
  console.log(`  B Approved: ${request.parentBApproved ? "✅" : "⏳"}`);
  console.log(`  Child Custody: A=${request.childCustodyA}%, B=${request.childCustodyB}%`);
  console.log("");

  if (request.status !== "pending") {
    console.error(`❌ Request is not pending (status: ${request.status})`);
    process.exit(5);
  }

  // Check if already approved by this side
  const isParentA = request.parentATokenId === tokenId;
  const alreadyApproved = isParentA ? request.parentAApproved : request.parentBApproved;

  if (alreadyApproved) {
    console.log("✅ Already approved by this agent");
    process.exit(0);
  }

  // Approve
  console.log("📝 Sending approval transaction...");
  const result = await client.approveBreeding(requestId);

  if (!result.success) {
    console.error(`❌ ${result.error}`);
    process.exit(3);
  }

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("✅ Breeding approved!");
  console.log(`TX: ${result.txHash}`);

  // Check if both approved now
  const updatedRequest = await client.getBreedingRequest(requestId);
  if (updatedRequest.success && updatedRequest.data) {
    const both = updatedRequest.data.parentAApproved && updatedRequest.data.parentBApproved;
    if (both) {
      console.log("");
      console.log("🎉 Both parents approved! Breeding can now be executed.");
    }
  }
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(99);
});
