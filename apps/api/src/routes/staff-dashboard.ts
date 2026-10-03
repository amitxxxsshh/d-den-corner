import { Hono } from "hono";

import {
  cleanupOldAcceptedOrders,
  getDashboardRevenue,
  getStaffOrderHistory,
} from "../db/dashboard";
import {
  validateDateString,
  validateMonthString,
} from "../utils/timezone";

import type { Bindings } from "../types/env";

export function parseHistoryQueryParams(c: any): {
  page: number;
  limit: number;
  status?: string;
  date?: string;
  month?: string;
  error?: string;
} {
  const pageRaw = c.req.query("page");
  const limitRaw = c.req.query("limit");
  const status = c.req.query("status") || undefined;
  const date = c.req.query("date") || undefined;
  const month = c.req.query("month") || undefined;

  // Validate contradictory filters
  if (date && month) {
    return {
      page: 1,
      limit: 10,
      error: "Cannot specify both date and month filters simultaneously.",
    };
  }

  // Validate pagination
  if (pageRaw !== undefined) {
    const pageNum = Number(pageRaw);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return {
        page: 1,
        limit: 10,
        error: "Invalid page parameter. Must be an integer greater than or equal to 1.",
      };
    }
  }

  if (limitRaw !== undefined) {
    const limitNum = Number(limitRaw);
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      return {
        page: 1,
        limit: 10,
        error: "Invalid limit parameter. Must be an integer greater than or equal to 1.",
      };
    }
  }

  const page = pageRaw ? parseInt(pageRaw, 10) : 1;
  const limit = limitRaw ? parseInt(limitRaw, 10) : 10;

  // Validate date if provided
  if (date) {
    const dateError = validateDateString(date);
    if (dateError) {
      return { page, limit, error: dateError };
    }
  }

  // Validate month if provided
  if (month) {
    const monthError = validateMonthString(month);
    if (monthError) {
      return { page, limit, error: monthError };
    }
  }

  return {
    page,
    limit,
    status,
    date,
    month,
  };
}

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
  const parsed = parseHistoryQueryParams(c);
  if (parsed.error) {
    return c.json({ ok: false, error: parsed.error }, 400);
  }

  const result = await getStaffOrderHistory(c.env.DB, {
    page: parsed.page,
    limit: parsed.limit,
    status: parsed.status,
    date: parsed.date,
    month: parsed.month,
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
  const parsed = parseHistoryQueryParams(c);
  if (parsed.error) {
    return c.json({ ok: false, error: parsed.error }, 400);
  }

  const result = await getStaffOrderHistory(c.env.DB, {
    page: parsed.page,
    limit: parsed.limit,
    status: parsed.status,
    date: parsed.date,
    month: parsed.month,
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
