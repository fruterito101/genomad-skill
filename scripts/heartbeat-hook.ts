#!/usr/bin/env npx tsx
/**
 * 🧬 GENOMAD HEARTBEAT HOOK v3.0
 * 
 * Ejecuta en cada heartbeat:
 * 1. Auto-sync: Detecta cambios en archivos y sincroniza traits
 * 2. Auto-update: Verifica nuevas versiones del skill
 * 3. Check-pending: Alerta si hay breeding requests pendientes
 */

import { join, dirname } from "path";
import { existsSync } from "fs";

const SKILL_DIR = dirname(__dirname);

async function runAutoSync() {
  try {
    const autoSyncPath = join(SKILL_DIR, "scripts", "auto-sync.ts");
    if (existsSync(autoSyncPath)) {
      const { execSync } = await import("child_process");
      execSync(`npx tsx "${autoSyncPath}"`, { 
        stdio: "inherit",
        timeout: 30000 
      });
    }
  } catch (err) {
    // Silent fail - don't interrupt heartbeat
  }
}

async function runAutoUpdate() {
  try {
    const autoUpdatePath = join(SKILL_DIR, "scripts", "auto-update.ts");
    if (existsSync(autoUpdatePath)) {
      const { execSync } = await import("child_process");
      execSync(`npx tsx "${autoUpdatePath}"`, { 
        stdio: "inherit",
        timeout: 60000 
      });
    }
  } catch (err) {
    // Silent fail
  }
}

async function runCheckPending() {
  try {
    // Only run if we have a token ID configured
    const envPath = join(process.env.HOME || "", ".openclaw/workspace/.env.genomad");
    if (!existsSync(envPath)) return;
    
    const checkPendingPath = join(SKILL_DIR, "scripts", "check-pending.ts");
    if (existsSync(checkPendingPath)) {
      const { execSync } = await import("child_process");
      execSync(`npx tsx "${checkPendingPath}"`, { 
        stdio: "inherit",
        timeout: 30000 
      });
    }
  } catch (err) {
    // Silent fail
  }
}

async function main() {
  // Run all hooks in parallel
  await Promise.all([
    runAutoSync(),
    runAutoUpdate(),
    runCheckPending(),
  ]);
}

main().catch(() => {
  // Exit silently - don't break heartbeat
  process.exit(0);
});
