import { apiRequest } from "./api";

export async function getStaffOrders() {
  return apiRequest(
    "/api/staff/orders",
  );
}

export async function getStaffOrder(
  orderId,
) {
  return apiRequest(
    `/api/staff/orders/${encodeURIComponent(
      orderId,
    )}`,
  );
}

export async function advanceOrderStatus(
  orderId,
) {
  return apiRequest(
    `/api/staff/orders/${encodeURIComponent(
      orderId,
    )}/status`,
    {
      method: "POST",
    },
  );
}