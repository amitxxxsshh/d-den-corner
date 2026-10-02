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