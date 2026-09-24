import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type { QRTokenRow } from "../types/database";

export async function getQRTokenByHash(
  db: D1Database,
  tokenHash: string
): Promise<QRTokenRow | null> {
  return queryOne<QRTokenRow>(
    db,
    `
      SELECT
        id,
        table_id,
        token_hash,
        active,
        created_at,
        revoked_at
      FROM qr_tokens
      WHERE token_hash = ?
      LIMIT 1
    `,
    tokenHash
  );
}

export async function getActiveQRTokenForTable(
  db: D1Database,
  tableId: string
): Promise<QRTokenRow | null> {
  return queryOne<QRTokenRow>(
    db,
    `
      SELECT
        id,
        table_id,
        token_hash,
        active,
        created_at,
        revoked_at
      FROM qr_tokens
      WHERE table_id = ?
        AND active = 1
        AND revoked_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    tableId
  );
}

export async function getQRTokensForTable(
  db: D1Database,
  tableId: string
): Promise<QRTokenRow[]> {
  return queryMany<QRTokenRow>(
    db,
    `
      SELECT
        id,
        table_id,
        token_hash,
        active,
        created_at,
        revoked_at
      FROM qr_tokens
      WHERE table_id = ?
      ORDER BY created_at DESC
    `,
    tableId
  );
}