import type { Context } from "hono";

import {
  sha256Hex,
} from "./crypto";

import type { Bindings } from "../types/env";

const SESSION_COOKIE =
  "ddc_staff_session";

export type StaffUser = {
  id: string;
  email: string;
  role: "STAFF" | "ADMIN";
};

function getSessionToken(
  c: Context<{
    Bindings: Bindings;
  }>,
): string | null {
  const cookieHeader =
    c.req.header("Cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] =
      cookie.trim().split("=");

    if (name === SESSION_COOKIE) {
      return decodeURIComponent(
        valueParts.join("="),
      );
    }
  }

  return null;
}

export async function getStaffUser(
  c: Context<{
    Bindings: Bindings;
  }>,
): Promise<StaffUser | null> {
  const token =
    getSessionToken(c);

  if (!token) {
    return null;
  }

  const tokenHash =
    await sha256Hex(token);

  const user =
    await c.env.DB.prepare(
      `
      SELECT
        u.id,
        u.email,
        u.role
      FROM staff_sessions s
      INNER JOIN users u
        ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.expires_at > datetime('now')
        AND u.active = 1
      LIMIT 1
      `,
    )
      .bind(tokenHash)
      .first<StaffUser>();

  if (!user) {
    return null;
  }

  await c.env.DB.prepare(
    `
    UPDATE staff_sessions
    SET last_seen_at = CURRENT_TIMESTAMP
    WHERE token_hash = ?
    `,
  )
    .bind(tokenHash)
    .run();

  return user;
}

export async function requireStaff(
  c: Context<{
    Bindings: Bindings;
  }>,
): Promise<StaffUser | Response> {
  const user =
    await getStaffUser(c);

  if (!user) {
    return c.json(
      {
        ok: false,
        message:
          "Staff authentication is required.",
      },
      401,
    );
  }

  return user;
}