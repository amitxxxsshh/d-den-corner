import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type {
  MenuCategoryRow,
  MenuItemRow,
} from "../types/database";

export async function getActiveMenuCategories(
  db: D1Database
): Promise<MenuCategoryRow[]> {
  return queryMany<MenuCategoryRow>(
    db,
    `
      SELECT
        id,
        name,
        sort_order,
        active,
        created_at,
        updated_at
      FROM menu_categories
      WHERE active = 1
      ORDER BY sort_order ASC, name ASC
    `
  );
}

export async function getMenuItemById(
  db: D1Database,
  menuItemId: string
): Promise<MenuItemRow | null> {
  return queryOne<MenuItemRow>(
    db,
    `
      SELECT
        id,
        category_id,
        name,
        description,
        price_minor,
        available,
        archived,
        created_at,
        updated_at
      FROM menu_items
      WHERE id = ?
      LIMIT 1
    `,
    menuItemId
  );
}

export async function getAvailableMenuItems(
  db: D1Database
): Promise<MenuItemRow[]> {
  return queryMany<MenuItemRow>(
    db,
    `
      SELECT
        id,
        category_id,
        name,
        description,
        price_minor,
        available,
        archived,
        created_at,
        updated_at
      FROM menu_items
      WHERE available = 1
        AND archived = 0
      ORDER BY name ASC
    `
  );
}

export async function getAvailableMenuItemsByCategory(
  db: D1Database,
  categoryId: string
): Promise<MenuItemRow[]> {
  return queryMany<MenuItemRow>(
    db,
    `
      SELECT
        id,
        category_id,
        name,
        description,
        price_minor,
        available,
        archived,
        created_at,
        updated_at
      FROM menu_items
      WHERE category_id = ?
        AND available = 1
        AND archived = 0
      ORDER BY name ASC
    `,
    categoryId
  );
}