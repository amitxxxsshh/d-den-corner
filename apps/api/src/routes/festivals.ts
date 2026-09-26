import { Hono } from "hono";

import {
  getCurrentFestivals,
  getSpecialMenusByFestival,
  getSpecialMenuItems,
} from "../db/festivals";
import { getMenuItemById } from "../db/menu";

import type { Bindings } from "../types/env";

const festivalRoutes = new Hono<{
  Bindings: Bindings;
}>();

festivalRoutes.get("/current", async (c) => {
  const festivals = await getCurrentFestivals(c.env.DB);

  const result = [];

  for (const festival of festivals) {
    const specialMenus = await getSpecialMenusByFestival(
      c.env.DB,
      festival.id,
    );

    const menus = [];

    for (const specialMenu of specialMenus) {
      const specialMenuItems = await getSpecialMenuItems(
        c.env.DB,
        specialMenu.id,
      );

      const items = [];

      for (const specialMenuItem of specialMenuItems) {
        const menuItem = await getMenuItemById(
          c.env.DB,
          specialMenuItem.menu_item_id,
        );

        if (!menuItem) {
          continue;
        }

        if (menuItem.available !== 1 || menuItem.archived !== 0) {
          continue;
        }

        items.push({
          id: specialMenuItem.id,
          menuItemId: menuItem.id,
          name: menuItem.name,
          description: menuItem.description,
          regularPriceMinor: menuItem.price_minor,
          specialPriceMinor:
            specialMenuItem.special_price_minor ??
            menuItem.price_minor,
          categoryId: menuItem.category_id,
          available: specialMenuItem.available === 1,
        });
      }

      if (items.length === 0) {
        continue;
      }

      menus.push({
        id: specialMenu.id,
        name: specialMenu.name,
        items,
      });
    }

    if (menus.length === 0) {
      continue;
    }

    result.push({
      id: festival.id,
      category: festival.category,
      name: festival.name,
      description: festival.description,
      startDate: festival.start_date,
      endDate: festival.end_date,
      specialMenus: menus,
    });
  }

  return c.json({
    ok: true,
    festivals: result,
  });
});

export default festivalRoutes;