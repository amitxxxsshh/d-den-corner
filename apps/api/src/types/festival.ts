import type {
  FestivalCategory,
  FestivalRow,
  SpecialMenuItemRow,
  SpecialMenuRow,
} from "./database";

export type Festival = FestivalRow;

export type SpecialMenu = SpecialMenuRow;

export type SpecialMenuItem = SpecialMenuItemRow;

export type CreateFestivalInput = {
  category: FestivalCategory;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
};

export type UpdateFestivalInput = {
  category?: FestivalCategory;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  archived?: boolean;
};

export type CreateSpecialMenuInput = {
  festivalId: string;
  name: string;
};

export type AddSpecialMenuItemInput = {
  specialMenuId: string;
  menuItemId: string;
  specialPriceMinor?: number;
};