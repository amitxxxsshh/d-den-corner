import { Hono } from "hono";
import type { Context } from "hono";

import {
  getActiveLocations,
} from "../db/locations";

import {
  getTablesByLocation,
  getTableById,
} from "../db/tables";

import {
  closeTableSession,
  createTableSession,
  getActiveTableSession,
} from "../db/sessions";

import {
  createQRToken,
  getCurrentQRTokenForTable,
  setQRTokenActive,
  revokeQRToken,
} from "../db/qr";

import type { Bindings } from "../types/env";

const staffTableRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function requireStaff(
  c: Context<{
    Bindings: Bindings;
  }>,
): Response | null {
  const staffUserId =
    c.req.header(
      "X-Staff-User-Id",
    );

  if (!staffUserId) {
    return c.json(
      {
        ok: false,
        message:
          "Staff authentication is required.",
      },
      401,
    );
  }

  return null;
}

/*
 * GET ALL TABLES
 *
 * Important:
 * We return the current QR even when it is inactive.
 *
 * The QR is physically fixed to the table.
 */
staffTableRoutes.get(
  "/",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const locations =
      await getActiveLocations(
        c.env.DB,
      );

    const result =
      await Promise.all(
        locations.map(
          async (location) => {
            const tables =
              await getTablesByLocation(
                c.env.DB,
                location.id,
              );

            const enrichedTables =
              await Promise.all(
                tables.map(
                  async (table) => {
                    const [
                      session,
                      qr,
                    ] =
                      await Promise.all([
                        getActiveTableSession(
                          c.env.DB,
                          table.id,
                        ),

                        getCurrentQRTokenForTable(
                          c.env.DB,
                          table.id,
                        ),
                      ]);

                    return {
                      ...table,

                      activeSession:
                        session,

                      qr: qr
                        ? {
                            id: qr.id,
                            active:
                              qr.active === 1,
                            createdAt:
                              qr.created_at,
                          }
                        : null,
                    };
                  },
                ),
              );

            return {
              ...location,
              tables:
                enrichedTables,
            };
          },
        ),
      );

    return c.json({
      ok: true,
      locations: result,
    });
  },
);

/*
 * OPEN TABLE
 *
 * This:
 * 1. Starts/reuses the active table session.
 * 2. Activates the existing fixed QR.
 *
 * It does NOT generate a new QR.
 */
staffTableRoutes.post(
  "/:tableId/open",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const tableId =
      c.req.param(
        "tableId",
      );

    const table =
      await getTableById(
        c.env.DB,
        tableId,
      );

    if (
      !table ||
      table.active !== 1
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Table not found or inactive.",
        },
        404,
      );
    }

    const qr =
      await getCurrentQRTokenForTable(
        c.env.DB,
        tableId,
      );

    if (!qr) {
      return c.json(
        {
          ok: false,
          message:
            "No QR code is assigned to this table. Assign a QR code before opening the table.",
        },
        409,
      );
    }

    let session;

    try {
      session =
        await createTableSession(
          c.env.DB,
          tableId,
        );
    } catch (error) {
      const existing =
        await getActiveTableSession(
          c.env.DB,
          tableId,
        );

      if (!existing) {
        throw error;
      }

      session = existing;
    }

    const activatedQR =
      await setQRTokenActive(
        c.env.DB,
        qr.id,
        true,
      );

    return c.json({
      ok: true,
      session,
      qr: activatedQR
        ? {
            id:
              activatedQR.id,
            active:
              activatedQR.active ===
              1,
          }
        : null,
    });
  },
);

/*
 * CLOSE TABLE
 *
 * This:
 * 1. Closes the table session.
 * 2. Deactivates the SAME fixed QR.
 *
 * The physical QR remains on the table,
 * but scanning it will now be rejected.
 */
staffTableRoutes.post(
  "/:tableId/close",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const tableId =
      c.req.param(
        "tableId",
      );

    const table =
      await getTableById(
        c.env.DB,
        tableId,
      );

    if (!table) {
      return c.json(
        {
          ok: false,
          message:
            "Table not found.",
        },
        404,
      );
    }

    const session =
      await getActiveTableSession(
        c.env.DB,
        tableId,
      );

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "No active table session.",
        },
        409,
      );
    }

    const qr =
      await getCurrentQRTokenForTable(
        c.env.DB,
        tableId,
      );

    const closed =
      await closeTableSession(
        c.env.DB,
        session.id,
      );

    let deactivatedQR = null;

    if (qr) {
      deactivatedQR =
        await setQRTokenActive(
          c.env.DB,
          qr.id,
          false,
        );
    }

    return c.json({
      ok: true,

      session: closed,

      qr: deactivatedQR
        ? {
            id:
              deactivatedQR.id,
            active:
              deactivatedQR.active ===
              1,
          }
        : null,
    });
  },
);

/*
 * GENERATE / REPLACE QR
 *
 * This is NOT the normal "open table" action.
 *
 * Use this only when:
 * - assigning a QR for the first time
 * - replacing a damaged/lost QR
 */
staffTableRoutes.post(
  "/:tableId/qr",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const tableId =
      c.req.param(
        "tableId",
      );

    const table =
      await getTableById(
        c.env.DB,
        tableId,
      );

    if (
      !table ||
      table.active !== 1
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Table not found or inactive.",
        },
        404,
      );
    }

    const result =
      await createQRToken(
        c.env.DB,
        tableId,
      );

    const customerOrigin =
      c.env.CUSTOMER_ORIGIN ||
      "http://localhost:3000";

    const url =
      `${customerOrigin}/menu?token=${encodeURIComponent(
        result.token,
      )}`;

    return c.json(
      {
        ok: true,

        qr: {
          id:
            result.row.id,

          tableId,

          token:
            result.token,

          url,

          active:
            result.row.active ===
            1,

          createdAt:
            result.row.created_at,
        },
      },
      201,
    );
  },
);

/*
 * REVOKE / REMOVE QR
 *
 * This is a replacement/administrative operation.
 * It is NOT used when closing a table.
 */
staffTableRoutes.post(
  "/:tableId/qr/:qrId/revoke",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const tableId =
      c.req.param(
        "tableId",
      );

    const qrId =
      c.req.param(
        "qrId",
      );

    const table =
      await getTableById(
        c.env.DB,
        tableId,
      );

    if (!table) {
      return c.json(
        {
          ok: false,
          message:
            "Table not found.",
        },
        404,
      );
    }

    const current =
      await getCurrentQRTokenForTable(
        c.env.DB,
        tableId,
      );

    if (
      !current ||
      current.id !== qrId
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Assigned QR code not found.",
        },
        404,
      );
    }

    const revoked =
      await revokeQRToken(
        c.env.DB,
        qrId,
      );

    return c.json({
      ok: true,
      qr: revoked,
    });
  },
);

export default staffTableRoutes;