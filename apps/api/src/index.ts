import { Hono } from "hono";
import { cors } from "hono/cors";

import qrRoutes from "./routes/qr";
import sessionRoutes from "./routes/sessions";
import menuRoutes from "./routes/menu";
import orderRoutes from "./routes/orders";
import staffOrderRoutes from "./routes/staff-orders";
import staffTableRoutes from "./routes/staff-tables";
import festivalRoutes from "./routes/festivals";
import staffFestivalRoutes from "./routes/staff-festivals";

import type { Bindings } from "./types/env";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", async (c, next) => {
  const allowedOrigins = [
    c.env.CUSTOMER_ORIGIN || "http://localhost:3000",
    c.env.STAFF_ORIGIN || "http://localhost:3001",
  ];

  const middleware = cors({
    origin: (requestOrigin) => {
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }

      return allowedOrigins[0];
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Staff-User-Id"],
    credentials: true,
  });

  return middleware(c, next);
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "d-den-corner-api",
  }),
);
app.route(
  "/api/staff/festivals",
  staffFestivalRoutes,
);

app.route("/api/qr", qrRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/menu", menuRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/staff/orders", staffOrderRoutes);
app.route("/api/staff/tables", staffTableRoutes);
app.route("/api/festivals", festivalRoutes);

export default app;