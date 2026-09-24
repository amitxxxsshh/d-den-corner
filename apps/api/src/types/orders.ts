import type {
  OrderItemRow,
  OrderRow,
  OrderStatus,
} from "./database";

export type Order = OrderRow;

export type OrderItem = OrderItemRow;

export type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
};

export type CreateOrderInput = {
  tableSessionId: string;
  customerSessionId: string;
  items: CreateOrderItemInput[];
};

export type OrderStatusUpdateInput = {
  status: OrderStatus;
};

export type OrderWithItems = {
  order: Order;
  items: OrderItem[];
};