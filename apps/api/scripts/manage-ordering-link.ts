#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_NAME = "d-den-corner-db";
const API_DIR = path.resolve(__dirname, "..");

const require = createRequire(import.meta.url);
const wranglerCli = require.resolve("wrangler", { paths: [API_DIR] });

function parseArgs() {
  const args = process.argv.slice(2);
  let isRemote = false;
  let isList = false;
  let tableQuery: string | null = null;
  let customOrigin: string | null = null;
  let isHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--remote" || arg === "-r") {
      isRemote = true;
    } else if (arg === "--list" || arg === "-l") {
      isList = true;
    } else if (arg === "--help" || arg === "-h") {
      isHelp = true;
    } else if (arg === "--origin" && i + 1 < args.length) {
      customOrigin = args[++i];
    } else if (!arg.startsWith("-")) {
      tableQuery = arg;
    }
  }

  return { isRemote, isList, tableQuery, customOrigin, isHelp };
}

function runD1Query(sql: string, isRemote: boolean): any[] {
  // Normalize SQL to single line to prevent newline shell issues across platforms
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
    maxBuffer: 10 * 1024 * 1024,
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
      // If multiple statements were executed, return results from the last statement with results or the first
      const withResults = parsed.filter((p: any) => Array.isArray(p.results) && p.results.length > 0);
      if (withResults.length > 0) {
        return withResults[withResults.length - 1].results;
      }
      return parsed[0].results || [];
    }
    return [];
  } catch (err: any) {
    throw new Error(`Failed to parse D1 JSON output: ${result.stdout}`);
  }
}

function printHelp() {
  console.log(`
========================================================================
D Den Corner - Admin Table Ordering Link & QR Management CLI
========================================================================

Usage:
  pnpm table:link --list [--remote]
  pnpm table:link <tableId-or-name> [--remote] [--origin <url>]

Options:
  --list, -l           List all tables, current session status, and QR link status
  --remote, -r         Execute against remote Cloudflare D1 database (default: local)
  --origin <url>       Specify customer origin URL (default: http://localhost:3000)
  --help, -h           Show this help message

Examples:
  pnpm table:link --list
  pnpm table:link dev-table-1
  pnpm table:link "Table 1"
  pnpm table:link "Table 1" --remote
========================================================================
`);
}

async function listTables(isRemote: boolean) {
  console.log(`\nFetching tables (${isRemote ? "REMOTE" : "LOCAL"} D1)...`);

  const sql = `
    SELECT
      t.id AS table_id,
      t.name AS table_name,
      l.name AS location_name,
      t.active AS table_active,
      (SELECT status FROM table_sessions WHERE table_id = t.id AND status = 'ACTIVE' LIMIT 1) AS session_status,
      (SELECT active FROM qr_tokens WHERE table_id = t.id AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1) AS qr_active,
      (SELECT created_at FROM qr_tokens WHERE table_id = t.id AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1) AS qr_created_at
    FROM tables t
    LEFT JOIN locations l ON l.id = t.location_id
    ORDER BY t.name ASC;
  `;

  const rows = runD1Query(sql, isRemote);

  if (rows.length === 0) {
    console.log("No tables found in database.");
    return;
  }

  console.log("\n" + "=".repeat(85));
  console.log(
    "TABLE ID".padEnd(16) +
    "NAME".padEnd(14) +
    "SESSION".padEnd(12) +
    "ORDER LINK".padEnd(24) +
    "ASSIGNED DATE"
  );
  console.log("-".repeat(85));

  for (const row of rows) {
    const tableId = String(row.table_id).padEnd(16);
    const tableName = String(row.table_name).padEnd(14);
    const session = (row.session_status === "ACTIVE" ? "OPEN" : "CLOSED").padEnd(12);
    let linkStatus = "None";
    if (row.qr_active === 1) {
      linkStatus = "ACTIVE (Accepting)";
    } else if (row.qr_active === 0) {
      linkStatus = "Inactive (Table closed)";
    }
    linkStatus = linkStatus.padEnd(24);
    const assigned = row.qr_created_at ? new Date(row.qr_created_at).toLocaleString() : "Not assigned";

    console.log(`${tableId}${tableName}${session}${linkStatus}${assigned}`);
  }

  console.log("=".repeat(85) + "\n");
}

