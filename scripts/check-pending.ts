#!/usr/bin/env npx tsx
// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - CHECK PENDING
// Checks for pending breeding requests (for heartbeat integration)
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
  const tokenId = parseInt(process.env.GENOMAD_TOKEN_ID || "0");

  if (!tokenId) {
    // Silently exit if not configured (for heartbeat)
    process.exit(0);
  }

  const client = createChainClient();

  // Get pending requests
  const pendingResult = await client.getPendingRequests(tokenId);
  if (!pendingResult.success) {
    console.error(`❌ ${pendingResult.error}`);
    process.exit(2);
  }

  const pendingIds = pendingResult.data || [];

  if (pendingIds.length === 0) {
    // No output if no pending requests (quiet mode for heartbeat)
    process.exit(0);
  }

  // We have pending requests - alert!
  console.log("🧬 BREEDING ALERT");
  console.log("═══════════════════════════════════════");
  console.log(`Token #${tokenId} has ${pendingIds.length} pending breeding request(s):`);
  console.log("");

  for (const requestId of pendingIds) {
    const requestResult = await client.getBreedingRequest(requestId);
    if (!requestResult.success || !requestResult.data) continue;

    const request = requestResult.data;
    const isParentA = request.parentATokenId === tokenId;
    const otherParent = isParentA ? request.parentBTokenId : request.parentATokenId;
    const myApproved = isParentA ? request.parentAApproved : request.parentBApproved;
    const otherApproved = isParentA ? request.parentBApproved : request.parentAApproved;
    const myCustody = isParentA ? request.childCustodyA : request.childCustodyB;

    console.log(`📋 Request #${requestId}`);
    console.log(`   Partner: Token #${otherParent}`);
    console.log(`   Your Custody: ${myCustody}%`);
    console.log(`   Your Approval: ${myApproved ? "✅" : "⏳ PENDING"}`);
    console.log(`   Partner Approval: ${otherApproved ? "✅" : "⏳"}`);
    console.log("");

    if (!myApproved) {
      console.log(`   💡 Run: npx tsx approve-breeding.ts ${requestId}`);
      console.log(`   💡 Or:  npx tsx reject-breeding.ts ${requestId}`);
      console.log("");
    }
  }

  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(99);
});
