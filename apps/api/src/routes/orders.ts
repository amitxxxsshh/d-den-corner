import { Hono } from "hono";

import {
  createOrder,
  getOrderDetails,
  getOrderHistoryForCustomerSession,
  getRunningOrdersForCustomerSession,
} from "../db/orders";

import {
  getCustomerSessionContext,
} from "../utils/customer-session";

import type {
  CreateOrderInput,
} from "../types/orders";

import type {
  Bindings,
} from "../types/env";

const orderRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function isCreateOrderInput(
  value: unknown,
): value is CreateOrderInput {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const body =
    value as Record<
      string,
      unknown
    >;

  if (
    !Array.isArray(
      body.items,
    ) ||
    body.items.length === 0
  ) {
    return false;
  }

  return body.items.every(
    (item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return false;
      }

      const value =
        item as Record<
          string,
          unknown
        >;

      return (
        typeof value.menuItemId ===
          "string" &&
        value.menuItemId.trim()
          .length > 0 &&
        Number.isInteger(
          value.quantity,
        ) &&
        Number(value.quantity) > 0
      );
    },
  );
}

orderRoutes.post(
  "/",
  async (c) => {
    const session =
      await getCustomerSessionContext(
        c,
      );

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

    let body: unknown;

    try {
      body =
        await c.req.json();
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

    if (
      !isCreateOrderInput(
        body,
      )
    ) {
      return c.json(
        {
          ok: false,
          message:
            "A valid order is required.",
        },
        400,
      );
    }

    try {
      const order =
        await createOrder(
          c.env.DB,
          session.tableSessionId,
          session.customerSessionId,
          body,
        );

      return c.json(
        {
          ok: true,
          order,
        },
        201,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "MENU_ITEM_UNAVAILABLE"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "One or more selected items are no longer available.",
          },
          409,
        );
      }

      if (
        error instanceof Error &&
        (
          error.message ===
            "INVALID_ORDER_ITEMS" ||
          error.message ===
            "EMPTY_ORDER"
        )
      ) {
        return c.json(
          {
            ok: false,
            message:
              "The order items are invalid.",
          },
          400,
        );
      }

      console.error(
        "Order creation failed:",
        error,
      );

      return c.json(
        {
          ok: false,
          message:
            "Unable to create the order.",
        },
        500,
      );
    }
  },
);

orderRoutes.get(
  "/running",
  async (c) => {
    const session =
      await getCustomerSessionContext(
        c,
      );

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

    const orders =
      await getRunningOrdersForCustomerSession(
        c.env.DB,
        session.customerSessionId,
        session.tableSessionId,
      );

    return c.json({
      ok: true,
      orders,
    });
  },
);

orderRoutes.get(
  "/:id/history",
  async (c) => {
    const session =
      await getCustomerSessionContext(
        c,
      );

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

    const orderId =
      c.req.param("id");

    const history =
      await getOrderHistoryForCustomerSession(
        c.env.DB,
        orderId,
        session.customerSessionId,
        session.tableSessionId,
      );

    return c.json({
      ok: true,
      history,
    });
  },
);

orderRoutes.get(
  "/:id",
  async (c) => {
    const session =
      await getCustomerSessionContext(
        c,
      );

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

    const orderId =
      c.req.param("id");

    const order =
      await getOrderDetails(
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

    if (
      order.customer_session_id !==
        session.customerSessionId ||
      order.table_session_id !==
        session.tableSessionId
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Order not found.",
        },
        404,
      );
    }

    return c.json({
      ok: true,
      order,
    });
  },
);

export default orderRoutes;