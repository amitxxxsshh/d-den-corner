import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type {
  OrderItemRow,
  OrderRow,
  OrderStatusHistoryRow,
} from "../types/database";

export async function getOrderById(
  db: D1Database,
  orderId: string
): Promise<OrderRow | null> {
  return queryOne<OrderRow>(
    db,
    `
      SELECT
        id,
        table_session_id,
        customer_session_id,
        status,
        total_amount_minor,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    orderId
  );
}

export async function getOrdersByTableSession(
  db: D1Database,
  tableSessionId: string
): Promise<OrderRow[]> {
  return queryMany<OrderRow>(
    db,
    `
      SELECT
        id,
        table_session_id,
        customer_session_id,
        status,
        total_amount_minor,
        created_at,
        updated_at
      FROM orders
      WHERE table_session_id = ?
      ORDER BY created_at ASC
    `,
    tableSessionId
  );
}

export async function getOrderItems(
  db: D1Database,
  orderId: string
): Promise<OrderItemRow[]> {
  return queryMany<OrderItemRow>(
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
      WHERE order_id = ?
      ORDER BY created_at ASC
    `,
    orderId
  );
}

export async function getOrderStatusHistory(
  db: D1Database,
  orderId: string
): Promise<OrderStatusHistoryRow[]> {
  return queryMany<OrderStatusHistoryRow>(
    db,
    `
      SELECT
        id,
        order_id,
        from_status,
        to_status,
        changed_by_user_id,
        created_at
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC
    `,
    orderId
  );
}