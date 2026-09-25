import { apiRequest } from "./api";

export async function getMenu() {
  return apiRequest("/api/menu");
}

export async function getMenuCategories() {
  return apiRequest("/api/menu/categories");
}

export async function getMenuItem(itemId) {
  if (!itemId) {
    throw new Error("Menu item ID is required.");
  }

  return apiRequest(
    `/api/menu/items/${encodeURIComponent(itemId)}`,
  );
}

export async function searchMenuItems(query) {
  const value = query?.trim();

  if (!value) {
    return getMenu();
  }

  return apiRequest(
    `/api/menu/search?q=${encodeURIComponent(value)}`,
  );
}