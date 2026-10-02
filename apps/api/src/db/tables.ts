import type { D1Database } from "@cloudflare/workers-types";

import { execute, queryMany, queryOne } from "./index";
import type { TableRow } from "../types/database";

export async function createTable(
  db: D1Database,
  data: {
    id: string;
    locationId: string;
    name: string;
  },
): Promise<TableRow> {
  const now = new Date().toISOString();

  await execute(
    db,
    `
      INSERT INTO tables (
        id,
        location_id,
        name,
        active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 1, ?, ?)
    `,
    data.id,
    data.locationId,
    data.name,
    now,
    now,
  );

  const row = await getTableById(db, data.id);
  if (!row) {
    throw new Error("TABLE_CREATE_FAILED");
  }

  return row;
}

export async function getTableById(
  db: D1Database,
  tableId: string
): Promise<TableRow | null> {
  return queryOne<TableRow>(
    db,
    `
      SELECT
        id,
        location_id,
        name,
        active,
        created_at,
        updated_at
      FROM tables
      WHERE id = ?
      LIMIT 1
    `,
    tableId
  );
}

export async function getTablesByLocation(
  db: D1Database,
  locationId: string
): Promise<TableRow[]> {
  return queryMany<TableRow>(
    db,
    `
      SELECT
        id,
        location_id,
        name,
        active,
        created_at,
        updated_at
      FROM tables
      WHERE location_id = ?
      ORDER BY name ASC
    `,
    locationId
  );
}

export async function getActiveTablesByLocation(
  db: D1Database,
  locationId: string
): Promise<TableRow[]> {
  return queryMany<TableRow>(
    db,
    `
      SELECT
        id,
        location_id,
        name,
        active,
        created_at,
        updated_at
      FROM tables
      WHERE location_id = ?
        AND active = 1
      ORDER BY name ASC
    `,
    locationId
  );
}

export async function deleteTable(
  db: D1Database,
  tableId: string
): Promise<boolean> {
  const table = await getTableById(db, tableId);
  if (!table) {
    return false;
  }

  // Safely delete all dependent records for this table in dependency order:
  // 1. Order items and status history for orders belonging to this table's sessions
  // 2. Orders belonging to this table's sessions
  // 3. Customer sessions belonging to this table's sessions
  // 4. Table sessions belonging to this table
  // 5. QR tokens belonging to this table
  // 6. The table itself
  await db.batch([
    db.prepare(`
      DELETE FROM order_items
      WHERE order_id IN (
        SELECT id FROM orders
        WHERE table_session_id IN (
          SELECT id FROM table_sessions WHERE table_id = ?
        )
      )
    `).bind(tableId),
    db.prepare(`
      DELETE FROM order_status_history
      WHERE order_id IN (
        SELECT id FROM orders
        WHERE table_session_id IN (
          SELECT id FROM table_sessions WHERE table_id = ?
        )
      )
    `).bind(tableId),
    db.prepare(`
      DELETE FROM orders
      WHERE table_session_id IN (
        SELECT id FROM table_sessions WHERE table_id = ?
      )
    `).bind(tableId),
    db.prepare(`
      DELETE FROM customer_sessions
      WHERE table_session_id IN (
        SELECT id FROM table_sessions WHERE table_id = ?
      )
    `).bind(tableId),
    db.prepare(`
      DELETE FROM table_sessions
      WHERE table_id = ?
    `).bind(tableId),
    db.prepare(`
      DELETE FROM qr_tokens
      WHERE table_id = ?
    `).bind(tableId),
    db.prepare(`
      DELETE FROM tables
      WHERE id = ?
    `).bind(tableId),
  ]);

  return true;
}