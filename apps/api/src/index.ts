import { Hono } from "hono";
import { cors } from "hono/cors";

import qrRoutes from "./routes/qr";
import type { Bindings } from "./types/env";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", async (c, next) => {
  const origin = c.req.header("Origin");

  const allowedOrigin =
    c.env.CUSTOMER_ORIGIN || "http://localhost:3000";

  const middleware = cors({
    origin: origin === allowedOrigin ? allowedOrigin : allowedOrigin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  });

  return middleware(c, next);
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "d-den-corner-api",
  });
});

app.route("/api/qr", qrRoutes);

export default app;