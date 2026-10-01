import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import {
  DEFAULT_BUSINESS_TIMEZONE,
  getSixMonthsAgoIso,
  getTimezoneBoundaries,
} from "../utils/timezone";

import type { OrderItemRow, OrderStatus } from "../types/database";

export interface DashboardRevenueSummary {
  today: {
    revenueMinor: number;
    ordersCount: number;
    date: string;
  };
  month: {
    revenueMinor: number;
    ordersCount: number;
    month: string;
  };
  timeZone: string;
}

export interface HistoricalOrderListItem {
  id: string;
  table_session_id: string;
  customer_session_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  table: {
    id: string;
    name: string;
    locationName?: string | null;
  } | null;
  items: Array<{
    id: string;
    menu_item_id: string;
    item_name_snapshot: string;
    unit_price_minor: number;
    quantity: number;
    line_total_minor: number;
  }>;
}

export interface OrderHistoryResult {
  orders: HistoricalOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CleanupResult {
  deletedOrdersCount: number;
  cutoffDate: string;
}

/**
 * Calculates Today's Revenue and Monthly Revenue using database-side aggregation (SUM),
 * strictly filtered by accepted orders within the respective business calendar day/month.
 */
export async function getDashboardRevenue(
  db: D1Database,
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
  referenceDate: Date = new Date(),
): Promise<DashboardRevenueSummary> {
  const boundaries = getTimezoneBoundaries(referenceDate, timeZone);

  // Today's Revenue Aggregation
  const todayRow = await queryOne<{
    total_minor: number | null;
    order_count: number | null;
  }>(
    db,
    `
      SELECT
        COALESCE(SUM(total_amount_minor), 0) AS total_minor,
        COUNT(*) AS order_count
      FROM orders
      WHERE accepted_at IS NOT NULL
        AND status IN ('ACCEPTED', 'PREPARING', 'READY', 'SERVED')
        AND accepted_at >= ?
        AND accepted_at <= ?
    `,
    boundaries.today.start,
    boundaries.today.end,
  );

  // Monthly Revenue Aggregation (current calendar month in business timezone)
  const monthRow = await queryOne<{
    total_minor: number | null;
    order_count: number | null;
  }>(
    db,
    `
      SELECT
        COALESCE(SUM(total_amount_minor), 0) AS total_minor,
        COUNT(*) AS order_count
      FROM orders
      WHERE accepted_at IS NOT NULL
        AND status IN ('ACCEPTED', 'PREPARING', 'READY', 'SERVED')
        AND accepted_at >= ?
        AND accepted_at <= ?
    `,
    boundaries.month.start,
    boundaries.month.end,
  );

  return {
    today: {
      revenueMinor: Number(todayRow?.total_minor ?? 0),
      ordersCount: Number(todayRow?.order_count ?? 0),
      date: boundaries.localDate,
    },
    month: {
      revenueMinor: Number(monthRow?.total_minor ?? 0),
      ordersCount: Number(monthRow?.order_count ?? 0),
      month: boundaries.localMonth,
    },
    timeZone: boundaries.timeZone,
  };
}

/**
 * Fetches server-side paginated Order History for accepted orders only,
 * enforcing the 6-month historical retention policy.
 */
export async function getStaffOrderHistory(
  db: D1Database,
  options: {
    page?: number;
    limit?: number;
    status?: string;
    referenceDate?: Date;
  } = {},
): Promise<OrderHistoryResult> {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 10)));
  const offset = (page - 1) * limit;

  const sixMonthsAgo = getSixMonthsAgoIso(options.referenceDate);

  const allowedStatuses: OrderStatus[] = [
    "ACCEPTED",
    "PREPARING",
    "READY",
    "SERVED",
  ];

  const filterStatus =
    options.status &&
    allowedStatuses.includes(options.status.toUpperCase() as OrderStatus)
      ? (options.status.toUpperCase() as OrderStatus)
      : null;

  // Build WHERE clause: only accepted orders within 6 months
  let countSql = `
    SELECT COUNT(*) AS total
    FROM orders
    WHERE accepted_at IS NOT NULL
      AND status IN ('ACCEPTED', 'PREPARING', 'READY', 'SERVED')
      AND accepted_at >= ?
  `;
  const countBindings: unknown[] = [sixMonthsAgo];

  if (filterStatus) {
    countSql += ` AND status = ?`;
    countBindings.push(filterStatus);
  }

  const countRow = await queryOne<{ total: number }>(
    db,
    countSql,
    ...countBindings,
  );
  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Query paginated orders with joined table and location information
  let selectSql = `
    SELECT
      o.id,
      o.table_session_id,
      o.customer_session_id,
      o.status,
      o.total_amount_minor,
      o.accepted_at,
      o.created_at,
      o.updated_at,
      t.id AS table_id,
      t.name AS table_name,
      loc.name AS location_name
    FROM orders o
    LEFT JOIN table_sessions ts ON ts.id = o.table_session_id
    LEFT JOIN tables t ON t.id = ts.table_id
    LEFT JOIN locations loc ON loc.id = t.location_id
    WHERE o.accepted_at IS NOT NULL
      AND o.status IN ('ACCEPTED', 'PREPARING', 'READY', 'SERVED')
      AND o.accepted_at >= ?
  `;
  const selectBindings: unknown[] = [sixMonthsAgo];

  if (filterStatus) {
    selectSql += ` AND o.status = ?`;
    selectBindings.push(filterStatus);
  }

  selectSql += `
    ORDER BY o.accepted_at DESC, o.created_at DESC
    LIMIT ? OFFSET ?
  `;
  selectBindings.push(limit, offset);

  type OrderWithTableJoin = {
    id: string;
    table_session_id: string;
    customer_session_id: string;
    status: OrderStatus;
    total_amount_minor: number;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
    table_id: string | null;
    table_name: string | null;
    location_name: string | null;
  };

  const rows = await queryMany<OrderWithTableJoin>(
    db,
    selectSql,
    ...selectBindings,
  );

  if (rows.length === 0) {
    return {
      orders: [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Fetch items for all orders in this page in a single query
  const orderIds = rows.map((r) => r.id);
  const placeholders = orderIds.map(() => "?").join(", ");

  const items = await queryMany<OrderItemRow>(
    db,
    `
      SELECT
        id,
        order_id,
        menu_item_id,
        item_name_snapshot,
        unit_price_minor,
        quantity,
        line_total_minor,
        created_at
      FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY created_at ASC
    `,
    ...orderIds,
  );

  const itemsByOrderId = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrderId.get(item.order_id);
    if (list) {
      list.push(item);
    } else {
      itemsByOrderId.set(item.order_id, [item]);
    }
  }

  const resultOrders: HistoricalOrderListItem[] = rows.map((row) => ({
    id: row.id,
    table_session_id: row.table_session_id,
    customer_session_id: row.customer_session_id,
    status: row.status,
    total_amount_minor: row.total_amount_minor,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    table: row.table_id
      ? {
          id: row.table_id,
          name: row.table_name || "Table",
          locationName: row.location_name,
        }
      : null,
    items: (itemsByOrderId.get(row.id) || []).map((item) => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      item_name_snapshot: item.item_name_snapshot,
      unit_price_minor: item.unit_price_minor,
      quantity: item.quantity,
      line_total_minor: item.line_total_minor,
    })),
  }));

  return {
    orders: resultOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Safely removes accepted orders older than 6 months from the database storage.
 *
 * Safety rules:
 * 1. Only removes orders where status = 'SERVED' (terminal status).
 *    Never deletes active orders in the live workflow ('NEW', 'ACCEPTED', 'PREPARING', 'READY').
 * 2. Uses accepted_at as authoritative timestamp.
 * 3. Safely removes related order_items and order_status_history records in a batch.
 * 4. Idempotent and safe to run repeatedly.
 */
export async function cleanupOldAcceptedOrders(
  db: D1Database,
  options: {
    referenceDate?: Date;
    batchLimit?: number;
  } = {},
): Promise<CleanupResult> {
  const cutoffDate = getSixMonthsAgoIso(options.referenceDate);
  const limit = Math.max(1, Math.min(1000, options.batchLimit || 500));

  // Find candidate orders eligible for cleanup:
  // Must be completed (SERVED), accepted_at exists and is older than 6 months
  const candidates = await queryMany<{ id: string }>(
    db,
    `
      SELECT id
      FROM orders
      WHERE status = 'SERVED'
        AND accepted_at IS NOT NULL
        AND accepted_at < ?
      LIMIT ?
    `,
    cutoffDate,
    limit,
  );

  if (candidates.length === 0) {
    return {
      deletedOrdersCount: 0,
      cutoffDate,
    };
  }

  const ids = candidates.map((c) => c.id);
  const placeholders = ids.map(() => "?").join(", ");

  // Delete associated records first, then the orders
  const statements = [
    db
      .prepare(`DELETE FROM order_items WHERE order_id IN (${placeholders})`)
      .bind(...ids),
    db
      .prepare(
        `DELETE FROM order_status_history WHERE order_id IN (${placeholders})`,
      )
      .bind(...ids),
    db
      .prepare(`DELETE FROM orders WHERE id IN (${placeholders})`)
      .bind(...ids),
  ];

  await db.batch(statements);

  return {
    deletedOrdersCount: ids.length,
    cutoffDate,
  };
}
