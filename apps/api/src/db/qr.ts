import type { D1Database } from "@cloudflare/workers-types";

import {
  execute,
  queryMany,
  queryOne,
} from "./index";

import {
  generateOpaqueToken,
  sha256Hex,
} from "../utils/crypto";

import type {
  QRTokenRow,
} from "../types/database";

export async function getQRTokenByHash(
  db: D1Database,
  tokenHash: string,
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
    tokenHash,
  );
}

export async function getActiveQRTokenForTable(
  db: D1Database,
  tableId: string,
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
    tableId,
  );
}

/*
 * Returns the current non-revoked QR assigned to a table,
 * regardless of whether it is currently active.
 *
 * This is important because the physical QR is fixed.
 * Closing a table deactivates this QR temporarily.
 * Opening the table activates the same QR again.
 */
export async function getCurrentQRTokenForTable(
  db: D1Database,
  tableId: string,
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
        AND revoked_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    tableId,
  );
}

export async function getQRTokensForTable(
  db: D1Database,
  tableId: string,
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
    tableId,
  );
}

/*
 * Activate/deactivate the existing fixed QR.
 *
 * This does NOT create a new token.
 */
export async function setQRTokenActive(
  db: D1Database,
  qrTokenId: string,
  active: boolean,
): Promise<QRTokenRow | null> {
  await execute(
    db,
    `
      UPDATE qr_tokens
      SET
        active = ?
      WHERE id = ?
        AND revoked_at IS NULL
    `,
    active ? 1 : 0,
    qrTokenId,
  );

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
      WHERE id = ?
      LIMIT 1
    `,
    qrTokenId,
  );
}

export async function revokeQRToken(
  db: D1Database,
  qrTokenId: string,
): Promise<QRTokenRow | null> {
  const now =
    new Date().toISOString();

  await execute(
    db,
    `
      UPDATE qr_tokens
      SET
        active = 0,
        revoked_at = ?
      WHERE id = ?
        AND revoked_at IS NULL
    `,
    now,
    qrTokenId,
  );

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
      WHERE id = ?
      LIMIT 1
    `,
    qrTokenId,
  );
}

/*
 * Creates/replaces the physical QR assigned to a table.
 *
 * This should NOT be called during normal table opening.
 */
export async function createQRToken(
  db: D1Database,
  tableId: string,
): Promise<{
  row: QRTokenRow;
  token: string;
}> {
  const existing =
    await getCurrentQRTokenForTable(
      db,
      tableId,
    );

  if (existing) {
    await revokeQRToken(
      db,
      existing.id,
    );
  }

  const token =
    generateOpaqueToken(32);

  const tokenHash =
    await sha256Hex(token);

  const id =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  await execute(
    db,
    `
      INSERT INTO qr_tokens (
        id,
        table_id,
        token_hash,
        active,
        created_at,
        revoked_at
      )
      VALUES (
        ?,
        ?,
        ?,
        1,
        ?,
        NULL
      )
    `,
    id,
    tableId,
    tokenHash,
    now,
  );

  const row =
    await queryOne<QRTokenRow>(
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
        WHERE id = ?
        LIMIT 1
      `,
      id,
    );

  if (!row) {
    throw new Error(
      "QR_TOKEN_CREATE_FAILED",
    );
  }

  return {
    row,
    token,
  };
}