import { Hono } from "hono";
import { cors } from "hono/cors";

import qrRoutes from "./routes/qr";
import sessionRoutes from "./routes/sessions";
import menuRoutes from "./routes/menu";
import orderRoutes from "./routes/orders";
import staffAuthRoutes from "./routes/staff-auth";
import staffOrderRoutes from "./routes/staff-orders";
import staffTableRoutes from "./routes/staff-tables";
import festivalRoutes from "./routes/festivals";
import staffFestivalRoutes from "./routes/staff-festivals";
import staffMenuRoutes from "./routes/staff-menu";

import {
  getStaffUser,
} from "./utils/staff-auth";

import type { Bindings } from "./types/env";

const app = new Hono<{
  Bindings: Bindings;
}>();

app.use("/api/*", async (c, next) => {
  const allowedOrigins = [
    c.env.CUSTOMER_ORIGIN ||
      "http://localhost:3000",
    c.env.STAFF_ORIGIN ||
      "http://localhost:3001",
  ];

  const middleware = cors({
    origin: (requestOrigin) => {
      if (
        requestOrigin &&
        allowedOrigins.includes(
          requestOrigin,
        )
      ) {
        return requestOrigin;
      }

      return allowedOrigins[0];
    },

    allowMethods: [
      "GET",
      "POST",
      "PATCH",
      "OPTIONS",
    ],

    allowHeaders: [
      "Content-Type",
    ],

    credentials: true,
  });

  return middleware(c, next);
});

/*
 * Every staff endpoint requires a valid
 * server-side staff session.
 *
 * Login/logout/me remain public.
 */
app.use(
  "/api/staff/*",
  async (c, next) => {
    if (
      c.req.method === "OPTIONS"
    ) {
      return next();
    }

    if (
      c.req.path.startsWith(
        "/api/staff/auth/",
      )
    ) {
      return next();
    }

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

    /*
     * Make the authenticated user ID
     * available to downstream staff routes.
     *
     * This is server-side context, NOT
     * a client-supplied authentication header.
     */
    (c as any).set("staffUserId",
      user.id,
    );

    return next();
  },
);

app.get(
  "/health",
  (c) =>
    c.json({
      ok: true,
      service:
        "d-den-corner-api",
    }),
);

app.route(
  "/api/staff/auth",
  staffAuthRoutes,
);

app.route(
  "/api/qr",
  qrRoutes,
);

app.route(
  "/api/sessions",
  sessionRoutes,
);

app.route(
  "/api/menu",
  menuRoutes,
);

app.route(
  "/api/orders",
  orderRoutes,
);

app.route(
  "/api/staff/orders",
  staffOrderRoutes,
);

app.route(
  "/api/staff/tables",
  staffTableRoutes,
);

app.route(
  "/api/staff/festivals",
  staffFestivalRoutes,
);

app.route(
  "/api/staff/menu",
  staffMenuRoutes,
);

app.route(
  "/api/festivals",
  festivalRoutes,
);

export default app;
