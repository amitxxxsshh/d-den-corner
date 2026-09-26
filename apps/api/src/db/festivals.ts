import type { D1Database } from "@cloudflare/workers-types";

import {
  execute,
  queryMany,
  queryOne,
} from "./index";

import type {
  FestivalRow,
  SpecialMenuItemRow,
  SpecialMenuRow,
} from "../types/database";

import type {
  CreateFestivalInput,
  UpdateFestivalInput,
} from "../types/festival";

export async function getFestivalById(
  db: D1Database,
  festivalId: string,
): Promise<FestivalRow | null> {
  return queryOne<FestivalRow>(
    db,
    `
      SELECT
        id,
        category,
        name,
        description,
        start_date,
        end_date,
        active,
        archived,
        created_at,
        updated_at
      FROM festivals
      WHERE id = ?
      LIMIT 1
    `,
    festivalId,
  );
}

export async function getActiveFestivals(
  db: D1Database,
): Promise<FestivalRow[]> {
  return queryMany<FestivalRow>(
    db,
    `
      SELECT
        id,
        category,
        name,
        description,
        start_date,
        end_date,
        active,
        archived,
        created_at,
        updated_at
      FROM festivals
      WHERE active = 1
        AND archived = 0
      ORDER BY start_date ASC, name ASC
    `,
  );
}

export async function getCurrentFestivals(
  db: D1Database,
): Promise<FestivalRow[]> {
  return queryMany<FestivalRow>(
    db,
    `
      SELECT
        id,
        category,
        name,
        description,
        start_date,
        end_date,
        active,
        archived,
        created_at,
        updated_at
      FROM festivals
      WHERE active = 1
        AND archived = 0
        AND start_date <= date('now')
        AND end_date >= date('now')
      ORDER BY start_date ASC, name ASC
    `,
  );
}

export async function getUpcomingFestivals(
  db: D1Database,
): Promise<FestivalRow[]> {
  return queryMany<FestivalRow>(
    db,
    `
      SELECT
        id,
        category,
        name,
        description,
        start_date,
        end_date,
        active,
        archived,
        created_at,
        updated_at
      FROM festivals
      WHERE active = 1
        AND archived = 0
        AND start_date > date('now')
      ORDER BY start_date ASC, name ASC
    `,
  );
}

export async function getSpecialMenusByFestival(
  db: D1Database,
  festivalId: string,
): Promise<SpecialMenuRow[]> {
  return queryMany<SpecialMenuRow>(
    db,
    `
      SELECT
        id,
        festival_id,
        name,
        active,
        created_at
      FROM special_menus
      WHERE festival_id = ?
        AND active = 1
      ORDER BY name ASC
    `,
    festivalId,
  );
}

export async function getAllSpecialMenusByFestival(
  db: D1Database,
  festivalId: string,
): Promise<SpecialMenuRow[]> {
  return queryMany<SpecialMenuRow>(
    db,
    `
      SELECT
        id,
        festival_id,
        name,
        active,
        created_at
      FROM special_menus
      WHERE festival_id = ?
      ORDER BY name ASC
    `,
    festivalId,
  );
}

export async function getSpecialMenuById(
  db: D1Database,
  specialMenuId: string,
): Promise<SpecialMenuRow | null> {
  return queryOne<SpecialMenuRow>(
    db,
    `
      SELECT
        id,
        festival_id,
        name,
        active,
        created_at
      FROM special_menus
      WHERE id = ?
      LIMIT 1
    `,
    specialMenuId,
  );
}

export async function getSpecialMenuItems(
  db: D1Database,
  specialMenuId: string,
): Promise<SpecialMenuItemRow[]> {
  return queryMany<SpecialMenuItemRow>(
    db,
    `
      SELECT
        id,
        special_menu_id,
        menu_item_id,
        special_price_minor,
        available,
        created_at
      FROM special_menu_items
      WHERE special_menu_id = ?
        AND available = 1
      ORDER BY created_at ASC
    `,
    specialMenuId,
  );
}

export async function getAllSpecialMenuItems(
  db: D1Database,
  specialMenuId: string,
): Promise<SpecialMenuItemRow[]> {
  return queryMany<SpecialMenuItemRow>(
    db,
    `
      SELECT
        id,
        special_menu_id,
        menu_item_id,
        special_price_minor,
        available,
        created_at
      FROM special_menu_items
      WHERE special_menu_id = ?
      ORDER BY created_at ASC
    `,
    specialMenuId,
  );
}

