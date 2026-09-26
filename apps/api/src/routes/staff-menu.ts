import { Hono } from "hono";

import type { Bindings } from "../types/env";

import {
  createMenuCategory,
  createMenuItem,
  getAllMenuCategories,
  getAllMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from "../db/menu";

const app = new Hono<{
  Bindings: Bindings;
}>();

function getStaffUserId(
  c: any
): string | null {
  return c.req.header("X-Staff-User-Id") || null;
}

function requireStaff(
  c: any
): Response | null {
  const staffUserId = getStaffUserId(c);

  if (!staffUserId) {
    return c.json(
      {
        ok: false,
        message: "Staff authentication required.",
      },
      401
    );
  }

  return null;
}

/*
 * GET /api/staff/menu/categories
 */
app.get("/categories", async (c) => {
  const authError = requireStaff(c);

  if (authError) {
    return authError;
  }

  const categories = await getAllMenuCategories(
    c.env.DB
  );

  return c.json({
    ok: true,
    categories,
  });
});

/*
 * POST /api/staff/menu/categories
 */
app.post("/categories", async (c) => {
  const authError = requireStaff(c);

  if (authError) {
    return authError;
  }

  try {
    const body = await c.req.json();

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const sortOrder =
      Number.isInteger(body?.sortOrder)
        ? body.sortOrder
        : 0;

    if (!name) {
      return c.json(
        {
          ok: false,
          message: "Category name is required.",
        },
        400
      );
    }

    if (sortOrder < 0) {
      return c.json(
        {
          ok: false,
          message: "Sort order cannot be negative.",
        },
        400
      );
    }

    const category = await createMenuCategory(
      c.env.DB,
      {
        name,
        sortOrder,
      }
    );

    return c.json(
      {
        ok: true,
        category,
      },
      201
    );
  } catch (error) {
    console.error(
      "Failed to create menu category:",
      error
    );

    return c.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create menu category.",
      },
      400
    );
  }
});

/*
 * PATCH /api/staff/menu/categories/:categoryId
 */
app.patch(
  "/categories/:categoryId",
  async (c) => {
    const authError = requireStaff(c);

    if (authError) {
      return authError;
    }

    try {
      const categoryId =
        c.req.param("categoryId");

      const body = await c.req.json();

      const input: {
        name?: string;
        sortOrder?: number;
        active?: boolean;
      } = {};

      if (typeof body?.name === "string") {
        input.name = body.name.trim();
      }

      if (Number.isInteger(body?.sortOrder)) {
        input.sortOrder = body.sortOrder;
      }

      if (typeof body?.active === "boolean") {
        input.active = body.active;
      }

      const category =
        await updateMenuCategory(
          c.env.DB,
          categoryId,
          input
        );

      if (!category) {
        return c.json(
          {
            ok: false,
            message: "Menu category not found.",
          },
          404
        );
      }

      return c.json({
        ok: true,
        category,
      });
    } catch (error) {
      console.error(
        "Failed to update menu category:",
        error
      );

      return c.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update menu category.",
        },
        400
      );
    }
  }
);

/*
 * GET /api/staff/menu/items
 */
app.get("/items", async (c) => {
  const authError = requireStaff(c);

  if (authError) {
    return authError;
  }

  const items = await getAllMenuItems(
    c.env.DB
  );

  return c.json({
    ok: true,
    items,
  });
});

/*
 * POST /api/staff/menu/items
 */
app.post("/items", async (c) => {
  const authError = requireStaff(c);

  if (authError) {
    return authError;
  }

  try {
    const body = await c.req.json();

    const categoryId =
      typeof body?.categoryId === "string"
        ? body.categoryId.trim()
        : "";

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body?.description === "string"
        ? body.description.trim()
        : "";

    const priceMinor = Number(body?.priceMinor);

    if (!categoryId) {
      return c.json(
        {
          ok: false,
          message: "Category is required.",
        },
        400
      );
    }

    if (!name) {
      return c.json(
        {
          ok: false,
          message: "Menu item name is required.",
        },
        400
      );
    }

    if (
      !Number.isInteger(priceMinor) ||
      priceMinor < 0
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Price must be a non-negative integer in minor units.",
        },
        400
      );
    }

    const item = await createMenuItem(
      c.env.DB,
      {
        categoryId,
        name,
        description,
        priceMinor,
      }
    );

    return c.json(
      {
        ok: true,
        item,
      },
      201
    );
  } catch (error) {
    console.error(
      "Failed to create menu item:",
      error
    );

    return c.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create menu item.",
      },
      400
    );
  }
});

/*
 * PATCH /api/staff/menu/items/:itemId
 */
app.patch(
  "/items/:itemId",
  async (c) => {
    const authError = requireStaff(c);

    if (authError) {
      return authError;
    }

    try {
      const itemId =
        c.req.param("itemId");

      const body = await c.req.json();

      const input: {
        categoryId?: string;
        name?: string;
        description?: string;
        priceMinor?: number;
        available?: boolean;
        archived?: boolean;
      } = {};

      if (typeof body?.categoryId === "string") {
        input.categoryId =
          body.categoryId.trim();
      }

      if (typeof body?.name === "string") {
        input.name = body.name.trim();
      }

      if (typeof body?.description === "string") {
        input.description =
          body.description.trim();
      }

      if (body?.priceMinor !== undefined) {
        const priceMinor =
          Number(body.priceMinor);

        if (
          !Number.isInteger(priceMinor) ||
          priceMinor < 0
        ) {
          return c.json(
            {
              ok: false,
              message:
                "Price must be a non-negative integer in minor units.",
            },
            400
          );
        }

        input.priceMinor = priceMinor;
      }

      if (typeof body?.available === "boolean") {
        input.available = body.available;
      }

      if (typeof body?.archived === "boolean") {
        input.archived = body.archived;
      }

      const item =
        await updateMenuItem(
          c.env.DB,
          itemId,
          input
        );

      if (!item) {
        return c.json(
          {
            ok: false,
            message: "Menu item not found.",
          },
          404
        );
      }

      return c.json({
        ok: true,
        item,
      });
    } catch (error) {
      console.error(
        "Failed to update menu item:",
        error
      );

      return c.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update menu item.",
        },
        400
      );
    }
  }
);

export default app;