async function generateOrderingLink(tableQuery: string, isRemote: boolean, customOrigin: string | null) {
  console.log(`\nLooking up table "${tableQuery}" (${isRemote ? "REMOTE" : "LOCAL"} D1)...`);

  const escapedQuery = tableQuery.replace(/'/g, "''");
  const findTableSql = `
    SELECT
      t.id,
      t.name,
      t.active,
      l.name AS location_name,
      (SELECT status FROM table_sessions WHERE table_id = t.id AND status = 'ACTIVE' LIMIT 1) AS session_status
    FROM tables t
    LEFT JOIN locations l ON l.id = t.location_id
    WHERE t.id = '${escapedQuery}' OR LOWER(t.name) = LOWER('${escapedQuery}')
    LIMIT 1;
  `;

  const tables = runD1Query(findTableSql, isRemote);
  if (tables.length === 0) {
    console.error(`Error: Table "${tableQuery}" was not found.`);
    process.exit(1);
  }

  const table = tables[0];
  const tableId = table.id;
  const tableName = table.name;
  const isSessionOpen = table.session_status === "ACTIVE";

  // Generate 32-byte secret opaque token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenId = crypto.randomUUID();
  const tokenActive = isSessionOpen ? 1 : 0;
  const now = new Date().toISOString();

  // Revoke any existing non-revoked QR token and insert the new one
  const updateSql = `
    UPDATE qr_tokens
    SET active = 0, revoked_at = '${now}'
    WHERE table_id = '${tableId}' AND revoked_at IS NULL;

    INSERT INTO qr_tokens (id, table_id, token_hash, raw_token, active, created_at, revoked_at)
    VALUES ('${tokenId}', '${tableId}', '${tokenHash}', '${rawToken}', ${tokenActive}, '${now}', NULL);
  `;

  runD1Query(updateSql, isRemote);

  const origin = customOrigin || process.env.CUSTOMER_ORIGIN || "http://localhost:3000";
  const orderingUrl = `${origin.replace(/\/$/, "")}/menu?token=${rawToken}`;

  console.log("\n" + "=".repeat(75));
  console.log("PERMANENT ORDERING LINK GENERATED (ADMIN ONLY)");
  console.log("=".repeat(75));
  console.log(`Table:          ${tableName} (ID: ${tableId})`);
  console.log(`Location:       ${table.location_name || "N/A"}`);
  console.log(`Session Status: ${isSessionOpen ? "OPEN (Accepting Orders)" : "CLOSED"}`);
  console.log(`Link Status:    ${tokenActive === 1 ? "ACTIVE (Scannable now)" : "INACTIVE (Activates when staff opens table)"}`);
  console.log("-".repeat(75));
  console.log("SCANNABLE ORDERING URL:");
  console.log(`  ${orderingUrl}`);
  console.log("-".repeat(75));
  console.log("SECRET TOKEN:");
  console.log(`  ${rawToken}`);
  console.log("=".repeat(75));
  console.log(`Notice: Encode this URL into the physical QR code sticker for ${tableName}.`);
  console.log("Staff dashboard can NO LONGER rotate, replace, or generate links for tables.\n");
}

async function main() {
  const { isRemote, isList, tableQuery, customOrigin, isHelp } = parseArgs();

  if (isHelp) {
    printHelp();
    return;
  }

  if (isList || !tableQuery) {
    if (!tableQuery && !isList) {
      console.log("No table specified. Listing all tables:");
    }
    await listTables(isRemote);
    if (!tableQuery) {
      console.log("To generate or replace an ordering link, run:");
      console.log("  pnpm table:link <tableId-or-name>\n");
    }
    return;
  }

  await generateOrderingLink(tableQuery, isRemote, customOrigin);
}

main().catch((err) => {
  console.error("\nExecution failed:", err.message || err);
  process.exit(1);
});
