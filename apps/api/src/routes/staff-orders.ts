import { Hono } from "hono";
import type { Context } from "hono";

import { execute } from "../db";
import {
  getActiveStaffOrders,
  getOrderById,
  getOrderItems,
  getOrderStatusHistory,
  updateOrderStatus,
} from "../db/orders";

import {
  getTableSessionById,
} from "../db/sessions";
import { getTableById } from "../db/tables";
import { getNextOrderStatus } from "../utils/order-status";

import type { Bindings } from "../types/env";

const staffOrderRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function getAuthenticatedStaffUserId(
  c: Context,
): string | null {
  const userId = (
    c as any
  ).get("staffUserId");

  return typeof userId ===
    "string"
    ? userId
    : null;
}

staffOrderRoutes.get(
  "/",
  async (c) => {
    const { orders, tables } =
      await getActiveStaffOrders(
        c.env.DB,
      );

    return c.json({
      ok: true,
      orders,
      tables,
    });
  },
);

staffOrderRoutes.get(
  "/history",
  async (c) => {
    const { parseHistoryQueryParams } = await import("./staff-dashboard");
    const parsed = parseHistoryQueryParams(c);
    if (parsed.error) {
      return c.json({ ok: false, error: parsed.error }, 400);
    }

    const { getStaffOrderHistory } = await import("../db/dashboard");

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
  },
);

staffOrderRoutes.get(
  "/:orderId",
  async (c) => {
    const orderId =
      c.req.param("orderId");

    const order =
      await getOrderById(
        c.env.DB,
        orderId,
      );

    if (!order) {
      return c.json(
        {
          ok: false,
          message:
            "Order not found.",
        },
        404,
      );
    }

    const tableSession =
      await getTableSessionById(
        c.env.DB,
        order.table_session_id,
      );

    const table =
      tableSession
        ? await getTableById(
            c.env.DB,
            tableSession.table_id,
          )
        : null;

    const items =
      await getOrderItems(
        c.env.DB,
        order.id,
      );

    const history =
      await getOrderStatusHistory(
        c.env.DB,
        order.id,
      );

    return c.json({
      ok: true,
      order: {
        ...order,
        table: table
          ? {
              id: table.id,
              name: table.name,
            }
          : null,
        items,
        history,
      },
    });
  },
);

staffOrderRoutes.post(
  "/:orderId/status",
  async (c) => {
    const staffUserId =
      getAuthenticatedStaffUserId(
        c,
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

    const orderId =
      c.req.param("orderId");

    const order =
      await getOrderById(
        c.env.DB,
        orderId,
      );

    if (!order) {
      return c.json(
        {
          ok: false,
          message:
            "Order not found.",
        },
        404,
      );
    }

    const nextStatus =
      getNextOrderStatus(
        order.status,
      );

    if (!nextStatus) {
      return c.json(
        {
          ok: false,
          message:
            "This order has already reached its final status.",
        },
        409,
      );
    }

    try {
      await updateOrderStatus(
        c.env.DB,
        order.id,
        order.status,
        nextStatus,
        staffUserId,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "ORDER_STATUS_CHANGED"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "The order status changed before this request completed. Please refresh.",
          },
          409,
        );
      }

      throw error;
    }

    const updatedOrder =
      await getOrderById(
        c.env.DB,
        order.id,
      );

    return c.json({
      ok: true,
      order: updatedOrder,
    });
  },
);

async function handleCompleteOrder(c: any) {
  const staffUserId = getAuthenticatedStaffUserId(c);

  if (!staffUserId) {
    return c.json(
      {
        ok: false,
        message: "Staff authentication is required.",
      },
      401,
    );
  }

  const orderId = c.req.param("orderId");
  const order = await getOrderById(c.env.DB, orderId);

  if (!order) {
    return c.json(
      {
        ok: false,
        message: "Order not found.",
      },
      404,
    );
  }

  const now = new Date().toISOString();

  await execute(
    c.env.DB,
    `
      UPDATE orders
      SET
        status = 'SERVED',
        accepted_at = CASE WHEN accepted_at IS NULL THEN ? ELSE accepted_at END,
        updated_at = ?
      WHERE id = ?
    `,
    now,
    now,
    orderId,
  );

  await execute(
    c.env.DB,
    `
      INSERT INTO order_status_history (
        id,
        order_id,
        from_status,
        to_status,
        changed_by_user_id,
        created_at
      )
      VALUES (?, ?, ?, 'SERVED', ?, ?)
    `,
    crypto.randomUUID(),
    orderId,
    order.status,
    staffUserId,
    now,
  );

  const updatedOrder = await getOrderById(c.env.DB, orderId);

  return c.json({
    ok: true,
    order: updatedOrder,
  });
}

staffOrderRoutes.post("/:orderId/complete", handleCompleteOrder);
staffOrderRoutes.post("/:orderId/close", handleCompleteOrder);

staffOrderRoutes.delete(
  "/:orderId/items/:itemId",
  async (c) => {
    const staffUserId = getAuthenticatedStaffUserId(c);

    if (!staffUserId) {
      return c.json(
        {
          ok: false,
          message: "Staff authentication is required.",
        },
        401,
      );
    }

    const orderId = c.req.param("orderId");
    const itemId = c.req.param("itemId");

    const order = await getOrderById(c.env.DB, orderId);

    if (!order) {
      return c.json(
        {
          ok: false,
          message: "Order not found.",
        },
        404,
      );
    }

    if (order.status !== "NEW") {
      return c.json(
        {
          ok: false,
          message: "Items can only be removed from orders in NEW status.",
        },
        400,
      );
    }

    const allItems = await getOrderItems(c.env.DB, orderId);
    const itemToDelete = allItems.find((item) => item.id === itemId);

    if (!itemToDelete) {
      return c.json(
        {
          ok: false,
          message: "Item not found in this order.",
        },
        404,
      );
    }

    if (allItems.length <= 1) {
      // Last item in order: resolve empty order by deleting it cleanly
      await c.env.DB.batch([
        c.env.DB.prepare("DELETE FROM order_items WHERE id = ?").bind(itemId),
        c.env.DB.prepare("DELETE FROM order_status_history WHERE order_id = ?").bind(orderId),
        c.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(orderId),
      ]);

      return c.json({
        ok: true,
        deleted: true,
        orderId,
        message: "Order was cancelled and removed because its last item was removed.",
      });
    }

    const remainingItems = allItems.filter((item) => item.id !== itemId);
    const newTotalMinor = remainingItems.reduce(
      (sum, item) => sum + item.line_total_minor,
      0,
    );
    const now = new Date().toISOString();

    await c.env.DB.batch([
      c.env.DB.prepare("DELETE FROM order_items WHERE id = ?").bind(itemId),
      c.env.DB.prepare(
        "UPDATE orders SET total_amount_minor = ?, updated_at = ? WHERE id = ?",
      ).bind(newTotalMinor, now, orderId),
    ]);

    const updatedOrder = await getOrderById(c.env.DB, orderId);
    const updatedItems = await getOrderItems(c.env.DB, orderId);

    return c.json({
      ok: true,
      deleted: false,
      order: {
        ...updatedOrder,
        items: updatedItems,
      },
    });
  },
);

export default staffOrderRoutes;
