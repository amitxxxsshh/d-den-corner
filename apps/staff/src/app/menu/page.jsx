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

import StaffNavbar from "../../components/StaffNavbar";

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

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-16">
      {/* Exactly ONE Unified Responsive Staff Navbar */}
      <StaffNavbar
        onRefresh={loadData}
        refreshLoading={loading}
      />

      {/* Menu Catalogue Title Bar */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Menu Catalogue Management
              </h1>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2">
                {items.length} Dishes
              </span>
            </div>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Manage core restaurant dishes, pricing in ₹, categories, and real-time kitchen availability.
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

        {/* Creation Forms Grid */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Create Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-serif text-charcoal-deep">
                Add Menu Category
              </h2>
              <p className="mt-0.5 text-xs text-charcoal-deep/60">
                Organize dishes into sections (e.g. Starters, Main Course, Drinks)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                  Category Name
                </label>

                <input
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="e.g. Traditional Odisha Specials"
                  className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-sm text-charcoal-deep outline-none transition focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                  Sort Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={categorySortOrder}
                  onChange={(event) => setCategorySortOrder(event.target.value)}
                  className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-sm text-charcoal-deep outline-none transition focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-charcoal-deep px-5 py-2.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Category"}
              </button>
            </div>
          </form>

          {/* Create Menu Item Form */}
          <form
            onSubmit={handleCreateItem}
            className="rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-serif text-charcoal-deep">
                Add Menu Item
              </h2>
              <p className="mt-0.5 text-xs text-charcoal-deep/60">
                Create dishes with pricing in ₹ and optional description
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                    Category
                  </label>

                  <select
                    value={itemCategoryId}
                    onChange={(event) => setItemCategoryId(event.target.value)}
                    className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter((category) => category.active === 1)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                    Price (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(event) => setItemPrice(event.target.value)}
                    placeholder="180"
                    className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                  Item Name
                </label>

                <input
                  value={itemName}
                  onChange={(event) => setItemName(event.target.value)}
                  placeholder="e.g. Pakhala Bhata Thali"
                  className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                  Description
                </label>

                <textarea
                  value={itemDescription}
                  onChange={(event) => setItemDescription(event.target.value)}
                  placeholder="Ingredients, preparation style, allergens, dietary notes..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  categories.filter((c) => c.active === 1).length === 0
                }
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-amber-warm px-5 py-2.5 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-sm disabled:cursor-not-allowed disabled:bg-stone/40"
              >
                {saving ? "Saving..." : "Create Menu Item"}
              </button>
            </div>
          </form>
        </section>

        {/* Categories Section */}
        <section className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone/30">
            <div>
              <h2 className="text-base font-bold font-serif text-charcoal-deep">
                Active Categories
              </h2>
              <p className="mt-0.5 text-xs text-charcoal-deep/60">
                {categories.length} sections defined
              </p>
            </div>
          </div>

          {categories.length === 0 ? (
            <p className="text-xs text-charcoal-deep/50 py-4">
              No categories configured yet. Create a category above to start.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col justify-between rounded-2xl border border-stone/40 bg-cream-warm/20 p-4 transition hover:border-stone"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-charcoal-deep font-serif">
                        {category.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-charcoal-deep/50">
                        Sort Priority: {category.sort_order}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        category.active === 1
                          ? "bg-forest/15 text-forest border-forest/30"
                          : "bg-stone/30 text-charcoal-deep/50 border-stone/40"
                      }`}
                    >
                      {category.active === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="mt-3 inline-flex w-fit rounded-lg border border-stone/50 bg-white px-2.5 py-1 text-[11px] font-bold text-charcoal-deep hover:bg-stone/20 transition"
                  >
                    {category.active === 1 ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Menu Items Catalogue Table */}
        <section className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone/30">
            <div>
              <h2 className="text-base font-bold font-serif text-charcoal-deep">
                Catalogue Dishes
              </h2>
              <p className="mt-0.5 text-xs text-charcoal-deep/60">
                {items.length} dishes in catalogue
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-charcoal-deep/50 py-4">
              No menu items created yet. Add dishes above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-stone/30 text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50">
                    <th className="px-3 py-3">Dish</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Price</th>
                    <th className="px-3 py-3">Availability</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone/20">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-cream-warm/20 transition-colors"
                    >
                      <td className="px-3 py-3.5">
                        <p className="font-bold text-sm text-charcoal-deep font-serif">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-charcoal-deep/60 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3.5 font-medium text-charcoal-deep/80">
                        {categoryMap[item.category_id]?.name || "Unknown"}
                      </td>

                      <td className="px-3 py-3.5 font-extrabold text-sm text-charcoal-deep">
                        ₹{(Number(item.price_minor || 0) / 100).toFixed(2)}
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            item.available === 1
                              ? "bg-forest/15 text-forest border-forest/30"
                              : "bg-terracotta/15 text-terracotta border-terracotta/30"
                          }`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {item.available === 1 ? "Available" : "Unavailable"}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            className="rounded-lg border border-stone/50 bg-white px-2.5 py-1 text-[11px] font-bold text-charcoal-deep hover:bg-stone/20 transition"
                          >
                            {item.available === 1 ? "Disable" : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() => editItemPrice(item)}
                            className="rounded-lg border border-amber-warm/40 bg-amber-warm/10 px-2.5 py-1 text-[11px] font-bold text-charcoal-deep hover:bg-amber-warm/20 transition"
                          >
                            Edit Price
                          </button>

                          <button
                            type="button"
                            onClick={() => archiveItem(item)}
                            className="rounded-lg border border-terracotta/30 bg-white px-2 py-1 text-[11px] font-bold text-terracotta hover:bg-terracotta/10 transition"
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