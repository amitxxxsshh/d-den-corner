"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  addSpecialMenuItem,
  createSpecialMenu,
  getAvailableMenuItems,
  getSpecialMenuItems,
  getSpecialMenus,
  updateSpecialMenuItemAvailability,
  updateSpecialMenuItemPrice,
  updateSpecialMenuStatus,
} from "../../../lib/festivals";

import StaffNavbar from "../../../components/StaffNavbar";

const EMPTY_MENU_FORM = {
  name: "",
};

const EMPTY_ITEM_FORM = {
  menuItemId: "",
  specialPriceMinor: "",
};

function formatMoney(minor) {
  if (
    minor === null ||
    minor === undefined
  ) {
    return "Regular price";
  }

  return `₹${(
    Number(minor) / 100
  ).toFixed(2)}`;
}

export default function FestivalMenusPage({
  params,
}) {
  const [festivalId, setFestivalId] =
    useState(null);

  const [menus, setMenus] =
    useState([]);

  const [menuItems, setMenuItems] =
    useState([]);

  const [selectedMenuId, setSelectedMenuId] =
    useState(null);

  const [items, setItems] =
    useState([]);

  const [menuForm, setMenuForm] =
    useState(EMPTY_MENU_FORM);

  const [itemForm, setItemForm] =
    useState(EMPTY_ITEM_FORM);

  const [loading, setLoading] =
    useState(true);

  const [
    catalogueLoading,
    setCatalogueLoading,
  ] = useState(true);

  const [
    itemsLoading,
    setItemsLoading,
  ] = useState(false);

  const [savingMenu, setSavingMenu] =
    useState(false);

  const [savingItem, setSavingItem] =
    useState(false);

  const [
    updatingMenuId,
    setUpdatingMenuId,
  ] = useState(null);

  const [
    updatingItemId,
    setUpdatingItemId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * Resolve dynamic festival route parameter.
   */
  useEffect(() => {
    let cancelled = false;

    async function resolveParams() {
      const resolvedParams =
        await params;

      if (!cancelled) {
        setFestivalId(
          resolvedParams.festivalId,
        );
      }
    }

    resolveParams();

    return () => {
      cancelled = true;
    };
  }, [params]);

  /*
   * Load existing menu catalogue.
   */
  async function loadCatalogue() {
    try {
      setCatalogueLoading(true);

      const result =
        await getAvailableMenuItems();

      setMenuItems(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load menu catalogue.",
      );
    } finally {
      setCatalogueLoading(false);
    }
  }

  /*
   * Load all special menus belonging to this festival.
   */
  async function loadMenus(
    preferredMenuId = null,
  ) {
    if (!festivalId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await getSpecialMenus(
          festivalId,
        );

      const nextMenus =
        Array.isArray(result)
          ? result
          : [];

      setMenus(nextMenus);

      if (nextMenus.length === 0) {
        setSelectedMenuId(null);
        setItems([]);
        return;
      }

      setSelectedMenuId(
        (currentMenuId) => {
          if (
            preferredMenuId &&
            nextMenus.some(
              (menu) =>
                menu.id ===
                preferredMenuId,
            )
          ) {
            return preferredMenuId;
          }

          const currentStillExists =
            currentMenuId &&
            nextMenus.some(
              (menu) =>
                menu.id ===
                currentMenuId,
            );

          if (currentStillExists) {
            return currentMenuId;
          }

          return nextMenus[0].id;
        },
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load special menus.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Load items belonging to the selected special menu.
   */
  async function loadItems(menuId) {
    if (
      !festivalId ||
      !menuId
    ) {
      setItems([]);
      return;
    }

    try {
      setItemsLoading(true);
      setError("");

      const result =
        await getSpecialMenuItems(
          festivalId,
          menuId,
        );

      setItems(
        Array.isArray(result)
          ? result
          : [],
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load special-menu items.",
      );
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    loadCatalogue();
  }, []);

  useEffect(() => {
    if (!festivalId) {
      return;
    }

    loadMenus();
  }, [festivalId]);

  useEffect(() => {
    if (!festivalId) {
      return;
    }

    loadItems(
      selectedMenuId,
    );
  }, [
    festivalId,
    selectedMenuId,
  ]);

  /*
   * Create a special menu.
   */
  async function handleCreateMenu(
    event,
  ) {
    event.preventDefault();

    const name =
      menuForm.name.trim();

    if (!name) {
      setError(
        "Special menu name is required.",
      );
      return;
    }

    if (!festivalId) {
      setError(
        "Festival ID is not available.",
      );
      return;
    }

    try {
      setSavingMenu(true);
      setError("");
      setSuccess("");

      const result =
        await createSpecialMenu(
          festivalId,
          {
            name,
          },
        );

      setMenuForm(
        EMPTY_MENU_FORM,
      );

      const createdMenu =
        result?.specialMenu ||
        result;

      const createdMenuId =
        createdMenu?.id ||
        null;

      setSuccess(
        "Special menu created successfully.",
      );

      await loadMenus(
        createdMenuId,
      );

      if (createdMenuId) {
        setSelectedMenuId(
          createdMenuId,
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create special menu.",
      );
    } finally {
      setSavingMenu(false);
    }
  }

  /*
   * Activate / deactivate a special menu.
   */
  async function toggleMenu(menu) {
    if (
      !festivalId ||
      !menu?.id
    ) {
      return;
    }

    const nextActive =
      !Boolean(menu.active);

    try {
      setUpdatingMenuId(
        menu.id,
      );

      setError("");
      setSuccess("");

      const result =
        await updateSpecialMenuStatus(
          festivalId,
          menu.id,
          nextActive,
        );

      const updatedMenu =
        result?.specialMenu ||
        result;

      if (
        updatedMenu?.id
      ) {
        setMenus(
          (currentMenus) =>
            currentMenus.map(
              (currentMenu) =>
                currentMenu.id ===
                updatedMenu.id
                  ? {
                      ...currentMenu,
                      ...updatedMenu,
                    }
                  : currentMenu,
            ),
        );
      } else {
        setMenus(
          (currentMenus) =>
            currentMenus.map(
              (currentMenu) =>
                currentMenu.id ===
                menu.id
                  ? {
                      ...currentMenu,
                      active:
                        nextActive
                          ? 1
                          : 0,
                    }
                  : currentMenu,
            ),
        );
      }

      setSuccess(
        nextActive
          ? "Special menu activated."
          : "Special menu deactivated.",
      );

      await loadMenus(
        menu.id,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update special menu.",
      );
    } finally {
      setUpdatingMenuId(null);
    }
  }

  /*
   * Add an existing menu item to the selected special menu.
   */
  async function handleAddItem(
    event,
  ) {
    event.preventDefault();

    if (!festivalId) {
      setError(
        "Festival ID is not available.",
      );
      return;
    }

    if (!selectedMenuId) {
      setError(
        "Select a special menu first.",
      );
      return;
    }

    if (
      !itemForm.menuItemId
    ) {
      setError(
        "Select a menu item.",
      );
      return;
    }

    let specialPriceMinor;

    if (
      itemForm.specialPriceMinor !==
      ""
    ) {
      const price =
        Number(
          itemForm.specialPriceMinor,
        );

      if (
        !Number.isInteger(
          price,
        ) ||
        price < 0
      ) {
        setError(
          "Special price must be a valid non-negative integer.",
        );
        return;
      }

      specialPriceMinor =
        price;
    }

    try {
      setSavingItem(true);
      setError("");
      setSuccess("");

      await addSpecialMenuItem(
        festivalId,
        selectedMenuId,
        {
          menuItemId:
            itemForm.menuItemId,

          ...(specialPriceMinor !==
          undefined
            ? {
                specialPriceMinor,
              }
            : {}),
        },
      );

      setItemForm(
        EMPTY_ITEM_FORM,
      );

      setSuccess(
        "Item added to special menu.",
      );

      await loadItems(
        selectedMenuId,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to add item.",
      );
    } finally {
      setSavingItem(false);
    }
  }

  /*
   * Toggle availability of an item.
   */
  async function toggleItem(
    item,
  ) {
    if (
      !festivalId ||
      !selectedMenuId ||
      !item?.id
    ) {
      return;
    }

    const nextAvailable =
      !Boolean(item.available);

    try {
      setUpdatingItemId(
        item.id,
      );

      setError("");
      setSuccess("");

      await updateSpecialMenuItemAvailability(
        festivalId,
        selectedMenuId,
        item.id,
        nextAvailable,
      );

      setSuccess(
        nextAvailable
          ? "Item made available."
          : "Item hidden from special menu.",
      );

      await loadItems(
        selectedMenuId,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update item availability.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  /*
   * Edit the special price of an item.
   */
  async function editPrice(
    item,
  ) {
    if (
      !festivalId ||
      !selectedMenuId ||
      !item?.id
    ) {
      return;
    }

    const currentValue =
      item.special_price_minor ===
        null ||
      item.special_price_minor ===
        undefined
        ? ""
        : String(
            item.special_price_minor,
          );

    const value =
      window.prompt(
        "Enter special price in minor units (e.g. 18000 for ₹180). Leave empty to use regular price.",
        currentValue,
      );

    if (value === null) {
      return;
    }

    let price = null;

    if (
      value.trim() !==
      ""
    ) {
      const parsed =
        Number(
          value.trim(),
        );

      if (
        !Number.isInteger(
          parsed,
        ) ||
        parsed < 0
      ) {
        setError(
          "Price must be a non-negative integer in minor units.",
        );
        return;
      }

      price = parsed;
    }

    try {
      setUpdatingItemId(
        item.id,
      );

      setError("");
      setSuccess("");

      await updateSpecialMenuItemPrice(
        festivalId,
        selectedMenuId,
        item.id,
        price,
      );

      setSuccess(
        "Special price updated.",
      );

      await loadItems(
        selectedMenuId,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update special price.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  const selectedMenu =
    menus.find(
      (menu) =>
        menu.id ===
        selectedMenuId,
    ) || null;

  const selectedMenuItemIds =
    new Set(
      items.map(
        (item) =>
          item.menu_item_id,
      ),
    );

  const selectableMenuItems =
    menuItems.filter(
      (menuItem) =>
        !selectedMenuItemIds.has(
          menuItem.id,
        ),
    );

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-16">
      {/* Exactly ONE Unified Responsive Staff Navbar */}
      <StaffNavbar
        onRefresh={() => loadMenus(selectedMenuId)}
        refreshLoading={loading}
      />

      {/* Title Bar with Back to Festivals */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/festivals"
                className="text-xs font-bold text-amber-gold hover:text-amber-warm transition"
              >
                ← Back to Festivals
              </Link>
            </div>

            <h1 className="mt-1 text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
              Festival Special Menus
            </h1>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Create and manage festival-specific menus, custom special pricing, and item availability.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-forest/30 bg-forest/10 px-5 py-3.5 text-xs text-forest font-semibold">
            {success}
          </div>
        )}

        {/* Create Special Menu Form */}
        <section className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-3.5">
            <h2 className="text-base font-bold font-serif text-charcoal-deep">
              Create Special Menu Section
            </h2>
            <p className="mt-0.5 text-xs text-charcoal-deep/60">
              e.g. Festival Starters, Festive Thali, Sweet Offerings
            </p>
          </div>

          <form
            onSubmit={handleCreateMenu}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={menuForm.name}
              onChange={(event) =>
                setMenuForm({
                  name: event.target.value,
                })
              }
              placeholder="e.g. Durga Puja Special Thali"
              className="flex-1 rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
            />

            <button
              type="submit"
              disabled={savingMenu || !festivalId}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-charcoal-deep px-5 py-2.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingMenu ? "Creating..." : "Create Menu"}
            </button>
          </form>
        </section>

        {/* Special Menus Tabs */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold font-serif text-charcoal-deep">
              Special Menus ({menus.length})
            </h2>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-stone/40 bg-white p-8 text-center text-xs text-charcoal-deep/60">
              Loading special menus...
            </div>
          ) : menus.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone/50 bg-white p-8 text-center text-xs text-charcoal-deep/60">
              No special menus created yet. Add one above.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {menus.map((menu) => {
                const isSelected = selectedMenuId === menu.id;
                const isUpdating = updatingMenuId === menu.id;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setSelectedMenuId(menu.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-charcoal-deep bg-charcoal-deep text-cream-soft shadow-md"
                        : "border-stone/50 bg-white text-charcoal-deep hover:border-amber-warm/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm font-serif">
                        {menu.name}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          menu.active
                            ? isSelected
                              ? "bg-forest text-cream-soft"
                              : "bg-forest/15 text-forest border border-forest/30"
                            : isSelected
                              ? "bg-white/20 text-cream-soft"
                              : "bg-stone/30 text-charcoal-deep/50 border border-stone/40"
                        }`}
                      >
                        {isUpdating
                          ? "Updating..."
                          : menu.active
                            ? "Active"
                            : "Inactive"}
                      </span>
                    </div>

                    <p
                      className={`mt-2 font-mono text-[10px] ${
                        isSelected ? "text-stone" : "text-charcoal-deep/40"
                      }`}
                    >
                      {menu.id}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected Menu Details & Item Management */}
        {selectedMenu && (
          <section className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-stone/30 pb-4">
              <div>
                <h3 className="text-lg font-bold font-serif text-charcoal-deep">
                  {selectedMenu.name}
                </h3>

                <p className="mt-0.5 text-xs text-charcoal-deep/60">
                  {selectedMenu.active
                    ? "Currently visible to customers during this festival."
                    : "Hidden from customer view."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleMenu(selectedMenu)}
                disabled={updatingMenuId === selectedMenu.id}
                className="rounded-xl border border-stone/50 bg-white px-3.5 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition disabled:opacity-50"
              >
                {updatingMenuId === selectedMenu.id
                  ? "Updating..."
                  : selectedMenu.active
                    ? "Deactivate Menu"
                    : "Activate Menu"}
              </button>
            </div>

            {/* Add Item to Special Menu */}
            <div className="mt-5 border-b border-stone/30 pb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                Add Catalogue Dish to this Menu
              </h4>

              {catalogueLoading ? (
                <p className="mt-2 text-xs text-charcoal-deep/50">
                  Loading catalogue...
                </p>
              ) : selectableMenuItems.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-stone/40 bg-cream-warm/20 p-4 text-xs text-charcoal-deep/60">
                  All available catalogue dishes have already been added to this special menu.
                </div>
              ) : (
                <form
                  onSubmit={handleAddItem}
                  className="mt-3 grid gap-3 sm:grid-cols-3"
                >
                  <select
                    value={itemForm.menuItemId}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        menuItemId: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-stone/60 bg-cream-soft/30 px-3 py-2 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                  >
                    <option value="">Select dish from catalogue</option>
                    {selectableMenuItems.map((menuItem) => (
                      <option key={menuItem.id} value={menuItem.id}>
                        {menuItem.name} — {formatMoney(menuItem.price_minor)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={itemForm.specialPriceMinor}
                    onChange={(event) =>
                      setItemForm((current) => ({
                        ...current,
                        specialPriceMinor: event.target.value,
                      }))
                    }
                    placeholder="Special price (minor units, e.g. 15000)"
                    className="rounded-xl border border-stone/60 bg-cream-soft/30 px-3 py-2 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                  />

                  <button
                    type="submit"
                    disabled={savingItem || !itemForm.menuItemId}
                    className="inline-flex min-h-[38px] items-center justify-center rounded-xl bg-amber-warm px-4 py-2 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-sm disabled:cursor-not-allowed disabled:bg-stone/40"
                  >
                    {savingItem ? "Adding..." : "Add to Special Menu"}
                  </button>
                </form>
              )}

              <p className="mt-2 text-[10px] text-charcoal-deep/50">
                Leave special price empty to use the regular menu price.
              </p>
            </div>

            {/* Items in Selected Special Menu */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-deep/70 mb-3">
                Items in this Menu ({items.length})
              </h4>

              {itemsLoading ? (
                <div className="rounded-2xl border border-stone/30 bg-cream-warm/20 p-6 text-center text-xs text-charcoal-deep/60">
                  Loading items...
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone/40 p-6 text-center text-xs text-charcoal-deep/50">
                  No items have been added to this special menu yet.
                </div>
              ) : (
                <div className="divide-y divide-stone/20 rounded-2xl border border-stone/40 bg-white overflow-hidden">
                  {items.map((item) => {
                    const menuItem = menuItems.find(
                      (candidate) => candidate.id === item.menu_item_id,
                    );

                    const isUpdating = updatingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-cream-warm/15 transition"
                      >
                        <div>
                          <p className="font-bold text-sm font-serif text-charcoal-deep">
                            {menuItem?.name || item.menu_item_id}
                          </p>

                          <div className="mt-1 flex items-center gap-3 text-xs text-charcoal-deep/70">
                            {menuItem && (
                              <span>
                                Regular: {formatMoney(menuItem.price_minor)}
                              </span>
                            )}
                            <span className="font-bold text-charcoal-deep">
                              Special: {formatMoney(item.special_price_minor)}
                            </span>
                          </div>

                          <span
                            className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              item.available
                                ? "bg-forest/15 text-forest border-forest/30"
                                : "bg-stone/30 text-charcoal-deep/50 border-stone/40"
                            }`}
                          >
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {item.available ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => editPrice(item)}
                            disabled={isUpdating}
                            className="rounded-xl border border-amber-warm/40 bg-amber-warm/10 px-3 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-amber-warm/20 transition disabled:opacity-50"
                          >
                            Edit Price
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            disabled={isUpdating}
                            className="rounded-xl border border-stone/50 bg-white px-3 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition disabled:opacity-50"
                          >
                            {isUpdating
                              ? "Updating..."
                              : item.available
                                ? "Hide"
                                : "Make Available"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}