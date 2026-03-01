#!/usr/bin/env npx tsx
// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - CHECK CUSTODY
// Displays custody information for the agent
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
  const ownerAddress = process.env.GENOMAD_OWNER_ADDRESS || "";

  if (!tokenId) {
    console.error("❌ GENOMAD_TOKEN_ID not set");
    process.exit(1);
  }

  console.log("🔐 Custody Check");
  console.log("═══════════════════════════════════════");
  console.log(`Token ID: ${tokenId}`);
  console.log("");

  const client = createChainClient();

  // Get all custody holders
  const allCustody = await client.getAllCustody(tokenId);
  if (!allCustody.success) {
    console.error(`❌ ${allCustody.error}`);
    process.exit(2);
  }

  const holders = allCustody.data || [];
  
  if (holders.length === 0) {
    console.log("⚠️ No custody holders found");
    console.log("Agent may not be activated yet");
    process.exit(0);
  }

  console.log("Custody Distribution:");
  console.log("");

  let total = 0;
  for (const holder of holders) {
    const isYou = ownerAddress && holder.holder.toLowerCase() === ownerAddress.toLowerCase();
    const bar = "█".repeat(Math.floor(holder.percentage / 10)) + "░".repeat(10 - Math.floor(holder.percentage / 10));
    console.log(`  ${holder.holder.slice(0, 10)}...${holder.holder.slice(-8)} ${isYou ? "(YOU)" : ""}`);
    console.log(`  ${bar} ${holder.percentage}%`);
    console.log("");
    total += holder.percentage;
  }

  console.log("═══════════════════════════════════════");
  console.log(`Total: ${total}%`);
  
  // Explain thresholds
  console.log("");
  console.log("Thresholds:");
  console.log("  ≥50% → Can activate");
  console.log("  >50% → Can deactivate");
  console.log("  100% → Can update on-chain data");
  
  if (ownerAddress) {
    const yourCustody = holders.find(
      h => h.holder.toLowerCase() === ownerAddress.toLowerCase()
    )?.percentage || 0;
    
    console.log("");
    console.log("Your Permissions:");
    console.log(`  Activate:   ${yourCustody >= 50 ? "✅" : "❌"}`);
    console.log(`  Deactivate: ${yourCustody > 50 ? "✅" : "❌"}`);
    console.log(`  Update:     ${yourCustody >= 100 ? "✅" : "❌"}`);
  }

  console.log("");
  console.log("✅ Custody check complete");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(99);
});
