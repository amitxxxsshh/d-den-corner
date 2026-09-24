import type {
  MenuCategoryRow,
  MenuItemRow,
} from "./database";

export type MenuCategory = MenuCategoryRow;

export type MenuItem = MenuItemRow;

export type CreateMenuCategoryInput = {
  name: string;
  sortOrder?: number;
};

export type UpdateMenuCategoryInput = {
  name?: string;
  sortOrder?: number;
  active?: boolean;
};

export type CreateMenuItemInput = {
  categoryId: string;
  name: string;
  description?: string;
  priceMinor: number;
};

export type UpdateMenuItemInput = {
  categoryId?: string;
  name?: string;
  description?: string;
  priceMinor?: number;
  available?: boolean;
  archived?: boolean;
};