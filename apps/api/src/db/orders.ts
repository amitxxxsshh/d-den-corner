import type { D1Database } from "@cloudflare/workers-types";

import { execute, queryMany, queryOne } from "./index";

import type {
  OrderItemRow,
  OrderRow,
  OrderStatusHistoryRow,
} from "../types/database";

import type {
  CreateOrderInput,
  CreatedOrder,
  CreatedOrderItem,
  OrderDetails,
  OrderStatus,
  OrderStatusHistoryItem,
} from "../types/orders";

type OrderMenuItem = {
  id: string;
  name: string;
  price_minor: number;
  available: number;
  archived: number;
};

type SpecialMenuPricing = {
  special_menu_id: string;
  menu_item_id: string;
  special_price_minor: number | null;
  special_available: number;
  festival_active: number;
  festival_archived: number;
  festival_start_date: string;
  festival_end_date: string;
};

async function getMenuItemsForOrder(
  db: D1Database,
  menuItemIds: string[],
): Promise<OrderMenuItem[]> {
  if (menuItemIds.length === 0) {
    return [];
  }

  const placeholders = menuItemIds
    .map(() => "?")
    .join(", ");

  return queryMany<OrderMenuItem>(
    db,
    `
      SELECT
        id,
        name,
        price_minor,
        available,
        archived
      FROM menu_items
      WHERE id IN (${placeholders})
    `,
    ...menuItemIds,
  );
}

async function getSpecialMenuPricing(
  db: D1Database,
  specialMenuId: string,
  menuItemId: string,
): Promise<SpecialMenuPricing | null> {
  return queryOne<SpecialMenuPricing>(
    db,
    `
      SELECT
        sm.id AS special_menu_id,
        smi.menu_item_id,
        smi.special_price_minor,
        smi.available AS special_available,
        f.active AS festival_active,
        f.archived AS festival_archived,
        f.start_date AS festival_start_date,
        f.end_date AS festival_end_date
      FROM special_menus sm
      INNER JOIN special_menu_items smi
        ON smi.special_menu_id = sm.id
      INNER JOIN festivals f
        ON f.id = sm.festival_id
      WHERE sm.id = ?
        AND smi.menu_item_id = ?
      LIMIT 1
    `,
    specialMenuId,
    menuItemId,
  );
}

function isFestivalCurrentlyActive(
  pricing: SpecialMenuPricing,
): boolean {
  if (
    pricing.special_available !== 1 ||
    pricing.festival_active !== 1 ||
    pricing.festival_archived !== 0
  ) {
    return false;
  }

  const today =
    new Date().toISOString().slice(0, 10);

  return (
    pricing.festival_start_date <= today &&
    pricing.festival_end_date >= today
  );
}

