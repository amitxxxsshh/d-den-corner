import { Hono } from "hono";

import {
  cleanupOldAcceptedOrders,
  getDashboardRevenue,
  getStaffOrderHistory,
} from "../db/dashboard";

import type { Bindings } from "../types/env";

const staffDashboardRoutes = new Hono<{
  Bindings: Bindings;
}>();

/**
 * GET /api/staff/dashboard/revenue
 * Returns today's revenue and monthly revenue dynamically aggregated from accepted orders.
 */
staffDashboardRoutes.get("/revenue", async (c) => {
  const timeZone = c.req.query("timeZone") || undefined;
  const revenue = await getDashboardRevenue(c.env.DB, timeZone);

  return c.json({
    ok: true,
    ...revenue,
  });
});

/**
 * GET /api/staff/dashboard/history
 * Returns server-side paginated order history for accepted orders (within 6 months retention).
 */
staffDashboardRoutes.get("/history", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const status = c.req.query("status") || undefined;

  const result = await getStaffOrderHistory(c.env.DB, {
    page,
    limit,
    status,
  });

  return c.json({
    ok: true,
    ...result,
  });
});

/**
 * GET /api/staff/dashboard/orders
 * Alias for /history.
 */
staffDashboardRoutes.get("/orders", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const status = c.req.query("status") || undefined;

  const result = await getStaffOrderHistory(c.env.DB, {
    page,
    limit,
    status,
  });

  return c.json({
    ok: true,
    ...result,
  });
});

/**
 * POST /api/staff/dashboard/cleanup
 * Idempotently executes the 6-month historical order retention cleanup.
 */
staffDashboardRoutes.post("/cleanup", async (c) => {
  const result = await cleanupOldAcceptedOrders(c.env.DB);

  return c.json({
    ok: true,
    ...result,
  });
});

export default staffDashboardRoutes;