export async function getCurrentSpecialMenus(
  db: D1Database,
): Promise<SpecialMenuRow[]> {
  return queryMany<SpecialMenuRow>(
    db,
    `
      SELECT
        sm.id,
        sm.festival_id,
        sm.name,
        sm.active,
        sm.created_at
      FROM special_menus sm
      INNER JOIN festivals f
        ON f.id = sm.festival_id
      WHERE sm.active = 1
        AND f.active = 1
        AND f.archived = 0
        AND f.start_date <= date('now')
        AND f.end_date >= date('now')
      ORDER BY f.start_date ASC, sm.name ASC
    `,
  );
}

export async function createFestival(
  db: D1Database,
  input: CreateFestivalInput,
): Promise<FestivalRow> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await execute(
    db,
    `
      INSERT INTO festivals (
        id,
        category,
        name,
        description,
        start_date,
        end_date,
        active,
        archived,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `,
    id,
    input.category,
    input.name.trim(),
    input.description?.trim() || null,
    input.startDate,
    input.endDate,
    now,
    now,
  );

  const festival =
    await getFestivalById(
      db,
      id,
    );

  if (!festival) {
    throw new Error(
      "FESTIVAL_CREATE_FAILED",
    );
  }

  return festival;
}

export async function updateFestival(
  db: D1Database,
  festivalId: string,
  input: UpdateFestivalInput,
): Promise<FestivalRow> {
  const current =
    await getFestivalById(
      db,
      festivalId,
    );

  if (!current) {
    throw new Error(
      "FESTIVAL_NOT_FOUND",
    );
  }

  const category =
    input.category ??
    current.category;

  const name =
    input.name !== undefined
      ? input.name.trim()
      : current.name;

  const description =
    input.description !== undefined
      ? input.description.trim() || null
      : current.description;

  const startDate =
    input.startDate ??
    current.start_date;

  const endDate =
    input.endDate ??
    current.end_date;

  const active =
    input.active !== undefined
      ? input.active
        ? 1
        : 0
      : current.active;

  const archived =
    input.archived !== undefined
      ? input.archived
        ? 1
        : 0
      : current.archived;

  const now =
    new Date().toISOString();

  await execute(
    db,
    `
      UPDATE festivals
      SET
        category = ?,
        name = ?,
        description = ?,
        start_date = ?,
        end_date = ?,
        active = ?,
        archived = ?,
        updated_at = ?
      WHERE id = ?
    `,
    category,
    name,
    description,
    startDate,
    endDate,
    active,
    archived,
    now,
    festivalId,
  );

  const updated =
    await getFestivalById(
      db,
      festivalId,
    );

  if (!updated) {
    throw new Error(
      "FESTIVAL_UPDATE_FAILED",
    );
  }

  return updated;
}

export async function createSpecialMenu(
  db: D1Database,
  festivalId: string,
  name: string,
): Promise<SpecialMenuRow> {
  const festival =
    await getFestivalById(
      db,
      festivalId,
    );

  if (!festival) {
    throw new Error(
      "FESTIVAL_NOT_FOUND",
    );
  }

  const id =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  await execute(
    db,
    `
      INSERT INTO special_menus (
        id,
        festival_id,
        name,
        active,
        created_at
      )
      VALUES (?, ?, ?, 0, ?)
    `,
    id,
    festivalId,
    name.trim(),
    now,
  );

  const specialMenu =
    await getSpecialMenuById(
      db,
      id,
    );

  if (!specialMenu) {
    throw new Error(
      "SPECIAL_MENU_CREATE_FAILED",
    );
  }

  return specialMenu;
}

export async function updateSpecialMenuStatus(
  db: D1Database,
  specialMenuId: string,
  active: boolean,
): Promise<SpecialMenuRow> {
  const existing =
    await getSpecialMenuById(
      db,
      specialMenuId,
    );

  if (!existing) {
    throw new Error(
      "SPECIAL_MENU_NOT_FOUND",
    );
  }

  await execute(
    db,
    `
      UPDATE special_menus
      SET active = ?
      WHERE id = ?
    `,
    active ? 1 : 0,
    specialMenuId,
  );

  const updated =
    await getSpecialMenuById(
      db,
      specialMenuId,
    );

  if (!updated) {
    throw new Error(
      "SPECIAL_MENU_UPDATE_FAILED",
    );
  }

  return updated;
}

