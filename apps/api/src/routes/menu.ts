import { Hono } from "hono";

import {
  getActiveMenuCategories,
  getAvailableMenuItems,
  getAvailableMenuItemsByCategory,
  getMenuItemById,
} from "../db/menu";

import type { Bindings } from "../types/env";

const menuRoutes =
  new Hono<{ Bindings: Bindings }>();

/*
 * Public menu routes.
 *
 * These routes are intentionally readable without
 * a customer session. The customer website can show
 * the menu publicly.
 *
 * Ordering itself remains protected by the order API,
 * which requires a valid customer session.
 */

menuRoutes.get("/", async (c) => {
  const [
    categories,
    items,
  ] = await Promise.all([
    getActiveMenuCategories(c.env.DB),
    getAvailableMenuItems(c.env.DB),
  ]);

  return c.json({
    ok: true,
    categories,
    items,
  });
});

menuRoutes.get(
  "/categories",
  async (c) => {
    const categories =
      await getActiveMenuCategories(
        c.env.DB,
      );

    return c.json({
      ok: true,
      categories,
    });
  },
);

menuRoutes.get(
  "/items/:id",
  async (c) => {
    const id = c.req.param("id");

    const item =
      await getMenuItemById(
        c.env.DB,
        id,
      );

    if (
      !item ||
      item.available !== 1 ||
      item.archived !== 0
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Menu item is unavailable.",
        },
        404,
      );
    }

    return c.json({
      ok: true,
      item,
    });
  },
);

menuRoutes.get(
  "/search",
  async (c) => {
    const query =
      c.req.query("q")?.trim() || "";

    const items =
      await getAvailableMenuItems(
        c.env.DB,
      );

    const normalized =
      query.toLowerCase();

    const filtered =
      normalized.length === 0
        ? items
        : items.filter((item) => {
            const name =
              item.name.toLowerCase();

            const description =
              item.description
                ?.toLowerCase() || "";

            return (
              name.includes(normalized) ||
              description.includes(normalized)
            );
          });

    return c.json({
      ok: true,
      items: filtered,
    });
  },
);

menuRoutes.get(
  "/categories/:categoryId/items",
  async (c) => {
    const categoryId =
      c.req.param("categoryId");

    const items =
      await getAvailableMenuItemsByCategory(
        c.env.DB,
        categoryId,
      );

    return c.json({
      ok: true,
      items,
    });
  },
);

export default menuRoutes;