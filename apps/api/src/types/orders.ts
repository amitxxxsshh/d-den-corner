export const ORDER_STATUSES = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "SERVED",
] as const;

export type OrderStatus =
  (typeof ORDER_STATUSES)[number];

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
}

export interface MenuItemForOrder {
  id: string;
  name: string;
  price_minor: number;
  available: number;
  archived: number;
}

export interface CreatedOrderItem {
  id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
}

export interface CreatedOrder {
  id: string;
  table_session_id: string;
  customer_session_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  items: CreatedOrderItem[];
  created_at: string;
}

export interface OrderDetails {
  id: string;
  table_session_id: string;
  customer_session_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  created_at: string;
  updated_at: string;
  items: CreatedOrderItem[];
}

export interface OrderStatusHistoryItem {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by_user_id: string | null;
  created_at: string;
}