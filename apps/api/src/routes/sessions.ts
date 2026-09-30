import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";

import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionContext,
} from "../utils/customer-session";

import { getTableById } from "../db/tables";
import { getTableSessionById } from "../db/sessions";
import { execute } from "../db";

import type { Bindings } from "../types/env";

const sessionRoutes =
  new Hono<{ Bindings: Bindings }>();

sessionRoutes.get("/me", async (c) => {
  deleteCookie(c, CUSTOMER_SESSION_COOKIE, {
    path: "/",
    secure: true,
    sameSite: "Lax",
  });

  const session =
    await getCustomerSessionContext(c);

  if (!session) {
    return c.json(
      {
        ok: false,
        message: "Customer session is not active.",
      },
      401,
    );
  }

  const tableSession =
    await getTableSessionById(
      c.env.DB,
      session.tableSessionId,
    );

  if (!tableSession) {
    return c.json(
      {
        ok: false,
        message: "Table session could not be found.",
      },
      404,
    );
  }

  const table = await getTableById(
    c.env.DB,
    session.tableId,
  );

  if (!table) {
    return c.json(
      {
        ok: false,
        message: "Table could not be found.",
      },
      404,
    );
  }

  return c.json({
    ok: true,
    session: {
      customerSessionId:
        session.customerSessionId,

      tableSessionId:
        session.tableSessionId,

      tableId: session.tableId,

      tableName: table.name,

      locationId: table.location_id,

      expiresAt: null,
    },
  });
});

sessionRoutes.post("/leave", async (c) => {
  const session =
    await getCustomerSessionContext(c);

  if (session) {
    await execute(
      c.env.DB,
      `
        UPDATE customer_sessions
        SET expires_at = ?
        WHERE id = ?
      `,
      new Date().toISOString(),
      session.customerSessionId,
    );
  }

  deleteCookie(
    c,
    CUSTOMER_SESSION_COOKIE,
    {
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
  );

  return c.json({
    ok: true,
  });
});

export default sessionRoutes;