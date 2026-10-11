import { apiRequest } from "./api";

export async function getMenuCategories() {
  const data =
    await apiRequest(
      "/api/staff/menu/categories",
    );

  return data?.categories || [];
}

export async function createMenuCategory(
  input,
) {
  return apiRequest(
    "/api/staff/menu/categories",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateMenuCategory(
  categoryId,
  input,
) {
  return apiRequest(
    `/api/staff/menu/categories/${encodeURIComponent(
      categoryId,
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function getMenuItems() {
  const data =
    await apiRequest(
      "/api/staff/menu/items",
    );

  return data?.items || [];
}

export async function createMenuItem(
  input,
) {
  return apiRequest(
    "/api/staff/menu/items",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateMenuItem(
  itemId,
  input,
) {
  return apiRequest(
    `/api/staff/menu/items/${encodeURIComponent(
      itemId,
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function uploadMenuItemImage(itemId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest(
    `/api/staff/menu/items/${encodeURIComponent(itemId)}/image`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function removeMenuItemImage(itemId) {
  return apiRequest(
    `/api/staff/menu/items/${encodeURIComponent(itemId)}/image`,
    {
      method: "DELETE",
    },
  );
}

export async function uploadGenericImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest(
    `/api/staff/menu/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
}