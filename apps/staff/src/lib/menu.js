import { apiRequest } from "./api";

const STAFF_USER_ID =
  process.env.NEXT_PUBLIC_STAFF_USER_ID || "";

function staffHeaders() {
  return {
    "X-Staff-User-Id": STAFF_USER_ID,
  };
}

export async function getMenuCategories() {
  const data = await apiRequest(
    "/api/staff/menu/categories",
    {
      headers: staffHeaders(),
    }
  );

  return data?.categories || [];
}

export async function createMenuCategory(
  input
) {
  return apiRequest(
    "/api/staff/menu/categories",
    {
      method: "POST",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    }
  );
}

export async function updateMenuCategory(
  categoryId,
  input
) {
  return apiRequest(
    `/api/staff/menu/categories/${encodeURIComponent(
      categoryId
    )}`,
    {
      method: "PATCH",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    }
  );
}

export async function getMenuItems() {
  const data = await apiRequest(
    "/api/staff/menu/items",
    {
      headers: staffHeaders(),
    }
  );

  return data?.items || [];
}

export async function createMenuItem(
  input
) {
  return apiRequest(
    "/api/staff/menu/items",
    {
      method: "POST",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    }
  );
}

export async function updateMenuItem(
  itemId,
  input
) {
  return apiRequest(
    `/api/staff/menu/items/${encodeURIComponent(
      itemId
    )}`,
    {
      method: "PATCH",
      headers: staffHeaders(),
      body: JSON.stringify(input),
    }
  );
}