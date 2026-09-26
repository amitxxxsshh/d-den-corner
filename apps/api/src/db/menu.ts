import type { D1Database } from "@cloudflare/workers-types";

import { execute, queryMany, queryOne } from "./index";
import type {
  MenuCategoryRow,
  MenuItemRow,
} from "../types/database";
import { generateOpaqueToken } from "../utils/crypto";

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

export async function getAllMenuCategories(
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
      ORDER BY sort_order ASC, name ASC
    `
  );
}

export async function getMenuCategoryById(
  db: D1Database,
  categoryId: string
): Promise<MenuCategoryRow | null> {
  return queryOne<MenuCategoryRow>(
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
      WHERE id = ?
      LIMIT 1
    `,
    categoryId
  );
}

export async function createMenuCategory(
  db: D1Database,
  input: {
    name: string;
    sortOrder?: number;
  }
): Promise<MenuCategoryRow> {
  const id = generateOpaqueToken(16);
  const name = input.name.trim();
  const sortOrder = Number.isInteger(input.sortOrder)
    ? input.sortOrder
    : 0;

  await execute(
    db,
    `
      INSERT INTO menu_categories (
        id,
        name,
        sort_order,
        active
      )
      VALUES (?, ?, ?, 1)
    `,
    id,
    name,
    sortOrder
  );

  const category = await getMenuCategoryById(db, id);

  if (!category) {
    throw new Error("Failed to create menu category.");
  }

  return category;
}

export async function updateMenuCategory(
  db: D1Database,
  categoryId: string,
  input: {
    name?: string;
    sortOrder?: number;
    active?: boolean;
  }
): Promise<MenuCategoryRow | null> {
  const current = await getMenuCategoryById(db, categoryId);

  if (!current) {
    return null;
  }

  const name =
    typeof input.name === "string"
      ? input.name.trim()
      : current.name;

  const sortOrder =
    Number.isInteger(input.sortOrder)
      ? input.sortOrder
      : current.sort_order;

  const active =
    typeof input.active === "boolean"
      ? input.active
        ? 1
        : 0
      : current.active;

  await execute(
    db,
    `
      UPDATE menu_categories
      SET
        name = ?,
        sort_order = ?,
        active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    name,
    sortOrder,
    active,
    categoryId
  );

  return getMenuCategoryById(db, categoryId);
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

export async function getStaffMenuItems(
  db: D1Database,
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
      WHERE archived = 0
      ORDER BY name ASC
    `,
  );
}

export async function getAllMenuItems(
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
      WHERE archived = 0
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

export async function createMenuItem(
  db: D1Database,
  input: {
    categoryId: string;
    name: string;
    description?: string;
    priceMinor: number;
  }
): Promise<MenuItemRow> {
  const category = await getMenuCategoryById(
    db,
    input.categoryId
  );

  if (!category) {
    throw new Error("Menu category not found.");
  }

  if (category.active !== 1) {
    throw new Error("Menu category is inactive.");
  }

  const id = generateOpaqueToken(16);

  await execute(
    db,
    `
      INSERT INTO menu_items (
        id,
        category_id,
        name,
        description,
        price_minor,
        available,
        archived
      )
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `,
    id,
    input.categoryId,
    input.name.trim(),
    input.description?.trim() || null,
    input.priceMinor
  );

  const item = await getMenuItemById(db, id);

  if (!item) {
    throw new Error("Failed to create menu item.");
  }

  return item;
}

export async function updateMenuItem(
  db: D1Database,
  menuItemId: string,
  input: {
    categoryId?: string;
    name?: string;
    description?: string;
    priceMinor?: number;
    available?: boolean;
    archived?: boolean;
  }
): Promise<MenuItemRow | null> {
  const current = await getMenuItemById(
    db,
    menuItemId
  );

  if (!current) {
    return null;
  }

  const categoryId =
    typeof input.categoryId === "string"
      ? input.categoryId
      : current.category_id;

  const category = await getMenuCategoryById(
    db,
    categoryId
  );

  if (!category) {
    throw new Error("Menu category not found.");
  }

  const name =
    typeof input.name === "string"
      ? input.name.trim()
      : current.name;

  const description =
    typeof input.description === "string"
      ? input.description.trim() || null
      : current.description;

  const priceMinor =
    Number.isInteger(input.priceMinor)
      ? input.priceMinor
      : current.price_minor;

  const available =
    typeof input.available === "boolean"
      ? input.available
        ? 1
        : 0
      : current.available;

  const archived =
    typeof input.archived === "boolean"
      ? input.archived
        ? 1
        : 0
      : current.archived;

  await execute(
    db,
    `
      UPDATE menu_items
      SET
        category_id = ?,
        name = ?,
        description = ?,
        price_minor = ?,
        available = ?,
        archived = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    categoryId,
    name,
    description,
    priceMinor,
    available,
    archived,
    menuItemId
  );

  return getMenuItemById(db, menuItemId);
}

