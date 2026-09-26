import { Hono } from "hono";
import type { Context } from "hono";

import {
  getActiveOrders,
  getOrderById,
  getOrderItems,
  getOrderStatusHistory,
  updateOrderStatus,
} from "../db/orders";

import { getTableSessionById } from "../db/sessions";
import { getTableById } from "../db/tables";
import { getNextOrderStatus } from "../utils/order-status";

import type { Bindings } from "../types/env";

const staffOrderRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function getStaffUserId(
  c: Context<{
    Bindings: Bindings;
  }>,
): string | null {
  return (
    c.req.header(
      "X-Staff-User-Id",
    ) || null
  );
}

staffOrderRoutes.get(
  "/",
  async (c) => {
    const orders =
      await getActiveOrders(
        c.env.DB,
      );

    const result =
      await Promise.all(
        orders.map(
          async (order) => {
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

            return {
              ...order,

              table: table
                ? {
                    id: table.id,
                    name: table.name,
                  }
                : null,

              items,
            };
          },
        ),
      );

    return c.json({
      ok: true,
      orders: result,
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
      getStaffUserId(c);

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

export default staffOrderRoutes;