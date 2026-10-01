import type { OrderStatus } from "../types/orders";

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  NEW: "ACCEPTED",
  ACCEPTED: null,
  PREPARING: null,
  READY: null,
  SERVED: null,
};

export function getNextOrderStatus(
  status: OrderStatus,
): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function canTransitionOrderStatus(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): boolean {
  return NEXT_STATUS[fromStatus] === toStatus;
}