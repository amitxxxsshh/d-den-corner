#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_NAME = "d-den-corner-db";
const API_DIR = path.resolve(__dirname, "..");
const SEED_SQL_PATH = path.resolve(__dirname, "seed-menu.sql");

const require = createRequire(import.meta.url);
const wranglerCli = require.resolve("wrangler", { paths: [API_DIR] });

function parseArgs() {
  const args = process.argv.slice(2);
  let isRemote = true;

  for (const arg of args) {
    if (arg === "--local") {
      isRemote = false;
    } else if (arg === "--remote" || arg === "-r") {
      isRemote = true;
    }
  }

  return { isRemote };
}

function runD1File(filePath: string, isRemote: boolean) {
  console.log(`\nExecuting ${path.basename(filePath)} against ${isRemote ? "REMOTE" : "LOCAL"} database (${DB_NAME})...`);

  const cmdArgs = [
    wranglerCli,
    "d1",
    "execute",
    DB_NAME,
    isRemote ? "--remote" : "--local",
    "--file",
    filePath,
    "-y",
  ];

  const result = spawnSync(process.execPath, cmdArgs, {
    cwd: API_DIR,
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Failed to execute wrangler: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`D1 seed execution failed: ${result.stderr || result.stdout}`);
  }

  console.log("SQL seed file executed successfully.\n");
}

function runD1Query(sql: string, isRemote: boolean): any[] {
  const normalizedSql = sql.replace(/\r?\n/g, " ").trim();

  const cmdArgs = [
    wranglerCli,
    "d1",
    "execute",
    DB_NAME,
    isRemote ? "--remote" : "--local",
    "--json",
    "--command",
    normalizedSql,
  ];

  const result = spawnSync(process.execPath, cmdArgs, {
    cwd: API_DIR,
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Failed to execute wrangler: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`D1 query failed: ${result.stderr || result.stdout}`);
  }

  try {
    const parsed = JSON.parse(result.stdout);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].results || [];
    }
    return [];
  } catch (err: any) {
    throw new Error(`Failed to parse D1 JSON output: ${err.message}`);
  }
}

async function main() {
  const { isRemote } = parseArgs();

  console.log("=================================================");
  console.log(`D DEN CORNER — POPULATING COMPLETE MENU CATALOG`);
  console.log(`Target: ${isRemote ? "REMOTE D1 (Production source of truth)" : "LOCAL SQLite/D1"}`);
  console.log("=================================================");

  // 1. Run the SQL seed file
  runD1File(SEED_SQL_PATH, isRemote);

  // 2. Verification query: Active Categories
  const categoryResults = runD1Query(
    "SELECT id, name, sort_order, active FROM menu_categories WHERE active = 1 ORDER BY sort_order ASC;",
    isRemote
  );

  // 3. Verification query: Available Menu Items in Active Categories
  const itemResults = runD1Query(
    `
      SELECT
        mi.id,
        mi.name,
        mi.price_minor,
        mc.name AS category_name,
        mc.sort_order
      FROM menu_items mi
      INNER JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.available = 1 AND mi.archived = 0 AND mc.active = 1
      ORDER BY mc.sort_order ASC, mi.rowid ASC;
    `,
    isRemote
  );

  // 4. Verification query: Total items count in table (including legacy test items)
  const allItemsCountResults = runD1Query(
    "SELECT count(*) as total_items FROM menu_items;",
    isRemote
  );

  console.log("=================================================");
  console.log("VERIFICATION SUMMARY");
  console.log("=================================================");
  console.log(`Active Categories: ${categoryResults.length} (Expected: 22)`);
  console.log(`Active Menu Items: ${itemResults.length} (Expected: 143)`);
  console.log(`Total Menu Items in DB: ${allItemsCountResults[0]?.total_items} (including legacy dev items)`);
  console.log("-------------------------------------------------");
  console.log("Categories Breakdown:");

  const itemsByCat = new Map<string, any[]>();
  for (const item of itemResults) {
    const list = itemsByCat.get(item.category_name) || [];
    list.push(item);
    itemsByCat.set(item.category_name, list);
  }

  for (const cat of categoryResults) {
    const count = itemsByCat.get(cat.name)?.length || 0;
    console.log(`  ${String(cat.sort_order).padStart(2, " ")}. ${cat.name.padEnd(46, " ")} -> ${count} items`);
  }

  console.log("=================================================");
  if (categoryResults.length === 22 && itemResults.length === 143) {
    console.log("✅ ALL 22 CATEGORIES AND 143 MENU ITEMS SUCCESSFULLY VERIFIED!");
  } else {
    console.error("❌ Discrepancy detected in category or item count!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
