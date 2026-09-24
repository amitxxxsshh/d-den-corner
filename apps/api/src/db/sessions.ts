import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type {
  CustomerSessionRow,
  TableSessionRow,
} from "../types/database";

export async function getActiveTableSession(
  db: D1Database,
  tableId: string
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
    tableId
  );
}

export async function getTableSessionById(
  db: D1Database,
  tableSessionId: string
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
    tableSessionId
  );
}

export async function getCustomerSessionByTokenHash(
  db: D1Database,
  tokenHash: string
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
    tokenHash
  );
}

export async function getCustomerSessionsForTableSession(
  db: D1Database,
  tableSessionId: string
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
    tableSessionId
  );
}