import { Hono } from "hono";

import {
  getActiveMenuCategories,
  getAvailableMenuItems,
  getAvailableMenuItemsByCategory,
  getMenuItemById,
} from "../db/menu";

import {
  getCustomerSessionContext,
} from "../utils/customer-session";

import type { Bindings } from "../types/env";

const menuRoutes =
  new Hono<{ Bindings: Bindings }>();

async function requireCustomerSession(
  c: Parameters<
    typeof getCustomerSessionContext
  >[0],
) {
  return getCustomerSessionContext(c);
}

menuRoutes.get("/", async (c) => {
  const session =
    await requireCustomerSession(c);

  if (!session) {
    return c.json(
      {
        ok: false,
        message: "Customer session is required.",
      },
      401,
    );
  }

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
    const session =
      await requireCustomerSession(c);

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

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
    const session =
      await requireCustomerSession(c);

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

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
    const session =
      await requireCustomerSession(c);

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

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
    const session =
      await requireCustomerSession(c);

    if (!session) {
      return c.json(
        {
          ok: false,
          message:
            "Customer session is required.",
        },
        401,
      );
    }

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