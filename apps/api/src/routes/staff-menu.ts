import { Hono } from "hono";

import type { Bindings } from "../types/env";

import {
  createMenuCategory,
  createMenuItem,
  getAllMenuCategories,
  getAllMenuItems,
  getMenuItemById,
  updateMenuCategory,
  updateMenuItem,
  updateMenuItemImage,
} from "../db/menu";
import {
  convertToWebp,
  uploadWebpToR2,
  validateImage,
} from "../utils/image";

const app = new Hono<{
  Bindings: Bindings;
}>();

function requireStaff(
  c: any,
): Response | null {
  const staffUserId =
    c.get("staffUserId");

  if (
    typeof staffUserId !==
    "string"
  ) {
    return c.json(
      {
        ok: false,
        message:
          "Staff authentication required.",
      },
      401,
    );
  }

  return null;
}

app.get(
  "/categories",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const categories =
      await getAllMenuCategories(
        c.env.DB,
      );

    return c.json({
      ok: true,
      categories,
    });
  },
);

app.post(
  "/categories",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    try {
      const body =
        await c.req.json();

      const name =
        typeof body?.name ===
        "string"
          ? body.name.trim()
          : "";

      const sortOrder =
        Number.isInteger(
          body?.sortOrder,
        )
          ? body.sortOrder
          : 0;

      if (!name) {
        return c.json(
          {
            ok: false,
            message:
              "Category name is required.",
          },
          400,
        );
      }

      if (sortOrder < 0) {
        return c.json(
          {
            ok: false,
            message:
              "Sort order cannot be negative.",
          },
          400,
        );
      }

      const category =
        await createMenuCategory(
          c.env.DB,
          {
            name,
            sortOrder,
          },
        );

      return c.json(
        {
          ok: true,
          category,
        },
        201,
      );
    } catch (error) {
      console.error(
        "Failed to create menu category:",
        error,
      );

      return c.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create menu category.",
        },
        400,
      );
    }
  },
);

app.patch(
  "/categories/:categoryId",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    try {
      const categoryId =
        c.req.param(
          "categoryId",
        );

      const body =
        await c.req.json();

      const input: {
        name?: string;
        sortOrder?: number;
        active?: boolean;
      } = {};

      if (
        typeof body?.name ===
        "string"
      ) {
        input.name =
          body.name.trim();
      }

      if (
        Number.isInteger(
          body?.sortOrder,
        )
      ) {
        input.sortOrder =
          body.sortOrder;
      }

      if (
        typeof body?.active ===
        "boolean"
      ) {
        input.active =
          body.active;
      }

      const category =
        await updateMenuCategory(
          c.env.DB,
          categoryId,
          input,
        );

      if (!category) {
        return c.json(
          {
            ok: false,
            message:
              "Menu category not found.",
          },
          404,
        );
      }

      return c.json({
        ok: true,
        category,
      });
    } catch (error) {
      console.error(
        "Failed to update menu category:",
        error,
      );

      return c.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update menu category.",
        },
        400,
      );
    }
  },
);

app.get(
  "/items",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    const items =
      await getAllMenuItems(
        c.env.DB,
      );

    return c.json({
      ok: true,
      items,
    });
  },
);

app.post(
  "/items",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    try {
      const body =
        await c.req.json();

      const categoryId =
        typeof body?.categoryId ===
        "string"
          ? body.categoryId.trim()
          : "";

      const name =
        typeof body?.name ===
        "string"
          ? body.name.trim()
          : "";

      const description =
        typeof body?.description ===
        "string"
          ? body.description.trim()
          : "";

      const priceMinor =
        Number(
          body?.priceMinor,
        );

      if (!categoryId) {
        return c.json(
          {
            ok: false,
            message:
              "Category is required.",
          },
          400,
        );
      }

      if (!name) {
        return c.json(
          {
            ok: false,
            message:
              "Menu item name is required.",
          },
          400,
        );
      }

      if (
        !Number.isInteger(
          priceMinor,
        ) ||
        priceMinor < 0
      ) {
        return c.json(
          {
            ok: false,
            message:
              "Price must be a non-negative integer in minor units.",
          },
          400,
        );
      }

      const imageUrl =
        typeof body?.imageUrl === "string"
          ? body.imageUrl.trim()
          : typeof body?.image_url === "string"
            ? body.image_url.trim()
            : null;

      const item =
        await createMenuItem(
          c.env.DB,
          {
            categoryId,
            name,
            description,
            priceMinor,
            imageUrl,
          },
        );

      return c.json(
        {
          ok: true,
          item,
        },
        201,
      );
    } catch (error) {
      console.error(
        "Failed to create menu item:",
        error,
      );

      return c.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create menu item.",
        },
        400,
      );
    }
  },
);

