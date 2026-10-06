"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createMenuCategory,
  createMenuItem,
  getMenuCategories,
  getMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from "../../lib/menu";
import {
  getMenuItemImageUrl,
  DEFAULT_MENU_IMAGE,
} from "../../lib/menu-images";
import StaffNavbar from "../../components/StaffNavbar";

// SVG helper icons matching D Den Corner aesthetic
function CameraIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UploadIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function EditIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CloseIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const STORAGE_KEY = "staff_menu_custom_images";

export default function MenuManagementPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  // Category creation form
  const [categoryName, setCategoryName] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("0");

  // Item creation form
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [newItemImagePreview, setNewItemImagePreview] = useState(null);

  // Search & category navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("ALL");

  // Custom uploaded images map: itemId -> dataUrl (initialized from localStorage)
  const [customImages, setCustomImages] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Could not load custom menu images from storage:", err);
    }
    return {};
  });

  // Full Edit Item Modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    description: "",
    available: true,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddSection, setShowAddSection] = useState(true);

  // Hidden file input reference for local computer image selection
  const fileInputRef = useRef(null);
  // Target of image upload: itemId | "new-item" | "edit-item"
  const [uploadTarget, setUploadTarget] = useState(null);

  // Primary data loader
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [loadedCategories, loadedItems] = await Promise.all([
        getMenuCategories(),
        getMenuItems(),
      ]);

      setCategories(loadedCategories);
      setItems(loadedItems);

      if (!itemCategoryId && loadedCategories.length > 0) {
        setItemCategoryId(loadedCategories[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load menu catalogue."
      );
    } finally {
      setLoading(false);
    }
  }

  // Load data on initial render
  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const [loadedCategories, loadedItems] = await Promise.all([
          getMenuCategories(),
          getMenuItems(),
        ]);

        if (cancelled) return;

        setCategories(loadedCategories);
        setItems(loadedItems);

        if (loadedCategories.length > 0) {
          setItemCategoryId(loadedCategories[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load menu catalogue."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      categories.map((category) => [category.id, category])
    );
  }, [categories]);

  // Save custom image to state and localStorage
  function persistCustomImage(itemId, dataUrl) {
    setCustomImages((prev) => {
      const updated = { ...prev, [itemId]: dataUrl };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("localStorage quota exceeded or failed:", err);
      }
      return updated;
    });
  }

  // Remove custom image and revert to catalog default
  function removeCustomImage(itemId) {
    setCustomImages((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("localStorage update failed:", err);
      }
      return updated;
    });
    setSuccess("Custom photo removed. Restored catalog image.");
  }

  // Trigger file picker for specific target
  function handleTriggerImageUpload(target) {
    setUploadTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  // Handle browser file selection
  function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file || !uploadTarget) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP, etc.)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Selected image exceeds 8MB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl || typeof dataUrl !== "string") return;

      if (uploadTarget === "new-item") {
        setNewItemImagePreview(dataUrl);
        setSuccess("Image selected for new dish.");
      } else if (uploadTarget === "edit-item") {
        if (editingItem) {
          persistCustomImage(editingItem.id, dataUrl);
          setSuccess(`Photo updated for "${editingItem.name}".`);
        }
      } else {
        // Direct upload on a specific menu item card
        persistCustomImage(uploadTarget, dataUrl);
        const targetItem = items.find((i) => i.id === uploadTarget);
        setSuccess(`Photo updated for "${targetItem?.name || "dish"}".`);
      }
      setUploadTarget(null);
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
  }

  // Category management: Create Category
  async function handleCreateCategory(event) {
    event.preventDefault();

    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await createMenuCategory({
        name: categoryName.trim(),
        sortOrder: Number(categorySortOrder) || 0,
      });

      const category = data?.category;

      setCategoryName("");
      setCategorySortOrder("0");

      await loadData();

      if (category?.id) {
        setItemCategoryId(category.id);
      }

      setSuccess("Menu category created successfully.");
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

  // Category management: Toggle Status
  async function toggleCategory(category) {
    setError("");
    setSuccess("");

    try {
      await updateMenuCategory(category.id, {
        active: category.active !== 1,
      });

      await loadData();

      setSuccess(`${category.name} status updated.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    }
  }

  // Add Item flow
  async function handleCreateItem(event) {
    event.preventDefault();

    if (!itemCategoryId) {
      setError("Create or select a category first.");
      return;
    }

    if (!itemName.trim()) {
      setError("Menu item name is required.");
      return;
    }

    const priceMinor = Math.round(Number(itemPrice) * 100);

    if (!Number.isFinite(priceMinor) || priceMinor < 0) {
      setError("Enter a valid price in ₹.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const createdResponse = await createMenuItem({
        categoryId: itemCategoryId,
        name: itemName.trim(),
        description: itemDescription.trim(),
        priceMinor,
      });

      const newItem = createdResponse?.item;
      if (newItem?.id && newItemImagePreview) {
        persistCustomImage(newItem.id, newItemImagePreview);
      }

      setItemName("");
      setItemDescription("");
      setItemPrice("");
      setNewItemImagePreview(null);

      await loadData();

      setSuccess("Menu item created successfully.");
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

  // Toggle item availability
  async function toggleItem(item) {
    setError("");
    setSuccess("");

    try {
      await updateMenuItem(item.id, {
        available: item.available !== 1,
      });

      await loadData();

      setSuccess(`${item.name} availability updated.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update item availability."
      );
    }
  }

  // Archive item
  async function archiveItem(item) {
    const confirmed = window.confirm(`Archive "${item.name}"?`);

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await updateMenuItem(item.id, {
        archived: true,
        available: false,
      });

      await loadData();

      setSuccess(`${item.name} archived.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to archive item."
      );
    }
  }

  // Quick edit item price (preserves existing prompt workflow)
  async function editItemPrice(item) {
    const currentRupees = Number(item.price_minor || 0) / 100;

    const value = window.prompt(
      `Enter new price for ${item.name} in ₹`,
      currentRupees.toFixed(2)
    );

    if (value === null) {
      return;
    }

    const priceMinor = Math.round(Number(value) * 100);

    if (!Number.isFinite(priceMinor) || priceMinor < 0) {
      setError("Enter a valid price.");
      return;
    }

    try {
      await updateMenuItem(item.id, {
        priceMinor,
      });

      await loadData();

      setSuccess(`${item.name} price updated.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update price."
      );
    }
  }

  // Full Edit Item Modal Open
  function openEditModal(item) {
    setEditingItem(item);
    setEditFormData({
      name: item.name || "",
      categoryId: item.category_id || "",
      price: (Number(item.price_minor || 0) / 100).toFixed(2),
      description: item.description || "",
      available: item.available === 1,
    });
  }

  // Full Edit Item Modal Submit
  async function handleSaveEditItem(event) {
    event.preventDefault();
    if (!editingItem) return;

    if (!editFormData.name.trim()) {
      setError("Item name is required.");
      return;
    }

    const priceMinor = Math.round(Number(editFormData.price) * 100);
    if (!Number.isFinite(priceMinor) || priceMinor < 0) {
      setError("Enter a valid price in ₹.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateMenuItem(editingItem.id, {
        name: editFormData.name.trim(),
        categoryId: editFormData.categoryId || editingItem.category_id,
        priceMinor,
        description: editFormData.description.trim(),
        available: editFormData.available,
      });

      await loadData();

      setSuccess(`"${editFormData.name.trim()}" updated successfully.`);
      setEditingItem(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update menu item."
      );
    } finally {
      setSaving(false);
    }
  }

  // Filtered items based on search and category tab
  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCategoryTab !== "ALL") {
      result = result.filter((item) => item.category_id === selectedCategoryTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (categoryMap[item.category_id]?.name &&
            categoryMap[item.category_id].name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, selectedCategoryTab, searchQuery, categoryMap]);

  // Group items by category for Customer-style section presentation
  const categorizedSections = useMemo(() => {
    if (selectedCategoryTab !== "ALL" || searchQuery.trim()) {
      // Flat list when filtering or searching
      return null;
    }

    // Build active category sections
    const sections = [];
    const usedItemIds = new Set();

    categories
      .filter((cat) => cat.active === 1)
      .forEach((category) => {
        const catItems = items.filter((item) => item.category_id === category.id);
        if (catItems.length > 0) {
          sections.push({
            id: category.id,
            name: category.name,
            items: catItems,
          });
          catItems.forEach((i) => usedItemIds.add(i.id));
        }
      });

    // Uncategorized or inactive category items
    const uncategorized = items.filter((item) => !usedItemIds.has(item.id));
    if (uncategorized.length > 0) {
      sections.push({
        id: "uncategorized",
        name: "Other Dishes",
        items: uncategorized,
      });
    }

    return sections;
  }, [items, categories, selectedCategoryTab, searchQuery]);

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-20">
      {/* Exactly ONE Unified Responsive Staff Navbar */}
      <StaffNavbar onRefresh={loadData} refreshLoading={loading} />

      {/* Hidden browser file input for picking images from computer */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Menu Catalogue Title Bar */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Menu Catalogue Management
              </h1>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2.5">
                {items.length} Dishes
              </span>
            </div>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Customer-style visual presentation with full kitchen controls, pricing in ₹, and instant image uploads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddSection(!showAddSection)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone/60 bg-white px-3.5 py-2 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition shadow-xs"
            >
              <PlusIcon className="w-3.5 h-3.5 text-amber-gold" />
              {showAddSection ? "Hide Add Forms" : "Add Dish / Category"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Status Alerts */}
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta font-medium animate-fadeIn">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="ml-3 font-bold hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between rounded-2xl border border-forest/30 bg-forest/10 px-5 py-3.5 text-xs text-forest font-semibold animate-fadeIn">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")} className="ml-3 font-bold hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Creation Section (Add Category & Add Menu Item) */}
        {showAddSection && (
          <div className="space-y-6">
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
                    Organize dishes into sections (e.g. Refreshing Mocktails, Burgers, Pizza)
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

              {/* Create Menu Item Form with Image Selection */}
              <form
                onSubmit={handleCreateItem}
                className="rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm"
              >
                <div className="mb-4">
                  <h2 className="text-base font-bold font-serif text-charcoal-deep">
                    Add Menu Item
                  </h2>
                  <p className="mt-0.5 text-xs text-charcoal-deep/60">
                    Create dishes with pricing in ₹, description, and optional photo
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

                  {/* Add Image control in creation flow */}
                  <div className="rounded-2xl border border-dashed border-stone/60 bg-cream-soft/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {newItemImagePreview ? (
                          <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-amber-warm/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={newItemImagePreview}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-warm text-charcoal-deep/50 border border-stone/40">
                            <CameraIcon className="w-5 h-5 text-amber-gold" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-charcoal-deep">
                            {newItemImagePreview ? "Dish Photo Selected" : "Add Dish Photo (Optional)"}
                          </p>
                          <p className="text-[11px] text-charcoal-deep/60">
                            {newItemImagePreview ? "Photo ready to attach" : "Upload an image from your computer"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTriggerImageUpload("new-item")}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone/50 bg-white px-2.5 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition shadow-2xs"
                        >
                          <UploadIcon className="w-3.5 h-3.5 text-amber-gold" />
                          {newItemImagePreview ? "Change Photo" : "Upload Image"}
                        </button>

                        {newItemImagePreview && (
                          <button
                            type="button"
                            onClick={() => setNewItemImagePreview(null)}
                            className="rounded-lg border border-stone/40 bg-white p-1.5 text-charcoal-deep/60 hover:text-terracotta transition"
                            title="Remove photo"
                          >
                            <CloseIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
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

            {/* Categories Management Section */}
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
          </div>
        )}

        {/* CUSTOMER-STYLE MENU CATALOGUE PRESENTATION */}
        <section className="space-y-6">
          {/* Header Controls: Search bar & Category filter tabs */}
          <div className="rounded-3xl border border-stone/50 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-charcoal-deep">
                  Dishes & Visual Presentation
                </h2>
                <p className="text-xs text-charcoal-deep/60">
                  Showing {filteredItems.length} of {items.length} dishes in catalogue
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-deep/40 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes or ingredients..."
                  className="w-full rounded-xl border border-stone/60 bg-cream-soft/40 pl-10 pr-4 py-2 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-charcoal-deep/40 hover:text-charcoal-deep"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryTab("ALL")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                  selectedCategoryTab === "ALL"
                    ? "bg-charcoal-deep text-cream-soft shadow-xs"
                    : "bg-cream-warm/60 text-charcoal-deep/75 border border-stone/40 hover:bg-cream-warm"
                }`}
              >
                All Dishes
                <span className="text-[10px] opacity-75 font-normal">({items.length})</span>
              </button>

              {categories.map((category) => {
                const count = items.filter((i) => i.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryTab(category.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                      selectedCategoryTab === category.id
                        ? "bg-charcoal-deep text-cream-soft shadow-xs"
                        : "bg-cream-warm/60 text-charcoal-deep/75 border border-stone/40 hover:bg-cream-warm"
                    }`}
                  >
                    {category.name}
                    <span className="text-[10px] opacity-75 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dishes Display */}
          {loading ? (
            <div className="rounded-3xl border border-stone/50 bg-white p-12 text-center shadow-sm">
              <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone/30 border-t-amber-warm" />
              </div>
              <p className="mt-3 text-xs font-medium text-charcoal-deep/60 font-serif">
                Loading menu catalogue...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-stone/50 bg-white p-12 text-center shadow-sm">
              <p className="font-serif text-base font-bold text-charcoal-deep">
                No matching dishes found
              </p>
              <p className="mt-1 text-xs text-charcoal-deep/60">
                {searchQuery
                  ? `No dishes match "${searchQuery}". Clear your search query or change category.`
                  : "No dishes are currently configured in this section."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : categorizedSections ? (
            /* Categorized Group View (matching Customer-side sections) */
            <div className="space-y-10">
              {categorizedSections.map((section) => (
                <section key={section.id} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone/30 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-warm" />
                      <h2 className="text-lg sm:text-xl font-bold font-serif text-charcoal-deep tracking-tight">
                        {section.name}
                      </h2>
                    </div>

                    <span className="text-[11px] font-semibold text-charcoal-deep/60 rounded-full bg-white px-2.5 py-0.5 border border-stone/40">
                      {section.items.length} {section.items.length === 1 ? "dish" : "dishes"}
                    </span>
                  </div>

                  {/* Customer-style Card Grid: IMAGE LEFT | ITEM INFO RIGHT */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {section.items.map((item) => (
                      <MenuItemStaffCard
                        key={item.id}
                        item={item}
                        categoryMap={categoryMap}
                        customImage={customImages[item.id]}
                        onToggleAvailability={() => toggleItem(item)}
                        onEditPrice={() => editItemPrice(item)}
                        onEditItem={() => openEditModal(item)}
                        onArchive={() => archiveItem(item)}
                        onTriggerImageUpload={() => handleTriggerImageUpload(item.id)}
                        onRemoveCustomImage={() => removeCustomImage(item.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Filtered / Search Results Grid */
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuItemStaffCard
                  key={item.id}
                  item={item}
                  categoryMap={categoryMap}
                  customImage={customImages[item.id]}
                  onToggleAvailability={() => toggleItem(item)}
                  onEditPrice={() => editItemPrice(item)}
                  onEditItem={() => openEditModal(item)}
                  onArchive={() => archiveItem(item)}
                  onTriggerImageUpload={() => handleTriggerImageUpload(item.id)}
                  onRemoveCustomImage={() => removeCustomImage(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Full Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-deep/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-stone/60 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone/30">
              <div>
                <h3 className="text-lg font-bold font-serif text-charcoal-deep">
                  Edit Menu Item
                </h3>
                <p className="text-xs text-charcoal-deep/60">
                  Update dish details, pricing, kitchen availability, and photo
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-stone/40 p-2 text-charcoal-deep/60 hover:text-charcoal-deep hover:bg-stone/20 transition"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-4">
              {/* Photo section */}
              <div className="rounded-2xl border border-stone/40 bg-cream-soft/30 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-cream-warm border border-stone/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        customImages[editingItem.id] ||
                        getMenuItemImageUrl(editingItem)
                      }
                      alt={editingItem.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_MENU_IMAGE;
                      }}
                    />
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-bold">
                      Dish Photo
                    </span>
                    <p className="text-xs font-semibold text-charcoal-deep">
                      {customImages[editingItem.id] ? "Custom Uploaded Photo" : "Catalog Photo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTriggerImageUpload("edit-item")}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone/50 bg-white px-2.5 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition shadow-2xs"
                  >
                    <UploadIcon className="w-3.5 h-3.5 text-amber-gold" />
                    {customImages[editingItem.id] ? "Change" : "Upload"}
                  </button>

                  {customImages[editingItem.id] && (
                    <button
                      type="button"
                      onClick={() => removeCustomImage(editingItem.id)}
                      className="rounded-lg border border-stone/40 bg-white px-2 py-1.5 text-xs font-bold text-charcoal-deep/60 hover:text-charcoal-deep hover:bg-stone/20 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-sm font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                    Category
                  </label>
                  <select
                    value={editFormData.categoryId}
                    onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
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
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full resize-none rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone/40 bg-cream-warm/20 p-3">
                <div>
                  <p className="text-xs font-bold text-charcoal-deep">Kitchen Availability</p>
                  <p className="text-[11px] text-charcoal-deep/60">
                    Mark dish as available or sold out in real-time
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.available}
                    onChange={(e) => setEditFormData({ ...editFormData, available: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone/30">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-stone/50 bg-white px-4 py-2 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-charcoal-deep px-5 py-2 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Reusable Customer-Style Staff Menu Item Card
 * Follows customer-side MenuItemCard layout:
 * ┌──────────────┐   Item Name
 * │              │   Description
 * │    IMAGE     │   ₹ Price
 * │              │   Existing Staff Controls
 * └──────────────┘
 * IMAGE = LEFT
 * ITEM INFORMATION = RIGHT
 */
function MenuItemStaffCard({
  item,
  categoryMap,
  customImage,
  onToggleAvailability,
  onEditPrice,
  onEditItem,
  onArchive,
  onTriggerImageUpload,
  onRemoveCustomImage,
}) {
  const isAvailable = item.available === 1;
  const isCustomUploaded = Boolean(customImage);

  // Resolve image URL: custom image takes priority, otherwise uses Customer menu visual mapping
  const resolvedItem = customImage ? { ...item, imageUrl: customImage } : item;
  const displayImageUrl = getMenuItemImageUrl(resolvedItem);
  const priceFormatted = (Number(item.price_minor || 0) / 100).toFixed(2);

  return (
    <article className="group relative flex flex-row items-stretch overflow-hidden rounded-2xl border border-stone/50 bg-white p-3.5 sm:p-4 card-warm-shadow transition-all duration-200 hover:border-amber-warm/40 hover:shadow-md gap-3.5 sm:gap-4">
      {/* Visual Food / Beverage Image (LEFT) */}
      <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 self-start rounded-xl overflow-hidden bg-cream-warm border border-stone/30 group/img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImageUrl}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_MENU_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Image Source Badge */}
        {isCustomUploaded ? (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-amber-warm px-1.5 py-0.5 text-[9px] font-extrabold text-charcoal-deep shadow-2xs">
            Custom
          </span>
        ) : (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-charcoal-deep/75 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-semibold text-cream-soft">
            Photo
          </span>
        )}

        {/* Quick upload overlay on hover / touch */}
        <button
          type="button"
          onClick={onTriggerImageUpload}
          title="Upload image from computer"
          className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-lg bg-charcoal-deep/85 hover:bg-charcoal-deep text-cream-soft py-1 text-[10px] font-bold backdrop-blur-xs transition shadow-sm opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100"
        >
          <CameraIcon className="w-3 h-3 text-amber-warm" />
          <span>{isCustomUploaded ? "Change" : "Add Image"}</span>
        </button>
      </div>

      {/* Item Information & Editorial Controls (RIGHT) */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="min-w-0">
          {/* Category & Availability Header */}
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span className="inline-flex rounded-md bg-cream-warm/80 px-2 py-0.5 text-[10px] font-semibold text-charcoal-deep/75 border border-stone/40 truncate max-w-[130px]">
              {categoryMap[item.category_id]?.name || "Uncategorized"}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                isAvailable
                  ? "bg-forest/15 text-forest border-forest/30"
                  : "bg-terracotta/15 text-terracotta border-terracotta/30"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-forest" : "bg-terracotta"}`} />
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          {/* Dish Name */}
          <h3 className="text-sm sm:text-base font-bold text-charcoal-deep font-serif tracking-tight leading-snug line-clamp-2">
            {item.name}
          </h3>

          {/* Description */}
          {item.description ? (
            <p className="mt-1 text-xs leading-relaxed text-charcoal-deep/65 line-clamp-2">
              {item.description}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-charcoal-deep/40">
              No description provided
            </p>
          )}
        </div>

        {/* Price & Editorial Actions */}
        <div className="mt-3 pt-2 border-t border-stone/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-medium">
                Price
              </span>
              <span className="text-sm sm:text-base font-extrabold text-charcoal-deep">
                ₹{priceFormatted}
              </span>
            </div>

            {/* Quick Availability Button */}
            <button
              type="button"
              onClick={onToggleAvailability}
              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                isAvailable
                  ? "border border-stone/50 bg-white text-charcoal-deep hover:bg-stone/20"
                  : "border border-forest/40 bg-forest/15 text-forest hover:bg-forest/25"
              }`}
            >
              {isAvailable ? "Disable" : "Enable"}
            </button>
          </div>

          {/* Editorial Actions Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-stone/20">
            <button
              type="button"
              onClick={onEditItem}
              className="inline-flex items-center gap-1 rounded-lg border border-stone/50 bg-white px-2.5 py-1 text-[11px] font-bold text-charcoal-deep hover:bg-stone/20 transition shadow-2xs"
            >
              <EditIcon className="w-3 h-3 text-charcoal-deep/70" />
              Edit
            </button>

            <button
              type="button"
              onClick={onEditPrice}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-warm/40 bg-amber-warm/10 px-2 py-1 text-[11px] font-bold text-charcoal-deep hover:bg-amber-warm/20 transition shadow-2xs"
            >
              Edit Price
            </button>

            <button
              type="button"
              onClick={onTriggerImageUpload}
              className="inline-flex items-center gap-1 rounded-lg border border-stone/50 bg-white px-2 py-1 text-[11px] font-bold text-charcoal-deep hover:bg-stone/20 transition shadow-2xs"
            >
              <UploadIcon className="w-3 h-3 text-amber-gold" />
              {isCustomUploaded ? "Change Photo" : "Add Image"}
            </button>

            {isCustomUploaded && (
              <button
                type="button"
                onClick={onRemoveCustomImage}
                title="Restore default catalog image"
                className="inline-flex items-center rounded-lg border border-stone/40 bg-white px-1.5 py-1 text-[11px] font-bold text-charcoal-deep/60 hover:text-charcoal-deep hover:bg-stone/20 transition"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={onArchive}
              className="inline-flex items-center gap-1 rounded-lg border border-terracotta/30 bg-white px-2 py-1 text-[11px] font-bold text-terracotta hover:bg-terracotta/10 transition shadow-2xs ml-auto"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
