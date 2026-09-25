export const CUSTOMER_ROUTES = {
  MENU: "/menu",
  CART: "/cart",
  ORDERS: "/orders",
} as const;

export const ORDER_STATUS = {
  NEW: "NEW",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
} as const;

export type OrderStatus =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];