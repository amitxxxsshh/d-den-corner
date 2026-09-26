import { Hono } from "hono";
import type { Context } from "hono";

import {
  addSpecialMenuItem,
  createFestival,
  createSpecialMenu,
  getAllSpecialMenuItems,
  getAllSpecialMenusByFestival,
  getFestivalById,
  getSpecialMenuById,
  updateFestival,
  updateSpecialMenuItemAvailability,
  updateSpecialMenuItemPrice,
  updateSpecialMenuStatus,
} from "../db/festivals";

import type { Bindings } from "../types/env";
import type {
  CreateFestivalInput,
  UpdateFestivalInput,
} from "../types/festival";

const staffFestivalRoutes =
  new Hono<{
    Bindings: Bindings;
  }>();

function getStaffUserId(
  c: Context<{
    Bindings: Bindings;
  }>,
): string | null {
  return (
    c.req.header(
      "X-Staff-User-Id",
    ) || null
  );
}

function requireStaff(
  c: Context<{
    Bindings: Bindings;
  }>,
): string | Response {
  const staffUserId =
    getStaffUserId(c);

  if (!staffUserId) {
    return c.json(
      {
        ok: false,
        message:
          "Staff authentication is required.",
      },
      401,
    );
  }

  return staffUserId;
}

function isValidDateString(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const date =
    new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(
      date.getTime(),
    ) &&
    date
      .toISOString()
      .slice(0, 10) === value
  );
}

function isValidCategory(
  value: unknown,
): value is CreateFestivalInput["category"] {
  return (
    value === "ODISHA" ||
    value === "INDIAN" ||
    value === "CUSTOM"
  );
}

function parseOptionalBoolean(
  value: unknown,
): boolean | undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof value !== "boolean"
  ) {
    return undefined;
  }

  return value;
}

/*
 * GET /api/staff/festivals/:festivalId
 *
 * Staff receives the complete festival configuration,
 * including inactive special menus and unavailable items.
 */
staffFestivalRoutes.get(
  "/:festivalId",
  async (c) => {
    const staffUserId =
      getStaffUserId(c);

    if (!staffUserId) {
      return c.json(
        {
          ok: false,
          message:
            "Staff authentication is required.",
        },
        401,
      );
    }

    const festivalId =
      c.req.param(
        "festivalId",
      );

    const festival =
      await getFestivalById(
        c.env.DB,
        festivalId,
      );

    if (!festival) {
      return c.json(
        {
          ok: false,
          message:
            "Festival not found.",
        },
        404,
      );
    }

    const specialMenus =
      await getAllSpecialMenusByFestival(
        c.env.DB,
        festivalId,
      );

    const menus =
      await Promise.all(
        specialMenus.map(
          async (specialMenu) => ({
            ...specialMenu,
            items:
              await getAllSpecialMenuItems(
                c.env.DB,
                specialMenu.id,
              ),
          }),
        ),
      );

    return c.json({
      ok: true,
      festival: {
        ...festival,
        specialMenus:
          menus,
      },
    });
  },
);

/*
 * POST /api/staff/festivals
 *
 * Creates a festival in an inactive state.
 */
staffFestivalRoutes.post(
  "/",
  async (c) => {
    const staffUserId =
      requireStaff(c);

    if (
      typeof staffUserId !==
      "string"
    ) {
      return staffUserId;
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    if (
      typeof body !==
        "object" ||
      body === null
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Invalid request body.",
        },
        400,
      );
    }

    const input =
      body as Record<
        string,
        unknown
      >;

    const category =
      input.category;

    const name =
      typeof input.name ===
      "string"
        ? input.name.trim()
        : "";

    const description =
      typeof input.description ===
      "string"
        ? input.description.trim()
        : undefined;

    const startDate =
      input.startDate;

    const endDate =
      input.endDate;

    if (
      !isValidCategory(
        category,
      )
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Category must be ODISHA, INDIAN, or CUSTOM.",
        },
        400,
      );
    }

    if (!name) {
      return c.json(
        {
          ok: false,
          message:
            "Festival name is required.",
        },
        400,
      );
    }

    if (
      !isValidDateString(
        startDate,
      ) ||
      !isValidDateString(
        endDate,
      )
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Start date and end date must use YYYY-MM-DD.",
        },
        400,
      );
    }

    if (
      endDate < startDate
    ) {
      return c.json(
        {
          ok: false,
          message:
            "End date cannot be before start date.",
        },
        400,
      );
    }

    try {
      const festival =
        await createFestival(
          c.env.DB,
          {
            category,
            name,
            description,
            startDate,
            endDate,
          },
        );

      return c.json(
        {
          ok: true,
          festival,
        },
        201,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(
          "UNIQUE constraint failed",
        )
      ) {
        return c.json(
          {
            ok: false,
            message:
              "A festival with this information already exists.",
          },
          409,
        );
      }

      throw error;
    }
  },
);

/*
 * PATCH /api/staff/festivals/:festivalId
 *
 * Updates festival metadata and lifecycle flags.
 */
