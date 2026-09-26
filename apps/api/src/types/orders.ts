import type {
  OrderStatus,
} from "./database";

export type {
  OrderStatus,
} from "./database";

export type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
  specialMenuId?: string;
};

export type CreateOrderInput = {
  items: CreateOrderItemInput[];
};

export type CreatedOrderItem = {
  id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
};

export type CreatedOrder = {
  id: string;
  table_session_id: string;
  customer_session_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  items: CreatedOrderItem[];
  created_at: string;
};

export type OrderDetailsItem = {
  id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
};

export type OrderDetails = {
  id: string;
  table_session_id: string;
  customer_session_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  created_at: string;
  updated_at: string;
  items: OrderDetailsItem[];
};

export type OrderStatusHistoryItem = {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by_user_id: string | null;
  created_at: string;
};