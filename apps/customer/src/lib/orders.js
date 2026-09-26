import { apiRequest } from "./api";

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