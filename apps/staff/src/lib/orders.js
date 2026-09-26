import { apiRequest } from "./api";

export async function getStaffOrders(staffUserId) {
  return apiRequest("/api/staff/orders", {
    headers: {
      "X-Staff-User-Id": staffUserId,
    },
  });
}

export async function getStaffOrder(orderId, staffUserId) {
  return apiRequest(
    `/api/staff/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        "X-Staff-User-Id": staffUserId,
      },
    },
  );
}

export async function advanceOrderStatus(
  orderId,
  staffUserId,
) {
  return apiRequest(
    `/api/staff/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "POST",
      headers: {
        "X-Staff-User-Id": staffUserId,
      },
    },
  );
}