export async function addSpecialMenuItem(
  db: D1Database,
  specialMenuId: string,
  menuItemId: string,
  specialPriceMinor?: number,
): Promise<SpecialMenuItemRow> {
  const specialMenu =
    await getSpecialMenuById(
      db,
      specialMenuId,
    );

  if (!specialMenu) {
    throw new Error(
      "SPECIAL_MENU_NOT_FOUND",
    );
  }

  const menuItem =
    await queryOne<{
      id: string;
    }>(
      db,
      `
        SELECT id
        FROM menu_items
        WHERE id = ?
        LIMIT 1
      `,
      menuItemId,
    );

  if (!menuItem) {
    throw new Error(
      "MENU_ITEM_NOT_FOUND",
    );
  }

  const existing =
    await queryOne<SpecialMenuItemRow>(
      db,
      `
        SELECT
          id,
          special_menu_id,
          menu_item_id,
          special_price_minor,
          available,
          created_at
        FROM special_menu_items
        WHERE special_menu_id = ?
          AND menu_item_id = ?
        LIMIT 1
      `,
      specialMenuId,
      menuItemId,
    );

  if (existing) {
    await execute(
      db,
      `
        UPDATE special_menu_items
        SET
          special_price_minor = ?,
          available = 1
        WHERE id = ?
      `,
      specialPriceMinor ??
        null,
      existing.id,
    );

    const updated =
      await queryOne<SpecialMenuItemRow>(
        db,
        `
          SELECT
            id,
            special_menu_id,
            menu_item_id,
            special_price_minor,
            available,
            created_at
          FROM special_menu_items
          WHERE id = ?
          LIMIT 1
        `,
        existing.id,
      );

    if (!updated) {
      throw new Error(
        "SPECIAL_MENU_ITEM_UPDATE_FAILED",
      );
    }

    return updated;
  }

  const id =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  await execute(
    db,
    `
      INSERT INTO special_menu_items (
        id,
        special_menu_id,
        menu_item_id,
        special_price_minor,
        available,
        created_at
      )
      VALUES (?, ?, ?, ?, 1, ?)
    `,
    id,
    specialMenuId,
    menuItemId,
    specialPriceMinor ??
      null,
    now,
  );

  const created =
    await queryOne<SpecialMenuItemRow>(
      db,
      `
        SELECT
          id,
          special_menu_id,
          menu_item_id,
          special_price_minor,
          available,
          created_at
        FROM special_menu_items
        WHERE id = ?
        LIMIT 1
      `,
      id,
    );

  if (!created) {
    throw new Error(
      "SPECIAL_MENU_ITEM_CREATE_FAILED",
    );
  }

  return created;
}

export async function updateSpecialMenuItemAvailability(
  db: D1Database,
  specialMenuItemId: string,
  available: boolean,
): Promise<SpecialMenuItemRow> {
  const existing =
    await queryOne<SpecialMenuItemRow>(
      db,
      `
        SELECT
          id,
          special_menu_id,
          menu_item_id,
          special_price_minor,
          available,
          created_at
        FROM special_menu_items
        WHERE id = ?
        LIMIT 1
      `,
      specialMenuItemId,
    );

  if (!existing) {
    throw new Error(
      "SPECIAL_MENU_ITEM_NOT_FOUND",
    );
  }

  await execute(
    db,
    `
      UPDATE special_menu_items
      SET available = ?
      WHERE id = ?
    `,
    available ? 1 : 0,
    specialMenuItemId,
  );

  const updated =
    await queryOne<SpecialMenuItemRow>(
      db,
      `
        SELECT
          id,
          special_menu_id,
          menu_item_id,
          special_price_minor,
          available,
          created_at
        FROM special_menu_items
        WHERE id = ?
        LIMIT 1
      `,
      specialMenuItemId,
    );

  if (!updated) {
    throw new Error(
      "SPECIAL_MENU_ITEM_UPDATE_FAILED",
    );
  }

  return updated;
}

export async function updateSpecialMenuItemPrice(
  db: D1Database,
  specialMenuItemId: string,
  specialPriceMinor: number | null,
): Promise<SpecialMenuItemRow> {
  const existing =
    await queryOne<SpecialMenuItemRow>(
      db,
      `
        SELECT
          id,
          special_menu_id,
          menu_item_id,
          special_price_minor,
          available,
          created_at
        FROM special_menu_items
        WHERE id = ?
        LIMIT 1
      `,
      specialMenuItemId,
    );

  if (!existing) {
    throw new Error(
      "SPECIAL_MENU_ITEM_NOT_FOUND",
    );
  }

  await execute(
    db,
    `
      UPDATE special_menu_items
      SET special_price_minor = ?
      WHERE id = ?
    `,
    specialPriceMinor,
    specialMenuItemId,
  );

  const updated =
    await queryOne<SpecialMenuItemRow>(
      db,
      `
        SELECT
          id,
          special_menu_id,
          menu_item_id,
          special_price_minor,
          available,
          created_at
        FROM special_menu_items
        WHERE id = ?
        LIMIT 1
      `,
      specialMenuItemId,
    );

  if (!updated) {
    throw new Error(
      "SPECIAL_MENU_ITEM_UPDATE_FAILED",
    );
  }

  return updated;
}