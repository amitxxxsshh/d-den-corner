import { deleteCookie } from "hono/cookie";
import type { Context } from "hono";

import { getCustomerSessionByTokenHash } from "../db/sessions";
import { getTableSessionById } from "../db/sessions";
import { getTableById } from "../db/tables";
import { execute } from "../db";
import { sha256Hex } from "./crypto";

import type { Bindings } from "../types/env";
import type { CustomerSessionContext } from "../types/auth";

export const CUSTOMER_SESSION_COOKIE =
  "__Host-dd_customer_session";

export function clearCustomerSessionCookie(
  c: Context,
): void {
  deleteCookie(c, CUSTOMER_SESSION_COOKIE, {
    path: "/",
    secure: true,
    sameSite: "Lax",
  });
}

export function getCustomerSessionTokenFromRequest(
  c: Context<{ Bindings: Bindings }>,
): string | null {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      const token = trimmed.slice(7).trim();
      if (token) {
        return token;
      }
    } else if (trimmed && !trimmed.includes(" ")) {
      return trimmed;
    }
  }

  const customHeader = c.req.header("X-Customer-Session");
  if (customHeader) {
    const trimmed = customHeader.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

export async function getCustomerSessionContext(
  c: Context<{ Bindings: Bindings }>,
): Promise<CustomerSessionContext | null> {
  const token = getCustomerSessionTokenFromRequest(c);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);

  const session =
    await getCustomerSessionByTokenHash(
      c.env.DB,
      tokenHash,
    );

  if (!session) {
    return null;
  }

  const expiresAt = new Date(
    session.expires_at,
  ).getTime();

  if (
    Number.isFinite(expiresAt) &&
    expiresAt <= Date.now()
  ) {
    return null;
  }

  const tableSession =
    await getTableSessionById(
      c.env.DB,
      session.table_session_id,
    );

  if (!tableSession) {
    return null;
  }

  if (tableSession.status !== "ACTIVE") {
    return null;
  }

  const table = await getTableById(
    c.env.DB,
    tableSession.table_id,
  );

  if (!table || table.active !== 1) {
    return null;
  }

  await execute(
    c.env.DB,
    `
      UPDATE customer_sessions
      SET last_seen_at = ?
      WHERE id = ?
    `,
    new Date().toISOString(),
    session.id,
  );

  return {
    customerSessionId: session.id,
    tableSessionId: tableSession.id,
    tableId: table.id,
  };
}