"use client";

import { useEffect, useState } from "react";

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
   * Resolve the dynamic festival route
   * parameter.
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
   * Load all special menus belonging
   * to this festival.
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
          /*
           * Prefer a newly created or explicitly
           * selected menu when supplied.
           */
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

          /*
           * Keep the current selection if
           * that menu still exists.
           */
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

          /*
           * Otherwise select the first menu.
           */
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
   * Load items belonging to the
   * selected special menu.
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

  /*
   * Initial catalogue load.
   */
  useEffect(() => {
    loadCatalogue();
  }, []);

  /*
   * Load festival menus once festivalId
   * is available.
   */
  useEffect(() => {
    if (!festivalId) {
      return;
    }

    loadMenus();
  }, [festivalId]);

  /*
   * Load items whenever selected menu changes.
   */
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
   *
   * The API returns:
   *
   * {
   *   ok: true,
   *   specialMenu: {...}
   * }
   *
   * We immediately update local state from
   * that response and then refresh from D1.
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

      /*
       * Immediately update the visible UI.
       */
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
        /*
         * Fallback if the API helper returns
         * an unexpected shape.
         */
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

      /*
       * Confirm the final state from the API/D1.
       */
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
   * Add an existing menu item to the
   * selected special menu.
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

      /*
       * Reload the selected menu's items
       * from the API.
       */
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
        "Enter special price in minor units. Leave empty to use regular price.",
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

  /*
   * Do not show menu items that are already
   * part of the selected special menu.
   */
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
    <main className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              D Den Corner
            </p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              Special Menus
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              Create and manage
              festival-specific menus
              and their items.
            </p>
          </div>

          <a
            href="/festivals"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Back to Festivals
          </a>
        </header>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Create Special Menu */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Create Special Menu
          </h2>

          <form
            onSubmit={
              handleCreateMenu
            }
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={menuForm.name}
              onChange={(event) =>
                setMenuForm({
                  name:
                    event.target
                      .value,
                })
              }
              placeholder="e.g. Puja Special"
              className="flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
            />

            <button
              type="submit"
              disabled={
                savingMenu ||
                !festivalId
              }
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingMenu
                ? "Creating..."
                : "Create Menu"}
            </button>
          </form>
        </section>

        {/* Special Menus */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Special Menus
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
              Loading menus...
            </div>
          ) : menus.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              No special menus
              created yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {menus.map(
                (menu) => {
                  const isSelected =
                    selectedMenuId ===
                    menu.id;

                  const isUpdating =
                    updatingMenuId ===
                    menu.id;

                  return (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() =>
                        setSelectedMenuId(
                          menu.id,
                        )
                      }
                      className={`rounded-2xl border p-5 text-left ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold">
                          {menu.name}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            menu.active
                              ? isSelected
                                ? "bg-white/15 text-white"
                                : "bg-emerald-100 text-emerald-700"
                              : isSelected
                                ? "bg-white/15 text-white"
                                : "bg-zinc-100 text-zinc-600"
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
                        className={`mt-2 text-xs ${
                          isSelected
                            ? "text-zinc-300"
                            : "text-zinc-500"
                        }`}
                      >
                        {menu.id}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* Selected Menu */}
        {selectedMenu && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  {selectedMenu.name}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {selectedMenu.active
                    ? "This menu is active."
                    : "This menu is inactive."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  toggleMenu(
                    selectedMenu,
                  )
                }
                disabled={
                  updatingMenuId ===
                  selectedMenu.id
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingMenuId ===
                selectedMenu.id
                  ? "Updating..."
                  : selectedMenu.active
                    ? "Deactivate Menu"
                    : "Activate Menu"}
              </button>
            </div>

            {/* Add Item */}
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <h3 className="font-semibold text-zinc-900">
                Add Menu Item
              </h3>

              {catalogueLoading ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Loading menu
                  catalogue...
                </p>
              ) : selectableMenuItems.length ===
                0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                  All currently
                  available menu
                  items are already
                  in this special
                  menu.
                </div>
              ) : (
                <form
                  onSubmit={
                    handleAddItem
                  }
                  className="mt-4 grid gap-4 md:grid-cols-3"
                >
                  <select
                    value={
                      itemForm.menuItemId
                    }
                    onChange={(
                      event,
                    ) =>
                      setItemForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          menuItemId:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                  >
                    <option value="">
                      Select menu item
                    </option>

                    {selectableMenuItems.map(
                      (
                        menuItem,
                      ) => (
                        <option
                          key={
                            menuItem.id
                          }
                          value={
                            menuItem.id
                          }
                        >
                          {
                            menuItem.name
                          }{" "}
                          —{" "}
                          {formatMoney(
                            menuItem.price_minor,
                          )}
                        </option>
                      ),
                    )}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      itemForm.specialPriceMinor
                    }
                    onChange={(
                      event,
                    ) =>
                      setItemForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          specialPriceMinor:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="Special price (minor units)"
                    className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                  />

                  <button
                    type="submit"
                    disabled={
                      savingItem ||
                      !itemForm.menuItemId
                    }
                    className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingItem
                      ? "Adding..."
                      : "Add Item"}
                  </button>
                </form>
              )}

              <p className="mt-2 text-xs text-zinc-500">
                Leave the special
                price empty to use
                the regular menu
                price.
              </p>
            </div>

            {/* Items */}
            <div className="mt-8">
              <h3 className="font-semibold text-zinc-900">
                Items
              </h3>

              {itemsLoading ? (
                <div className="mt-4 rounded-xl bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                  Loading items...
                </div>
              ) : items.length ===
                0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
                  No items have
                  been added to
                  this special
                  menu.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
                  <div className="divide-y divide-zinc-100">
                    {items.map(
                      (item) => {
                        const menuItem =
                          menuItems.find(
                            (
                              candidate,
                            ) =>
                              candidate.id ===
                              item.menu_item_id,
                          );

                        const isUpdating =
                          updatingItemId ===
                          item.id;

                        return (
                          <div
                            key={
                              item.id
                            }
                            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-zinc-900">
                                {menuItem?.name ||
                                  item.menu_item_id}
                              </p>

                              {menuItem && (
                                <p className="mt-1 text-sm text-zinc-500">
                                  Regular
                                  price:{" "}
                                  {formatMoney(
                                    menuItem.price_minor,
                                  )}
                                </p>
                              )}

                              <p className="mt-1 text-sm text-zinc-500">
                                Special
                                price:{" "}
                                {formatMoney(
                                  item.special_price_minor,
                                )}
                              </p>

                              <span
                                className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                  item.available
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {item.available
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  editPrice(
                                    item,
                                  )
                                }
                                disabled={
                                  isUpdating
                                }
                                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit Price
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleItem(
                                    item,
                                  )
                                }
                                disabled={
                                  isUpdating
                                }
                                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}