staffFestivalRoutes.patch(
  "/:festivalId",
  async (c) => {
    const staffUserId =
      requireStaff(c);

    if (
      typeof staffUserId !==
      "string"
    ) {
      return staffUserId;
    }

    const festivalId =
      c.req.param(
        "festivalId",
      );

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    if (
      typeof body !==
        "object" ||
      body === null
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Invalid request body.",
        },
        400,
      );
    }

    const input =
      body as Record<
        string,
        unknown
      >;

    const update: UpdateFestivalInput =
      {};

    if (
      input.category !==
      undefined
    ) {
      if (
        !isValidCategory(
          input.category,
        )
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Category must be ODISHA, INDIAN, or CUSTOM.",
          },
          400,
        );
      }

      update.category =
        input.category;
    }

    if (
      input.name !==
      undefined
    ) {
      if (
        typeof input.name !==
          "string" ||
        !input.name.trim()
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Festival name cannot be empty.",
          },
          400,
        );
      }

      update.name =
        input.name.trim();
    }

    if (
      input.description !==
      undefined
    ) {
      if (
        input.description !==
          null &&
        typeof input.description !==
          "string"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Description must be a string or null.",
          },
          400,
        );
      }

      update.description =
        typeof input.description ===
        "string"
          ? input.description.trim()
          : undefined;
    }

    if (
      input.startDate !==
      undefined
    ) {
      if (
        !isValidDateString(
          input.startDate,
        )
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Start date must use YYYY-MM-DD.",
          },
          400,
        );
      }

      update.startDate =
        input.startDate;
    }

    if (
      input.endDate !==
      undefined
    ) {
      if (
        !isValidDateString(
          input.endDate,
        )
      ) {
        return c.json(
          {
            ok: false,
            message:
              "End date must use YYYY-MM-DD.",
          },
          400,
        );
      }

      update.endDate =
        input.endDate;
    }

    const active =
      parseOptionalBoolean(
        input.active,
      );

    const archived =
      parseOptionalBoolean(
        input.archived,
      );

    if (
      input.active !==
        undefined &&
      active === undefined
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Active must be a boolean.",
        },
        400,
      );
    }

    if (
      input.archived !==
        undefined &&
      archived === undefined
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Archived must be a boolean.",
        },
        400,
      );
    }

    if (
      active !==
      undefined
    ) {
      update.active =
        active;
    }

    if (
      archived !==
      undefined
    ) {
      update.archived =
        archived;
    }

    const current =
      await getFestivalById(
        c.env.DB,
        festivalId,
      );

    if (!current) {
      return c.json(
        {
          ok: false,
          message:
            "Festival not found.",
        },
        404,
      );
    }

    const finalStartDate =
      update.startDate ??
      current.start_date;

    const finalEndDate =
      update.endDate ??
      current.end_date;

    if (
      finalEndDate <
      finalStartDate
    ) {
      return c.json(
        {
          ok: false,
          message:
            "End date cannot be before start date.",
        },
        400,
      );
    }

    try {
      const festival =
        await updateFestival(
          c.env.DB,
          festivalId,
          update,
        );

      return c.json({
        ok: true,
        festival,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "FESTIVAL_NOT_FOUND"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Festival not found.",
          },
          404,
        );
      }

      throw error;
    }
  },
);

/*
 * POST /api/staff/festivals/:festivalId/menus
 */
staffFestivalRoutes.post(
  "/:festivalId/menus",
  async (c) => {
    const staffUserId =
      requireStaff(c);

    if (
      typeof staffUserId !==
      "string"
    ) {
      return staffUserId;
    }

    const festivalId =
      c.req.param(
        "festivalId",
      );

    const festival =
      await getFestivalById(
        c.env.DB,
        festivalId,
      );

    if (!festival) {
      return c.json(
        {
          ok: false,
          message:
            "Festival not found.",
        },
        404,
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    const name =
      typeof (
        body as Record<
          string,
          unknown
        >
      )?.name === "string"? (body as Record<string,unknown>).name.trim(): "";

    if (!name) {
      return c.json(
        {
          ok: false,
          message:
            "Special menu name is required.",
        },
        400,
      );
    }

    try {
      const specialMenu =
        await createSpecialMenu(
          c.env.DB,
          festivalId,
          name,
        );

      return c.json(
        {
          ok: true,
          specialMenu,
        },
        201,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "FESTIVAL_NOT_FOUND"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Festival not found.",
          },
          404,
        );
      }

      throw error;
    }
  },
);

/*
 * PATCH /api/staff/festivals/:festivalId/menus/:specialMenuId
 */
