import { Hono } from "hono";
import type { Context } from "hono";

import {
  getActiveLocations,
} from "../db/locations";

import {
  getTablesByLocation,
  getTableById,
  createTable,
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
} from "../db/qr";

import type { Bindings } from "../types/env";

const staffTableRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function requireStaff(
  c: Context,
): Response | null {
  const staffUserId = (
    c as any
  ).get("staffUserId");

  if (
    typeof staffUserId !==
    "string"
  ) {
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

    const customerOrigin =
      c.env.CUSTOMER_ORIGIN ||
      "http://localhost:3000";

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

                    const orderingUrl = qr?.raw_token
                      ? `${customerOrigin.replace(/\/$/, "")}/menu?token=${encodeURIComponent(qr.raw_token)}`
                      : null;

                    return {
                      ...table,
                      activeSession:
                        session,
                      qr: qr
                        ? {
                            id: qr.id,
                            active:
                              qr.active ===
                              1,
                            createdAt:
                              qr.created_at,
                            url: orderingUrl,
                          }
                        : null,
                      orderingUrl,
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

staffTableRoutes.post(
  "/:tableId/open",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const tableId =
      c.req.param("tableId");

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

    const customerOrigin =
      c.env.CUSTOMER_ORIGIN ||
      "http://localhost:3000";

    const orderingUrl = activatedQR?.raw_token
      ? `${customerOrigin.replace(/\/$/, "")}/menu?token=${encodeURIComponent(activatedQR.raw_token)}`
      : null;

    return c.json({
      ok: true,
      session,
      qr: activatedQR
        ? {
            id: activatedQR.id,
            active:
              activatedQR.active === 1,
            url: orderingUrl,
          }
        : null,
      orderingUrl,
    });
  },
);

staffTableRoutes.post(
  "/:tableId/close",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const tableId =
      c.req.param("tableId");

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

    const customerOrigin =
      c.env.CUSTOMER_ORIGIN ||
      "http://localhost:3000";

    const orderingUrl = deactivatedQR?.raw_token
      ? `${customerOrigin.replace(/\/$/, "")}/menu?token=${encodeURIComponent(deactivatedQR.raw_token)}`
      : null;

    return c.json({
      ok: true,
      session: closed,
      qr: deactivatedQR
        ? {
            id: deactivatedQR.id,
            active:
              deactivatedQR.active === 1,
            url: orderingUrl,
          }
        : null,
      orderingUrl,
    });
  },
);

/*
 * CREATE NEW TABLE WITH INITIAL PERMANENT ORDERING TOKEN
 */
staffTableRoutes.post(
  "/",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    let body: any;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    const id =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    if (!id || !name) {
      return c.json(
        {
          ok: false,
          message:
            "Table ID and Table Name are required.",
        },
        400,
      );
    }

    // Check if table ID already exists
    const existing =
      await getTableById(
        c.env.DB,
        id,
      );

    if (existing) {
      return c.json(
        {
          ok: false,
          message: `Table with ID '${id}' already exists.`,
        },
        409,
      );
    }

    let locationId =
      typeof body?.locationId ===
      "string"
        ? body.locationId.trim()
        : "";

    if (!locationId) {
      const locations =
        await getActiveLocations(
          c.env.DB,
        );

      if (
        !locations ||
        locations.length === 0
      ) {
        return c.json(
          {
            ok: false,
            message:
              "No active dining location found.",
          },
          400,
        );
      }

      locationId = locations[0].id;
    }

    // 1. Create table
    const table =
      await createTable(
        c.env.DB,
        {
          id,
          locationId,
          name,
        },
      );

    // 2. Generate initial permanent ordering token
    const qrResult =
      await createQRToken(
        c.env.DB,
        id,
      );

    const customerOrigin =
      c.env.CUSTOMER_ORIGIN ||
      "http://localhost:3000";

    const orderingUrl = `${customerOrigin.replace(
      /\/$/,
      "",
    )}/menu?token=${encodeURIComponent(
      qrResult.token,
    )}`;

    return c.json(
      {
        ok: true,
        table: {
          ...table,
          activeSession: null,
          qr: {
            id: qrResult.row.id,
            active: false,
            createdAt:
              qrResult.row.created_at,
            url: orderingUrl,
          },
          orderingUrl,
        },
      },
      201,
    );
  },
);

export default staffTableRoutes;