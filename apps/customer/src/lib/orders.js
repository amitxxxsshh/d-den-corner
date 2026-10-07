import { apiRequest } from "./api";

export async function createOrder(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const normalizedItems = items.map((item) => {
    const normalized = {
      menuItemId: item.menuItemId,
      quantity: Number(item.quantity),
    };

    if (item.specialMenuId) {
      normalized.specialMenuId = item.specialMenuId;
    }

    return normalized;
  });

  const invalidItem = normalizedItems.some(
    (item) =>
      !item.menuItemId ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      (item.specialMenuId !== undefined &&
        (!item.specialMenuId ||
          typeof item.specialMenuId !== "string")),
  );

  if (invalidItem) {
    throw new Error("Your cart contains an invalid item.");
  }

  return apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      items: normalizedItems,
    }),
  });
}

export async function getMyOrder(
  orderId,
) {
  if (!orderId) {
    throw new Error(
      "Order ID is required.",
    );
  }

  return apiRequest(
    `/api/orders/${encodeURIComponent(
      orderId,
    )}`,
  );
}

export async function getMyRunningOrders() {
  return apiRequest(
    "/api/orders/running",
  );
}

// Existing orders page uses this name.
// Keep it as a compatibility alias.
export async function getRunningOrders() {
  return getMyRunningOrders();
}

export async function getMyOrderHistory(
  orderId,
) {
  if (!orderId) {
    throw new Error(
      "Order ID is required.",
    );
  }

  return apiRequest(
    `/api/orders/${encodeURIComponent(
      orderId,
    )}/history`,
  );
}