import { setCookie } from "hono/cookie";
import { Hono } from "hono";

import { getActiveTableSession } from "../db/sessions";
import { getQRTokenByHash } from "../db/qr";
import { getTableById } from "../db/tables";
import { execute } from "../db";
import { sha256Hex, generateOpaqueToken } from "../utils/crypto";

import type { Bindings } from "../types/env";

const qrRoutes = new Hono<{ Bindings: Bindings }>();

const CUSTOMER_SESSION_COOKIE = "__Host-dd_customer_session";

const CUSTOMER_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

function isValidToken(value: unknown): value is string {
  return typeof value === "string" && value.length >= 16 && value.length <= 512;
}

qrRoutes.post("/join", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        ok: false,
        message: "Invalid JSON request body.",
      },
      400,
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("token" in body) ||
    !isValidToken(body.token)
  ) {
    return c.json(
      {
        ok: false,
        message: "A valid QR token is required.",
      },
      400,
    );
  }

  const qrToken = body.token.trim();

  if (!isValidToken(qrToken)) {
    return c.json(
      {
        ok: false,
        message: "A valid QR token is required.",
      },
      400,
    );
  }

  const tokenHash = await sha256Hex(qrToken);

  const qrTokenRow = await getQRTokenByHash(c.env.DB, tokenHash);

  if (!qrTokenRow || qrTokenRow.active !== 1) {
    return c.json(
      {
        ok: false,
        message: "This QR code is invalid or inactive.",
      },
      401,
    );
  }

  const table = await getTableById(c.env.DB, qrTokenRow.table_id);

  if (!table || table.active !== 1) {
    return c.json(
      {
        ok: false,
        message: "This table is currently unavailable.",
      },
      409,
    );
  }

  const tableSession = await getActiveTableSession(
    c.env.DB,
    qrTokenRow.table_id,
  );

  if (!tableSession) {
    return c.json(
      {
        ok: false,
        message: "This table is not currently open for ordering.",
      },
      409,
    );
  }

  const customerSessionToken = generateOpaqueToken(32);
  const customerSessionTokenHash = await sha256Hex(customerSessionToken);

  const customerSessionId = crypto.randomUUID();

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();

 await execute(
  c.env.DB,
  `
    INSERT INTO customer_sessions (
      id,
      table_session_id,
      session_token_hash,
      expires_at,
      created_at,
      last_seen_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  customerSessionId,
  tableSession.id,
  customerSessionTokenHash,
  expiresAt,
  now.toISOString(),
  now.toISOString(),
);

  setCookie(c, CUSTOMER_SESSION_COOKIE, customerSessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
  maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
});

  return c.json({
    ok: true,
    session: {
      customerSessionId,
      tableSessionId: tableSession.id,
      tableId: table.id,
      tableName: table.name,
      locationId: table.location_id,
      expiresAt,
    },
  });
});

export default qrRoutes;