staffFestivalRoutes.patch(
  "/:festivalId/menus/:specialMenuId",
  async (c) => {
    const staffUserId =
      requireStaff(c);

    if (
      typeof staffUserId !==
      "string"
    ) {
      return staffUserId;
    }

    const festivalId =
      c.req.param(
        "festivalId",
      );

    const specialMenuId =
      c.req.param(
        "specialMenuId",
      );

    const specialMenu =
      await getSpecialMenuById(
        c.env.DB,
        specialMenuId,
      );

    if (
      !specialMenu ||
      specialMenu.festival_id !==
        festivalId
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Special menu not found.",
        },
        404,
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    const input =
      body as Record<
        string,
        unknown
      >;

    if (
      typeof input.active !==
      "boolean"
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Active must be a boolean.",
        },
        400,
      );
    }

    const updated =
      await updateSpecialMenuStatus(
        c.env.DB,
        specialMenuId,
        input.active,
      );

    return c.json({
      ok: true,
      specialMenu: updated,
    });
  },
);

/*
 * POST /api/staff/festivals/:festivalId/menus/:specialMenuId/items
 */
staffFestivalRoutes.post(
  "/:festivalId/menus/:specialMenuId/items",
  async (c) => {
    const staffUserId =
      requireStaff(c);

    if (
      typeof staffUserId !==
      "string"
    ) {
      return staffUserId;
    }

    const festivalId =
      c.req.param(
        "festivalId",
      );

    const specialMenuId =
      c.req.param(
        "specialMenuId",
      );

    const specialMenu =
      await getSpecialMenuById(
        c.env.DB,
        specialMenuId,
      );

    if (
      !specialMenu ||
      specialMenu.festival_id !==
        festivalId
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Special menu not found.",
        },
        404,
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    const input =
      body as Record<
        string,
        unknown
      >;

    const menuItemId =
      typeof input.menuItemId ===
      "string"
        ? input.menuItemId.trim()
        : "";

    const specialPriceMinor =
      input.specialPriceMinor;

    if (!menuItemId) {
      return c.json(
        {
          ok: false,
          message:
            "Menu item ID is required.",
        },
        400,
      );
    }

    if (
      specialPriceMinor !==
        undefined &&
      specialPriceMinor !==
        null &&
      (
        typeof specialPriceMinor !==
          "number" ||
        !Number.isInteger(
          specialPriceMinor,
        ) ||
        specialPriceMinor < 0
      )
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Special price must be a non-negative integer in minor currency units.",
        },
        400,
      );
    }

    try {
      const item =
        await addSpecialMenuItem(
          c.env.DB,
          specialMenuId,
          menuItemId,
          specialPriceMinor ??
            undefined,
        );

      return c.json(
        {
          ok: true,
          item,
        },
        201,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "MENU_ITEM_NOT_FOUND"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Menu item not found.",
          },
          404,
        );
      }

      throw error;
    }
  },
);

/*
 * PATCH /api/staff/festivals/:festivalId/menus/:specialMenuId/items/:itemId
 *
 * Updates availability and/or special price.
 */
staffFestivalRoutes.patch(
  "/:festivalId/menus/:specialMenuId/items/:itemId",
  async (c) => {
    const staffUserId =
      requireStaff(c);

    if (
      typeof staffUserId !==
      "string"
    ) {
      return staffUserId;
    }

    const festivalId =
      c.req.param(
        "festivalId",
      );

    const specialMenuId =
      c.req.param(
        "specialMenuId",
      );

    const itemId =
      c.req.param(
        "itemId",
      );

    const specialMenu =
      await getSpecialMenuById(
        c.env.DB,
        specialMenuId,
      );

    if (
      !specialMenu ||
      specialMenu.festival_id !==
        festivalId
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Special menu not found.",
        },
        404,
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          ok: false,
          message:
            "Invalid JSON request body.",
        },
        400,
      );
    }

    const input =
      body as Record<
        string,
        unknown
      >;

    let updatedItem =
      null;

    if (
      input.available !==
      undefined
    ) {
      if (
        typeof input.available !==
        "boolean"
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Available must be a boolean.",
          },
          400,
        );
      }

      updatedItem =
        await updateSpecialMenuItemAvailability(
          c.env.DB,
          itemId,
          input.available,
        );
    }

    if (
      input.specialPriceMinor !==
      undefined
    ) {
      const price =
        input.specialPriceMinor;

      if (
        price !== null &&
        (
          typeof price !==
            "number" ||
          !Number.isInteger(
            price,
          ) ||
          price < 0
        )
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Special price must be null or a non-negative integer in minor currency units.",
          },
          400,
        );
      }

      updatedItem =
        await updateSpecialMenuItemPrice(
          c.env.DB,
          itemId,
          price === null
            ? null
            : price,
        );
    }

    if (!updatedItem) {
      return c.json(
        {
          ok: false,
          message:
            "Provide available and/or specialPriceMinor.",
        },
        400,
      );
    }

    if (
      updatedItem.special_menu_id !==
      specialMenuId
    ) {
      return c.json(
        {
          ok: false,
          message:
            "Special menu item does not belong to this special menu.",
        },
        404,
      );
    }

    return c.json({
      ok: true,
      item: updatedItem,
    });
  },
);

export default staffFestivalRoutes;