app.patch(
  "/items/:itemId",
  async (c) => {
    const authError =
      requireStaff(c);

    if (authError) {
      return authError;
    }

    try {
      const itemId =
        c.req.param("itemId");

      const body =
        await c.req.json();

      const input: {
        categoryId?: string;
        name?: string;
        description?: string;
        priceMinor?: number;
        available?: boolean;
        archived?: boolean;
        imageUrl?: string | null;
      } = {};

      if (
        typeof body?.categoryId ===
        "string"
      ) {
        input.categoryId =
          body.categoryId.trim();
      }

      if (
        typeof body?.name ===
        "string"
      ) {
        input.name =
          body.name.trim();
      }

      if (
        typeof body?.description ===
        "string"
      ) {
        input.description =
          body.description.trim();
      }

      if (
        body?.priceMinor !==
        undefined
      ) {
        const priceMinor =
          Number(
            body.priceMinor,
          );

        if (
          !Number.isInteger(
            priceMinor,
          ) ||
          priceMinor < 0
        ) {
          return c.json(
            {
              ok: false,
              message:
                "Price must be a non-negative integer in minor units.",
            },
            400,
          );
        }

        input.priceMinor =
          priceMinor;
      }

      if (
        typeof body?.available ===
        "boolean"
      ) {
        input.available =
          body.available;
      }

      if (
        typeof body?.archived ===
        "boolean"
      ) {
        input.archived =
          body.archived;
      }

      if (
        typeof body?.imageUrl ===
        "string" ||
        body?.imageUrl === null
      ) {
        input.imageUrl =
          body.imageUrl;
      } else if (
        typeof body?.image_url ===
        "string" ||
        body?.image_url === null
      ) {
        input.imageUrl =
          body.image_url;
      }

      const item =
        await updateMenuItem(
          c.env.DB,
          itemId,
          input,
        );

      if (!item) {
        return c.json(
          {
            ok: false,
            message:
              "Menu item not found.",
          },
          404,
        );
      }

      return c.json({
        ok: true,
        item,
      });
    } catch (error) {
      console.error(
        "Failed to update menu item:",
        error,
      );

      return c.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update menu item.",
        },
        400,
      );
    }
  },
);

/**
 * Upload and assign a photo for an existing menu item.
 * Validates staff auth, validates content and size, converts to WebP,
 * uploads to Cloudflare R2, and persists the reference in D1.
 */
app.post(
  "/items/:itemId/image",
  async (c) => {
    const authError = requireStaff(c);
    if (authError) {
      return authError;
    }

    const itemId = c.req.param("itemId");
    const existingItem = await getMenuItemById(c.env.DB, itemId);
    if (!existingItem) {
      return c.json(
        {
          ok: false,
          message: "Menu item not found.",
        },
        404,
      );
    }

    const bucket = c.env.FOOD_IMAGES_BUCKET || (c.env as any).BUCKET;
    if (!bucket) {
      return c.json(
        {
          ok: false,
          message: "R2 storage bucket is not configured.",
        },
        500,
      );
    }

    let fileBytes: Uint8Array;
    const contentType = c.req.header("content-type") || "";

    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await c.req.formData();
        const file = formData.get("file") || formData.get("image");
        if (!file || typeof file === "string") {
          return c.json(
            {
              ok: false,
              message: "No image file provided in form data.",
            },
            400,
          );
        }
        fileBytes = new Uint8Array(await file.arrayBuffer());
      } else {
        fileBytes = new Uint8Array(await c.req.arrayBuffer());
      }
    } catch (parseError) {
      return c.json(
        {
          ok: false,
          message: "Failed to parse uploaded image body.",
        },
        400,
      );
    }

    // 1. Content and size validation
    const validation = validateImage(fileBytes);
    if (!validation.valid || !validation.format) {
      return c.json(
        {
          ok: false,
          message: validation.error || "Invalid image file.",
        },
        400,
      );
    }

    // 2. Convert to WebP if necessary
    let webpBytes: Uint8Array;
    try {
      webpBytes = await convertToWebp(
        fileBytes,
        validation.format,
        c.env.IMAGES,
      );
    } catch (conversionError) {
      console.error("WebP conversion error:", conversionError);
      return c.json(
        {
          ok: false,
          message:
            conversionError instanceof Error
              ? conversionError.message
              : "Failed to convert image to WebP.",
        },
        500,
      );
    }

    // 3. Upload to R2 and verify success
    let uploadResult: { key: string; publicUrl: string };
    try {
      uploadResult = await uploadWebpToR2(bucket, itemId, webpBytes);
    } catch (uploadError) {
      console.error("R2 upload error:", uploadError);
      return c.json(
        {
          ok: false,
          message:
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload image to R2.",
        },
        500,
      );
    }

    // 4. Persist image reference in D1 database
    try {
      const updatedItem = await updateMenuItemImage(
        c.env.DB,
        itemId,
        uploadResult.publicUrl,
      );

      if (!updatedItem) {
        throw new Error("Failed to update database record with new image URL.");
      }

      return c.json({
        ok: true,
        item: updatedItem,
        imageUrl: uploadResult.publicUrl,
        key: uploadResult.key,
      });
    } catch (dbError) {
      console.error("D1 update failed, cleaning up uploaded R2 object:", dbError);
      // Clean up orphaned R2 object on DB failure
      try {
        await bucket.delete(uploadResult.key);
      } catch (cleanupErr) {
        console.warn("Failed to cleanup R2 object after DB error:", cleanupErr);
      }

      return c.json(
        {
          ok: false,
          message: "Failed to persist image reference in database.",
        },
        500,
      );
    }
  },
);

