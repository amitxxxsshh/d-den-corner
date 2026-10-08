import type { D1Database } from "@cloudflare/workers-types";

import {
  execute,
  queryMany,
  queryOne,
} from "./index";

import type {
  CustomerSessionRow,
  TableSessionRow,
} from "../types/database";

export async function getActiveTableSession(
  db: D1Database,
  tableId: string,
): Promise<TableSessionRow | null> {
  return queryOne<TableSessionRow>(
    db,
    `
      SELECT
        id,
        table_id,
        status,
        started_at,
        closed_at,
        created_at
      FROM table_sessions
      WHERE table_id = ?
        AND status = 'ACTIVE'
      ORDER BY started_at DESC
      LIMIT 1
    `,
    tableId,
  );
}

export async function getTableSessionById(
  db: D1Database,
  tableSessionId: string,
): Promise<TableSessionRow | null> {
  return queryOne<TableSessionRow>(
    db,
    `
      SELECT
        id,
        table_id,
        status,
        started_at,
        closed_at,
        created_at
      FROM table_sessions
      WHERE id = ?
      LIMIT 1
    `,
    tableSessionId,
  );
}

export async function createTableSession(
  db: D1Database,
  tableId: string,
): Promise<TableSessionRow> {
  const existing =
    await getActiveTableSession(
      db,
      tableId,
    );

  if (existing) {
    return existing;
  }

  const id =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  await execute(
    db,
    `
      INSERT INTO table_sessions (
        id,
        table_id,
        status,
        started_at,
        closed_at,
        created_at
      )
      VALUES (
        ?,
        ?,
        'ACTIVE',
        ?,
        NULL,
        ?
      )
    `,
    id,
    tableId,
    now,
    now,
  );

  const session =
    await getTableSessionById(
      db,
      id,
    );

  if (!session) {
    throw new Error(
      "TABLE_SESSION_CREATE_FAILED",
    );
  }

  return session;
}

export async function closeTableSession(
  db: D1Database,
  tableSessionId: string,
  staffUserId?: string | null,
): Promise<TableSessionRow | null> {
  const existing =
    await getTableSessionById(
      db,
      tableSessionId,
    );

  if (!existing) {
    return null;
  }

  if (existing.status === "CLOSED") {
    return existing;
  }

  const closedAt =
    new Date().toISOString();

  await execute(
    db,
    `
      UPDATE table_sessions
      SET
        status = 'CLOSED',
        closed_at = ?
      WHERE id = ?
        AND status = 'ACTIVE'
    `,
    closedAt,
    tableSessionId,
  );

  // Complete any active orders for this table session so they transition to SERVED in Order History
  const activeOrders = await queryMany<{ id: string; status: string }>(
    db,
    `
      SELECT id, status
      FROM orders
      WHERE table_session_id = ?
        AND status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY')
    `,
    tableSessionId,
  );

  for (const ord of activeOrders) {
    await execute(
      db,
      `
        UPDATE orders
        SET
          status = 'SERVED',
          accepted_at = CASE WHEN accepted_at IS NULL THEN ? ELSE accepted_at END,
          updated_at = ?
        WHERE id = ?
      `,
      closedAt,
      closedAt,
      ord.id,
    );

    await execute(
      db,
      `
        INSERT INTO order_status_history (
          id,
          order_id,
          from_status,
          to_status,
          changed_by_user_id,
          created_at
        )
        VALUES (?, ?, ?, 'SERVED', ?, ?)
      `,
      crypto.randomUUID(),
      ord.id,
      ord.status,
      staffUserId || null,
      closedAt,
    );
  }

  return getTableSessionById(
    db,
    tableSessionId,
  );
}

export async function getCustomerSessionByTokenHash(
  db: D1Database,
  tokenHash: string,
): Promise<CustomerSessionRow | null> {
  return queryOne<CustomerSessionRow>(
    db,
    `
      SELECT
        id,
        table_session_id,
        session_token_hash,
        expires_at,
        created_at,
        last_seen_at
      FROM customer_sessions
      WHERE session_token_hash = ?
      LIMIT 1
    `,
    tokenHash,
  );
}

export async function getCustomerSessionsForTableSession(
  db: D1Database,
  tableSessionId: string,
): Promise<CustomerSessionRow[]> {
  return queryMany<CustomerSessionRow>(
    db,
    `
      SELECT
        id,
        table_session_id,
        session_token_hash,
        expires_at,
        created_at,
        last_seen_at
      FROM customer_sessions
      WHERE table_session_id = ?
      ORDER BY created_at ASC
    `,
    tableSessionId,
  );
}