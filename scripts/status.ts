#!/usr/bin/env npx tsx
// ═══════════════════════════════════════════════════════════════════
// GENOMAD CHAIN AGENT - STATUS
// Shows on-chain status of the agent
// ═══════════════════════════════════════════════════════════════════

import { createChainClient } from "../lib/chain-client";
import { TRAIT_NAMES } from "../lib/types";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load env from skill directory or workspace
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
    console.error("❌ GENOMAD_TOKEN_ID not set in .env.genomad");
    process.exit(1);
  }

  console.log("🧬 Genomad Agent Status");
  console.log("═══════════════════════════════════════");

  const client = createChainClient();
  const chainInfo = client.getChainInfo();
  
  console.log(`Network: ${chainInfo.name} (${chainInfo.id})`);
  console.log(`Token ID: ${tokenId}`);
  console.log("");

  // Get agent data
  const agentResult = await client.getAgentData(tokenId);
  if (!agentResult.success || !agentResult.data) {
    console.error(`❌ ${agentResult.error}`);
    process.exit(2);
  }

  const agent = agentResult.data;

  console.log(`Active: ${agent.isActive ? "✅ Yes" : "❌ No"}`);
  console.log(`Generation: ${agent.generation}`);
  console.log(`Fitness: ${agent.fitness}`);
  console.log(`Created: ${new Date(agent.createdAt * 1000).toISOString()}`);
  console.log("");

  // Parents
  if (agent.generation > 0) {
    console.log(`Parents: A=${agent.parentA}, B=${agent.parentB}`);
    console.log("");
  }

  // Traits
  console.log("Traits:");
  TRAIT_NAMES.forEach((name, i) => {
    const value = agent.traits[i];
    const bar = "█".repeat(Math.floor(value / 10)) + "░".repeat(10 - Math.floor(value / 10));
    console.log(`  ${name.padEnd(12)} ${bar} ${value}`);
  });
  console.log("");

  // Custody
  if (ownerAddress) {
    const custodyResult = await client.getCustody(tokenId, ownerAddress);
    if (custodyResult.success && custodyResult.data !== undefined) {
      console.log(`Custody: ${custodyResult.data}%`);
    }
  }

  // All custody holders
  const allCustody = await client.getAllCustody(tokenId);
  if (allCustody.success && allCustody.data && allCustody.data.length > 0) {
    console.log("");
    console.log("Custody Holders:");
    for (const holder of allCustody.data) {
      console.log(`  ${holder.holder.slice(0, 10)}...${holder.holder.slice(-8)} → ${holder.percentage}%`);
    }
  }

  // DNA Hash
  console.log("");
  console.log(`DNA Hash: ${agent.dnaHash.slice(0, 18)}...`);
  
  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("✅ Status check complete");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(99);
});
