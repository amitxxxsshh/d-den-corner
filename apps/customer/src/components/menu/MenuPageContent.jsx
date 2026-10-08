"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getMenu } from "../../lib/menu";
import { getCurrentFestivals } from "../../lib/festivals";
import FestivalMenu from "./FestivalMenu";
import MenuItemCard from "./MenuItemCard";
import MenuSearch from "./MenuSearch";
import MenuCategories from "./MenuCategories";
import { BotanicalAccent } from "../customer/Icons";

export default function MenuPageContent({
  onItemSelect,
}) {
  const orderingEnabled =
    typeof onItemSelect === "function";

  const [menu, setMenu] = useState({
    categories: [],
    items: [],
  });

  const [festivals, setFestivals] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("ALL");
  const [loading, setLoading] = useState(true);
  const [festivalLoading, setFestivalLoading] =
    useState(true);
  const [error, setError] = useState("");

  const [headerHeight, setHeaderHeight] = useState(60);
  const [stickyBarHeight, setStickyBarHeight] = useState(100);

  const stickyControlsRef = useRef(null);
  const isManualScrollingRef = useRef(false);
  const resetTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const data = await getMenu();

        if (cancelled) {
          return;
        }

        setMenu({
          categories: Array.isArray(
            data?.categories,
          )
            ? data.categories
            : [],
          items: Array.isArray(data?.items)
            ? data.items
            : [],
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load the menu.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFestivals() {
      try {
        setFestivalLoading(true);

        const data =
          await getCurrentFestivals();

        if (cancelled) {
          return;
        }

        setFestivals(
          Array.isArray(data?.festivals)
            ? data.festivals
            : [],
        );
      } catch {
        if (!cancelled) {
          setFestivals([]);
        }
      } finally {
        if (!cancelled) {
          setFestivalLoading(false);
        }
      }
    }

    loadFestivals();

    return () => {
      cancelled = true;
    };
  }, []);

  // Measure sticky header height dynamically
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    const updateHeight = () => {
      const h = header.getBoundingClientRect().height;
      if (h > 0) {
        setHeaderHeight(h);
        document.documentElement.style.setProperty(
          "--customer-header-height",
          `${h}px`,
        );
      }
    };

    updateHeight();

    const ro = new ResizeObserver(updateHeight);
    ro.observe(header);
    window.addEventListener("resize", updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Measure sticky search & category controls container height dynamically
  useEffect(() => {
    if (!stickyControlsRef.current) return;

    const updateBarHeight = () => {
      const h =
        stickyControlsRef.current?.getBoundingClientRect().height || 0;
      if (h > 0) {
        setStickyBarHeight(h);
      }
    };

    updateBarHeight();

    const ro = new ResizeObserver(updateBarHeight);
    ro.observe(stickyControlsRef.current);

    return () => {
      ro.disconnect();
    };
  }, []);

  const totalStickyOffset = headerHeight + stickyBarHeight;

  // Group items by category while preserving order and full item data
  const categorizedData = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    // 1. Filter items matching search
    const matchingItems = menu.items.filter((item) => {
      if (!searchValue) return true;
      const name = String(item.name || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();
      return (
        name.includes(searchValue) ||
        description.includes(searchValue)
      );
    });

    // 2. Map items by category ID preserving original categories order
    const itemsByCategoryId = new Map();
    for (const cat of menu.categories) {
      itemsByCategoryId.set(String(cat.id), []);
    }

    const uncategorizedItems = [];

    for (const item of matchingItems) {
      const catId = item.category_id ?? item.categoryId;
      const catIdStr = catId != null ? String(catId) : null;
      if (catIdStr && itemsByCategoryId.has(catIdStr)) {
        itemsByCategoryId.get(catIdStr).push(item);
      } else {
        uncategorizedItems.push(item);
      }
    }

    // 3. Build sections only for categories with at least 1 item
    const sections = [];
    for (const cat of menu.categories) {
      const items = itemsByCategoryId.get(String(cat.id)) || [];
      if (items.length > 0) {
        sections.push({
          id: String(cat.id),
          name: cat.name,
          items,
        });
      }
    }

    // 4. Safely include uncategorized items if any exist
    if (uncategorizedItems.length > 0) {
      sections.push({
        id: "uncategorized",
        name: "Other Items",
        items: uncategorizedItems,
      });
    }

    return {
      matchingItems,
      sections,
    };
  }, [menu.categories, menu.items, search]);

  // Derive categories for navigation pills
  const displayCategories = useMemo(() => {
    if (search.trim()) {
      return categorizedData.sections.map((s) => ({
        id: s.id,
        name: s.name,
      }));
    }

    const categoryIdsWithItems = new Set(
      categorizedData.sections.map((s) => s.id),
    );

    const result = menu.categories
      .filter((cat) => categoryIdsWithItems.has(String(cat.id)))
      .map((cat) => ({ id: String(cat.id), name: cat.name }));

    if (categoryIdsWithItems.has("uncategorized")) {
      result.push({ id: "uncategorized", name: "Other Items" });
    }

    return result;
  }, [categorizedData.sections, menu.categories, search]);

  // If active category is no longer present (e.g. after search), fallback to ALL
  useEffect(() => {
    if (selectedCategory === "ALL") return;
    const exists = displayCategories.some(
      (cat) => cat.id === selectedCategory,
    );
    if (!exists) {
      setSelectedCategory("ALL");
    }
  }, [displayCategories, selectedCategory]);

  const resetManualScrollAfterDelay = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 800);
  };

  // Coordinated category click handler
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    isManualScrollingRef.current = true;

    if (categoryId === "ALL") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      resetManualScrollAfterDelay();
      return;
    }

    const target = document.getElementById(`menu-category-${categoryId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      resetManualScrollAfterDelay();
    }
  };

  // Unset manual scroll lock on scroll end or user interrupt
  useEffect(() => {
    const handleScrollEnd = () => {
      isManualScrollingRef.current = false;
    };

    const handleUserInterrupt = () => {
      isManualScrollingRef.current = false;
    };

    window.addEventListener("scrollend", handleScrollEnd, { passive: true });
    window.addEventListener("wheel", handleUserInterrupt, { passive: true });
    window.addEventListener("touchstart", handleUserInterrupt, { passive: true });

    return () => {
      window.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("wheel", handleUserInterrupt);
      window.removeEventListener("touchstart", handleUserInterrupt);
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Automatic active category detection while scrolling
  useEffect(() => {
    const sections = categorizedData.sections;
    if (sections.length === 0) return;

    let ticking = false;

    const checkActiveCategory = () => {
      if (isManualScrollingRef.current) return;

      const totalOffset = headerHeight + stickyBarHeight;

      // 1. Bottom of page check: if scrolled to the very bottom
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 30;

      if (atBottom) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          setSelectedCategory(lastSection.id);
          return;
        }
      }

      // 2. Top of page check: if scrolled above or near the first section
      const firstEl = document.getElementById(
        `menu-category-${sections[0].id}`,
      );
      if (firstEl) {
        const firstTop = firstEl.getBoundingClientRect().top;
        if (firstTop > totalOffset + 80) {
          setSelectedCategory("ALL");
          return;
        }
      }

      // 3. Scan sections from top to bottom
      // The reading line is slightly below the sticky controls bar
      const readingLine = totalOffset + 40;
      let currentId = sections[0].id;

      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const el = document.getElementById(`menu-category-${s.id}`);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= readingLine) {
          currentId = s.id;
        } else {
          break;
        }
      }

      setSelectedCategory(currentId);
    };

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkActiveCategory();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    checkActiveCategory();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [categorizedData.sections, headerHeight, stickyBarHeight]);

  function handleRegularAdd(item) {
    if (!orderingEnabled) {
      return;
    }

    onItemSelect(item);
  }

  function handleFestivalAdd(item) {
    if (!orderingEnabled) {
      return;
    }

    onItemSelect({
      id: item.menuItemId,
      name: item.name,
      description: item.description,
      price_minor:
        item.specialPriceMinor,
      available: item.available,
      festivalSpecial: true,
      specialMenuId:
        item.specialMenuId,
      specialMenuItemId:
        item.id,
      specialMenuPriceMinor:
        item.specialPriceMinor,
      regularPriceMinor:
        item.regularPriceMinor,
      categoryId:
        item.categoryId,
    });
  }

  if (loading) {
    return (
      <div className="relative z-10 flex min-h-[400px] items-center justify-center px-6 py-20">
        <div className="text-center rounded-3xl bg-cream-soft/90 backdrop-blur-md p-8 border border-stone/30 shadow-sm">
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-stone/40" />
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
            <div className="h-2 w-2 rounded-full bg-amber-warm animate-pulse" />
          </div>

          <p className="mt-4 text-sm font-medium text-charcoal-deep/70 font-serif">
            Loading D Den Corner menu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative z-10 px-6 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-terracotta/30 bg-cream-soft/95 backdrop-blur-md p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/15 text-terracotta">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="mt-4 text-lg font-bold font-serif text-charcoal-deep">
            Unable to load the menu
          </h1>

          <p className="mt-2 text-xs text-charcoal-deep/75 leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-1 pb-24">
      {/* Festival Specials Banner (if present) */}
      {!festivalLoading && festivals.length > 0 ? (
        <FestivalMenu
          festivals={festivals}
          onAdd={
            orderingEnabled
              ? handleFestivalAdd
              : undefined
          }
        />
      ) : null}

      {/* Sticky Search & Category Navigation Bar */}
      <div
        ref={stickyControlsRef}
        style={{ top: `${headerHeight}px` }}
        className="sticky z-20 border-b border-white/10 shadow-xs transition-all"
      >
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          {/* Menu Search Bar */}
          <div className="mb-2">
            <MenuSearch
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
            />
          </div>

          {/* Category Navigation Pills */}
          <MenuCategories
            categories={displayCategories}
            activeCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />
        </div>
      </div>

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Items by Category Sections or Empty State */}
          {categorizedData.matchingItems.length === 0 ? (
            <div className="rounded-3xl border border-stone/50 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-warm text-amber-gold">
                <BotanicalAccent className="h-6 w-6 text-forest" />
              </div>
              <p className="font-serif text-base font-bold text-charcoal-deep">
                No matching dishes found
              </p>
              <p className="mt-1 text-xs text-charcoal-deep/60">
                {search
                  ? `No items match "${search}". Try searching for another dish or reset filters.`
                  : "No items are currently listed in this category."}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-semibold text-cream-soft hover:bg-charcoal-green transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {categorizedData.sections.map((section) => (
                <section
                  key={section.id}
                  id={`menu-category-${section.id}`}
                  style={{ scrollMarginTop: `${totalStickyOffset + 16}px` }}
                  className="pt-2"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-stone/30 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-warm" />
                      <h2 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
                        {section.name}
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold text-charcoal-deep/60 rounded-full bg-cream-warm px-2.5 py-0.5 border border-stone/40">
                      {section.items.length} {section.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {section.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        orderingEnabled={orderingEnabled}
                        onClick={
                          orderingEnabled
                            ? () => handleRegularAdd(item)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
