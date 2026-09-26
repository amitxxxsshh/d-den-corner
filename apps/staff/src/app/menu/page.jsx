"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createMenuCategory,
  createMenuItem,
  getMenuCategories,
  getMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from "../../lib/menu";

export default function MenuManagementPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const [categoryName, setCategoryName] =
    useState("");

  const [categorySortOrder, setCategorySortOrder] =
    useState("0");

  const [itemCategoryId, setItemCategoryId] =
    useState("");

  const [itemName, setItemName] =
    useState("");

  const [itemDescription, setItemDescription] =
    useState("");

  const [itemPrice, setItemPrice] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        loadedCategories,
        loadedItems,
      ] = await Promise.all([
        getMenuCategories(),
        getMenuItems(),
      ]);

      setCategories(loadedCategories);
      setItems(loadedItems);

      if (
        !itemCategoryId &&
        loadedCategories.length > 0
      ) {
        setItemCategoryId(
          loadedCategories[0].id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load menu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      categories.map((category) => [
        category.id,
        category,
      ])
    );
  }, [categories]);

  async function handleCreateCategory(
    event
  ) {
    event.preventDefault();

    if (!categoryName.trim()) {
      setError(
        "Category name is required."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data =
        await createMenuCategory({
          name: categoryName.trim(),
          sortOrder:
            Number(categorySortOrder) || 0,
        });

      const category = data?.category;

      setCategoryName("");
      setCategorySortOrder("0");

      await loadData();

      if (category?.id) {
        setItemCategoryId(category.id);
      }

      setSuccess(
        "Menu category created successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateItem(
    event
  ) {
    event.preventDefault();

    if (!itemCategoryId) {
      setError(
        "Create or select a category first."
      );
      return;
    }

    if (!itemName.trim()) {
      setError(
        "Menu item name is required."
      );
      return;
    }

    const priceMinor =
      Math.round(
        Number(itemPrice) * 100
      );

    if (
      !Number.isFinite(priceMinor) ||
      priceMinor < 0
    ) {
      setError(
        "Enter a valid price."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createMenuItem({
        categoryId: itemCategoryId,
        name: itemName.trim(),
        description:
          itemDescription.trim(),
        priceMinor,
      });

      setItemName("");
      setItemDescription("");
      setItemPrice("");

      await loadData();

      setSuccess(
        "Menu item created successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create menu item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item) {
    setError("");
    setSuccess("");

    try {
      await updateMenuItem(
        item.id,
        {
          available:
            item.available !== 1,
        }
      );

      await loadData();

      setSuccess(
        `${item.name} availability updated.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update item."
      );
    }
  }

  async function archiveItem(item) {
    const confirmed =
      window.confirm(
        `Archive "${item.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await updateMenuItem(
        item.id,
        {
          archived: true,
          available: false,
        }
      );

      await loadData();

      setSuccess(
        `${item.name} archived.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to archive item."
      );
    }
  }

  async function editItemPrice(item) {
    const currentRupees =
      Number(item.price_minor || 0) /
      100;

    const value =
      window.prompt(
        `Enter new price for ${item.name} in ₹`,
        currentRupees.toFixed(2)
      );

    if (value === null) {
      return;
    }

    const priceMinor =
      Math.round(
        Number(value) * 100
      );

    if (
      !Number.isFinite(priceMinor) ||
      priceMinor < 0
    ) {
      setError(
        "Enter a valid price."
      );
      return;
    }

    try {
      await updateMenuItem(
        item.id,
        {
          priceMinor,
        }
      );

      await loadData();

      setSuccess(
        `${item.name} price updated.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update price."
      );
    }
  }

  async function toggleCategory(category) {
    setError("");
    setSuccess("");

    try {
      await updateMenuCategory(
        category.id,
        {
          active:
            category.active !== 1,
        }
      );

      await loadData();

      setSuccess(
        `${category.name} status updated.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-zinc-600">
            Loading menu management...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-zinc-900">
            Menu Management
          </h1>

          <p className="mt-1 text-sm text-zinc-600">
            Create the normal menu catalogue used
            by customers and festival menus.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleCreateCategory}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              Create Category
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Category name
                </label>

                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  placeholder="Main Course"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Sort order
                </label>

                <input
                  type="number"
                  min="0"
                  value={categorySortOrder}
                  onChange={(event) =>
                    setCategorySortOrder(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Create Category
              </button>
            </div>
          </form>

          <form
            onSubmit={handleCreateItem}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              Create Menu Item
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Category
                </label>

                <select
                  value={itemCategoryId}
                  onChange={(event) =>
                    setItemCategoryId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories
                    .filter(
                      (category) =>
                        category.active === 1
                    )
                    .map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Item name
                </label>

                <input
                  value={itemName}
                  onChange={(event) =>
                    setItemName(
                      event.target.value
                    )
                  }
                  placeholder="Chicken Biryani"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Description
                </label>

                <textarea
                  value={itemDescription}
                  onChange={(event) =>
                    setItemDescription(
                      event.target.value
                    )
                  }
                  placeholder="Optional description"
                  rows={3}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(event) =>
                    setItemPrice(
                      event.target.value
                    )
                  }
                  placeholder="180"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  categories.filter(
                    (category) =>
                      category.active === 1
                  ).length === 0
                }
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Create Menu Item
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Categories
              </h2>

              <p className="text-sm text-zinc-500">
                {categories.length} categories
              </p>
            </div>
          </div>

          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No categories yet. Create your first
              category above.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border border-zinc-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Sort: {category.sort_order}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        category.active === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {category.active === 1
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleCategory(
                        category
                      )
                    }
                    className="mt-4 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                  >
                    {category.active === 1
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Menu Items
            </h2>

            <p className="text-sm text-zinc-500">
              {items.length} active catalogue items
            </p>
          </div>

          {items.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No menu items yet. Create a category and
              then add menu items above.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-3">
                      Item
                    </th>
                    <th className="px-3 py-3">
                      Category
                    </th>
                    <th className="px-3 py-3">
                      Price
                    </th>
                    <th className="px-3 py-3">
                      Status
                    </th>
                    <th className="px-3 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-100"
                    >
                      <td className="px-3 py-4">
                        <div className="font-semibold text-zinc-900">
                          {item.name}
                        </div>

                        {item.description && (
                          <div className="mt-1 text-xs text-zinc-500">
                            {item.description}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-sm text-zinc-600">
                        {categoryMap[
                          item.category_id
                        ]?.name ||
                          "Unknown"}
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-zinc-900">
                        ₹
                        {(
                          Number(
                            item.price_minor
                          ) / 100
                        ).toFixed(2)}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            item.available === 1
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.available === 1
                            ? "Available"
                            : "Unavailable"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleItem(item)
                            }
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                          >
                            {item.available ===
                            1
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editItemPrice(
                                item
                              )
                            }
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                          >
                            Edit Price
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              archiveItem(
                                item
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}