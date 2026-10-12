import { Hono } from "hono";
import type { Context } from "hono";

import {
  generateOpaqueToken,
  hashPassword,
  sha256Hex,
  verifyPassword,
} from "../utils/crypto";

import type { Bindings } from "../types/env";

const SESSION_COOKIE =
  "ddc_staff_session";

const staffAuthRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function getCookie(
  c: Context<{
    Bindings: Bindings;
  }>,
  name: string,
): string | null {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      const token = trimmed.slice(7).trim();
      if (token) {
        return token;
      }
    }
  }

  const cookieHeader =
    c.req.header("Cookie");

  if (!cookieHeader) {
    return null;
  }

  for (
    const cookie of cookieHeader.split(";")
  ) {
    const [
      key,
      ...valueParts
    ] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(
        valueParts.join("="),
      );
    }
  }

  return null;
}

function isSecureContext(
  c: Context<{
    Bindings: Bindings;
  }>,
): boolean {
  try {
    const url = new URL(c.req.url);
    if (url.protocol === "https:") {
      return true;
    }
  } catch {
    // ignore
  }

  const proto = c.req.header("x-forwarded-proto");
  if (proto === "https") {
    return true;
  }

  if (c.env.STAFF_ORIGIN?.startsWith("https://")) {
    return true;
  }

  return false;
}

function createSessionCookie(
  c: Context<{
    Bindings: Bindings;
  }>,
  token: string,
): string {
  const isSecure = isSecureContext(c);
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    isSecure ? "Secure" : "",
    isSecure ? "SameSite=None" : "SameSite=Lax",
    "Max-Age=604800",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearSessionCookie(
  c: Context<{
    Bindings: Bindings;
  }>,
): string {
  const isSecure = isSecureContext(c);
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    isSecure ? "Secure" : "",
    isSecure ? "SameSite=None" : "SameSite=Lax",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
}

/*
 * LOGIN
 */
staffAuthRoutes.post(
  "/login",
  async (c) => {
    const body =
      await c.req
        .json<{
          email?: string;
          password?: string;
        }>()
        .catch(() => ({} as { email?: string; password?: string }));

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return c.json(
        {
          ok: false,
          message:
            "Email and password are required.",
        },
        400,
      );
    }

    const user =
      await c.env.DB.prepare(
        `
        SELECT
          id,
          email,
          role,
          active,
          password_hash,
          password_salt
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
      )
        .bind(email)
        .first<{
          id: string;
          email: string;
          role:
            | "STAFF"
            | "ADMIN";
          active: number;
          password_hash:
            | string
            | null;
          password_salt:
            | string
            | null;
        }>();

    if (
      !user ||
      user.active !== 1 ||
      !user.password_hash ||
      !user.password_salt
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Invalid email or password.",
        },
        401,
      );
    }

    const passwordValid =
      await verifyPassword(
        password,
        user.password_hash,
        user.password_salt,
      );

    if (!passwordValid) {
      return c.json(
        {
          ok: false,
          message:
            "Invalid email or password.",
        },
        401,
      );
    }

    /*
     * Generate a random session token.
     * The raw token is sent only as the
     * HttpOnly cookie.
     */
    const sessionToken =
      generateOpaqueToken(32);

    /*
     * Only the SHA-256 hash of the
     * session token is stored in D1.
     */
    const sessionTokenHash =
      await sha256Hex(
        sessionToken,
      );

    const sessionId =
      generateOpaqueToken(16);

    await c.env.DB.prepare(
      `
      INSERT INTO staff_sessions (
        id,
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        ?,
        ?,
        ?,
        datetime('now', '+7 days')
      )
      `,
    )
      .bind(
        sessionId,
        user.id,
        sessionTokenHash,
      )
      .run();

    c.header(
      "Set-Cookie",
      createSessionCookie(
        c,
        sessionToken,
      ),
    );

    return c.json({
      ok: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  },
);

/*
 * LOGOUT
 */
staffAuthRoutes.post(
  "/logout",
  async (c) => {
    const sessionToken =
      getCookie(
        c,
        SESSION_COOKIE,
      );

    if (sessionToken) {
      const sessionTokenHash =
        await sha256Hex(
          sessionToken,
        );

      await c.env.DB.prepare(
        `
        DELETE FROM staff_sessions
        WHERE token_hash = ?
        `,
      )
        .bind(
          sessionTokenHash,
        )
        .run();
    }

    c.header(
      "Set-Cookie",
      clearSessionCookie(c),
    );

    return c.json({
      ok: true,
    });
  },
);

/*
 * CURRENT USER
 */
staffAuthRoutes.get(
  "/me",
  async (c) => {
    const sessionToken =
      getCookie(
        c,
        SESSION_COOKIE,
      );

    if (!sessionToken) {
      return c.json(
        {
          ok: false,
          authenticated: false,
        },
        401,
      );
    }

    const sessionTokenHash =
      await sha256Hex(
        sessionToken,
      );

    const user =
      await c.env.DB.prepare(
        `
        SELECT
          u.id,
          u.email,
          u.role,
          u.active,
          s.id AS session_id
        FROM staff_sessions s
        INNER JOIN users u
          ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.expires_at > datetime('now')
          AND u.active = 1
        LIMIT 1
        `,
      )
        .bind(
          sessionTokenHash,
        )
        .first<{
          id: string;
          email: string;
          role:
            | "STAFF"
            | "ADMIN";
          active: number;
          session_id: string;
        }>();

    if (!user) {
      return c.json(
        {
          ok: false,
          authenticated: false,
        },
        401,
      );
    }

    await c.env.DB.prepare(
      `
      UPDATE staff_sessions
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
    )
      .bind(
        user.session_id,
      )
      .run();

    return c.json({
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  },
);

export default staffAuthRoutes;