export async function createOrder(
  db: D1Database,
  tableSessionId: string,
  customerSessionId: string,
  input: CreateOrderInput,
): Promise<CreatedOrder> {
  if (!input.items.length) {
    throw new Error("EMPTY_ORDER");
  }

  /*
   * Merge identical order variants.
   *
   * A regular menu item and the same item from a festival
   * special menu are treated as different order variants.
   */
  const quantities = new Map<
    string,
    {
      menuItemId: string;
      specialMenuId?: string;
      quantity: number;
    }
  >();

  for (const item of input.items) {
    const menuItemId =
      item.menuItemId.trim();

    const specialMenuId =
      item.specialMenuId?.trim() || undefined;

    const quantity =
      Number(item.quantity);

    if (
      !menuItemId ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "INVALID_ORDER_ITEMS",
      );
    }

    const key =
      `${menuItemId}::${specialMenuId || "REGULAR"}`;

    const existing =
      quantities.get(key);

    if (existing) {
      existing.quantity += quantity;
    } else {
      quantities.set(key, {
        menuItemId,
        specialMenuId,
        quantity,
      });
    }
  }

  const orderVariants =
    Array.from(quantities.values());

  const menuItemIds = Array.from(
    new Set(
      orderVariants.map(
        (item) => item.menuItemId,
      ),
    ),
  );

  const menuItems =
    await getMenuItemsForOrder(
      db,
      menuItemIds,
    );

  if (
    menuItems.length !==
    menuItemIds.length
  ) {
    throw new Error(
      "MENU_ITEM_UNAVAILABLE",
    );
  }

  const menuItemMap =
    new Map(
      menuItems.map((item) => [
        item.id,
        item,
      ]),
    );

  const createdAt =
    new Date().toISOString();

  const orderId =
    crypto.randomUUID();

  const createdItems: CreatedOrderItem[] =
    [];

  let totalAmountMinor = 0;

  for (const variant of orderVariants) {
    const menuItem =
      menuItemMap.get(
        variant.menuItemId,
      );

    if (
      !menuItem ||
      menuItem.available !== 1 ||
      menuItem.archived !== 0
    ) {
      throw new Error(
        "MENU_ITEM_UNAVAILABLE",
      );
    }

    let unitPriceMinor =
      Number(
        menuItem.price_minor,
      );

    if (variant.specialMenuId) {
      const pricing =
        await getSpecialMenuPricing(
          db,
          variant.specialMenuId,
          variant.menuItemId,
        );

      if (
        !pricing ||
        !isFestivalCurrentlyActive(
          pricing,
        )
      ) {
        throw new Error(
          "SPECIAL_MENU_UNAVAILABLE",
        );
      }

      /*
       * If special_price_minor is NULL,
       * the schema allows the special menu
       * to use the regular menu price.
       */
      unitPriceMinor =
        pricing.special_price_minor ===
        null
          ? Number(
              menuItem.price_minor,
            )
          : Number(
              pricing.special_price_minor,
            );
    }

    const lineTotalMinor =
      unitPriceMinor *
      variant.quantity;

    totalAmountMinor +=
      lineTotalMinor;

    const itemId =
      crypto.randomUUID();

    await execute(
      db,
      `
        INSERT INTO order_items (
          id,
          order_id,
          menu_item_id,
          item_name_snapshot,
          unit_price_minor,
          quantity,
          line_total_minor,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      itemId,
      orderId,
      menuItem.id,
      menuItem.name,
      unitPriceMinor,
      variant.quantity,
      lineTotalMinor,
      createdAt,
    );

    createdItems.push({
      id: itemId,
      menu_item_id:
        menuItem.id,
      item_name_snapshot:
        menuItem.name,
      unit_price_minor:
        unitPriceMinor,
      quantity:
        variant.quantity,
      line_total_minor:
        lineTotalMinor,
    });
  }

  await execute(
    db,
    `
      INSERT INTO orders (
        id,
        table_session_id,
        customer_session_id,
        status,
        total_amount_minor,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 'NEW', ?, ?, ?)
    `,
    orderId,
    tableSessionId,
    customerSessionId,
    totalAmountMinor,
    createdAt,
    createdAt,
  );

  await execute(
    db,
    `
      INSERT INTO order_status_history (
        id,
        order_id,
        from_status,
        to_status,
        changed_by_user_id,
        created_at
      )
      VALUES (?, ?, NULL, 'NEW', NULL, ?)
    `,
    crypto.randomUUID(),
    orderId,
    createdAt,
  );

  return {
    id: orderId,
    table_session_id:
      tableSessionId,
    customer_session_id:
      customerSessionId,
    status: "NEW",
    total_amount_minor:
      totalAmountMinor,
    items: createdItems,
    created_at:
      createdAt,
  };
}

export async function getOrderById(
  db: D1Database,
  orderId: string,
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
    orderId,
  );
}

export async function getOrderItems(
  db: D1Database,
  orderId: string,
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
    orderId,
  );
}

export async function getOrderStatusHistory(
  db: D1Database,
  orderId: string,
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
    orderId,
  );
}

export async function getOrderDetails(
  db: D1Database,
  orderId: string,
): Promise<OrderDetails | null> {
  const order =
    await getOrderById(
      db,
      orderId,
    );

  if (!order) {
    return null;
  }

  const items =
    await getOrderItems(
      db,
      orderId,
    );

  return {
    id: order.id,
    table_session_id:
      order.table_session_id,
    customer_session_id:
      order.customer_session_id,
    status: order.status,
    total_amount_minor:
      order.total_amount_minor,
    created_at:
      order.created_at,
    updated_at:
      order.updated_at,
    items: items.map(
      (item) => ({
        id: item.id,
        menu_item_id:
          item.menu_item_id,
        item_name_snapshot:
          item.item_name_snapshot,
        unit_price_minor:
          item.unit_price_minor,
        quantity:
          item.quantity,
        line_total_minor:
          item.line_total_minor,
      }),
    ),
  };
}

export async function getOrdersByTableSession(
  db: D1Database,
  tableSessionId: string,
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
    tableSessionId,
  );
}

export async function getRunningOrdersForCustomerSession(
  db: D1Database,
  customerSessionId: string,
  tableSessionId: string,
): Promise<OrderDetails[]> {
  const orders =
    await queryMany<OrderRow>(
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
        WHERE customer_session_id = ?
          AND table_session_id = ?
          AND status IN (
            'NEW',
            'ACCEPTED',
            'PREPARING',
            'READY'
          )
        ORDER BY created_at DESC
      `,
      customerSessionId,
      tableSessionId,
    );

  const result: OrderDetails[] = [];

  for (const order of orders) {
    const details =
      await getOrderDetails(
        db,
        order.id,
      );

    if (details) {
      result.push(details);
    }
  }

  return result;
}

export async function getOrderHistoryForCustomerSession(
  db: D1Database,
  orderId: string,
  customerSessionId: string,
  tableSessionId: string,
): Promise<OrderStatusHistoryItem[]> {
  const order =
    await getOrderById(
      db,
      orderId,
    );

  if (
    !order ||
    order.customer_session_id !==
      customerSessionId ||
    order.table_session_id !==
      tableSessionId
  ) {
    return [];
  }

  const history =
    await getOrderStatusHistory(
      db,
      orderId,
    );

  return history.map(
    (item) => ({
      id: item.id,
      from_status:
        item.from_status,
      to_status:
        item.to_status,
      changed_by_user_id:
        item.changed_by_user_id,
      created_at:
        item.created_at,
    }),
  );
}

export async function getActiveOrders(
  db: D1Database,
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
      WHERE status IN (
        'NEW',
        'ACCEPTED',
        'PREPARING',
        'READY'
      )
      ORDER BY created_at ASC
    `,
  );
}

export async function getOrdersByStatus(
  db: D1Database,
  status: OrderStatus,
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
      WHERE status = ?
      ORDER BY created_at ASC
    `,
    status,
  );
}

export async function updateOrderStatus(
  db: D1Database,
  orderId: string,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  changedByUserId: string,
): Promise<void> {
  const now =
    new Date().toISOString();

  const result =
    await execute(
      db,
      `
        UPDATE orders
        SET
          status = ?,
          updated_at = ?
        WHERE id = ?
          AND status = ?
      `,
      toStatus,
      now,
      orderId,
      fromStatus,
    );

  if (!result.meta.changes) {
    throw new Error(
      "ORDER_STATUS_CHANGED",
    );
  }

  await execute(
    db,
    `
      INSERT INTO order_status_history (
        id,
        order_id,
        from_status,
        to_status,
        changed_by_user_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    crypto.randomUUID(),
    orderId,
    fromStatus,
    toStatus,
    changedByUserId,
    now,
  );
}