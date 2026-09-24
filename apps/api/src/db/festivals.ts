import type { D1Database } from "@cloudflare/workers-types";

import { queryMany, queryOne } from "./index";
import type {
  FestivalRow,
  SpecialMenuItemRow,
  SpecialMenuRow,
} from "../types/database";

export async function getFestivalById(
  db: D1Database,
  festivalId: string
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
    festivalId
  );
}

export async function getActiveFestivals(
  db: D1Database
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
    `
  );
}

export async function getSpecialMenusByFestival(
  db: D1Database,
  festivalId: string
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
    festivalId
  );
}

export async function getSpecialMenuItems(
  db: D1Database,
  specialMenuId: string
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
    specialMenuId
  );
}