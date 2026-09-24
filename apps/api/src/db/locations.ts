import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type { LocationRow } from "../types/database";

export async function getLocationById(
  db: D1Database,
  locationId: string
): Promise<LocationRow | null> {
  return queryOne<LocationRow>(
    db,
    `
      SELECT
        id,
        name,
        active,
        created_at,
        updated_at
      FROM locations
      WHERE id = ?
      LIMIT 1
    `,
    locationId
  );
}

export async function getActiveLocations(
  db: D1Database
): Promise<LocationRow[]> {
  return queryMany<LocationRow>(
    db,
    `
      SELECT
        id,
        name,
        active,
        created_at,
        updated_at
      FROM locations
      WHERE active = 1
      ORDER BY name ASC
    `
  );
}