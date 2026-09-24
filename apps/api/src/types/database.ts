export type UserRole = "STAFF" | "ADMIN";

export type TableSessionStatus = "ACTIVE" | "CLOSED";

export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "SERVED";

export type FestivalCategory = "ODISHA" | "INDIAN" | "CUSTOM";

export interface UserRow {
  id: string;
  email: string;
  role: UserRole;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface LocationRow {
  id: string;
  name: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface TableRow {
  id: string;
  location_id: string;
  name: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface QRTokenRow {
  id: string;
  table_id: string;
  token_hash: string;
  active: number;
  created_at: string;
  revoked_at: string | null;
}

export interface TableSessionRow {
  id: string;
  table_id: string;
  status: TableSessionStatus;
  started_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface CustomerSessionRow {
  id: string;
  table_session_id: string;
  session_token_hash: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
}

export interface MenuCategoryRow {
  id: string;
  name: string;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_minor: number;
  available: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  table_session_id: string;
  customer_session_id: string;
  status: OrderStatus;
  total_amount_minor: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
  created_at: string;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by_user_id: string | null;
  created_at: string;
}

export interface FestivalRow {
  id: string;
  category: FestivalCategory;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  active: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

export interface SpecialMenuRow {
  id: string;
  festival_id: string;
  name: string;
  active: number;
  created_at: string;
}

export interface SpecialMenuItemRow {
  id: string;
  special_menu_id: string;
  menu_item_id: string;
  special_price_minor: number | null;
  available: number;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details_json: string | null;
  created_at: string;
}