/**
 * Remove custom photo from a menu item and revert to catalog default.
 */
app.delete(
  "/items/:itemId/image",
  async (c) => {
    const authError = requireStaff(c);
    if (authError) {
      return authError;
    }

    const itemId = c.req.param("itemId");
    const existingItem = await getMenuItemById(c.env.DB, itemId);
    if (!existingItem) {
      return c.json(
        {
          ok: false,
          message: "Menu item not found.",
        },
        404,
      );
    }

    const updatedItem = await updateMenuItemImage(c.env.DB, itemId, null);
    return c.json({
      ok: true,
      item: updatedItem,
    });
  },
);

/**
 * Generic image upload endpoint for new dishes prior to item creation.
 */
app.post(
  "/upload",
  async (c) => {
    const authError = requireStaff(c);
    if (authError) {
      return authError;
    }

    const bucket = c.env.FOOD_IMAGES_BUCKET || (c.env as any).BUCKET;
    if (!bucket) {
      return c.json(
        {
          ok: false,
          message: "R2 storage bucket is not configured.",
        },
        500,
      );
    }

    let fileBytes: Uint8Array;
    const contentType = c.req.header("content-type") || "";

    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await c.req.formData();
        const file = formData.get("file") || formData.get("image");
        if (!file || typeof file === "string") {
          return c.json(
            {
              ok: false,
              message: "No image file provided in form data.",
            },
            400,
          );
        }
        fileBytes = new Uint8Array(await file.arrayBuffer());
      } else {
        fileBytes = new Uint8Array(await c.req.arrayBuffer());
      }
    } catch (parseError) {
      return c.json(
        {
          ok: false,
          message: "Failed to parse uploaded image body.",
        },
        400,
      );
    }

    const validation = validateImage(fileBytes);
    if (!validation.valid || !validation.format) {
      return c.json(
        {
          ok: false,
          message: validation.error || "Invalid image file.",
        },
        400,
      );
    }

    let webpBytes: Uint8Array;
    try {
      webpBytes = await convertToWebp(
        fileBytes,
        validation.format,
        c.env.IMAGES,
      );
    } catch (conversionError) {
      console.error("WebP conversion error:", conversionError);
      return c.json(
        {
          ok: false,
          message:
            conversionError instanceof Error
              ? conversionError.message
              : "Failed to convert image to WebP.",
        },
        500,
      );
    }

    try {
      const uploadResult = await uploadWebpToR2(bucket, "dish", webpBytes);
      return c.json({
        ok: true,
        imageUrl: uploadResult.publicUrl,
        key: uploadResult.key,
      });
    } catch (uploadError) {
      console.error("R2 upload error:", uploadError);
      return c.json(
        {
          ok: false,
          message:
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload image to R2.",
        },
        500,
      );
    }
  },
);

export default app;