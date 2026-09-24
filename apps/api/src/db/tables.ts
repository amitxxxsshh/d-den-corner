import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type { TableRow } from "../types/database";

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