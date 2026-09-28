"use client";

import { useEffect, useMemo, useState } from "react";

import { getMenu } from "../../lib/menu";
import { getCurrentFestivals } from "../../lib/festivals";
import FestivalMenu from "./FestivalMenu";
import MenuItemCard from "./MenuItemCard";
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

  const filteredItems = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return menu.items.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        item.category_id ===
          selectedCategory ||
        item.categoryId ===
          selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const name = String(
        item.name || "",
      ).toLowerCase();

      const description = String(
        item.description || "",
      ).toLowerCase();

      return (
        name.includes(searchValue) ||
        description.includes(searchValue)
      );
    });
  }, [
    menu.items,
    search,
    selectedCategory,
  ]);

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
      <div className="flex min-h-[400px] items-center justify-center px-6 py-20">
        <div className="text-center">
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
      <div className="px-6 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-terracotta/30 bg-cream-soft p-6 sm:p-8 text-center shadow-sm">
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
    <div className="flex-1 pb-24">
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

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Menu Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-600">
                <svg className="h-4 w-4 text-charcoal-deep/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <input
                id="menu-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search dishes, drinks, specials..."
                className="w-full rounded-2xl border border-stone/60 bg-white pl-10 pr-10 py-3 text-sm text-charcoal-deep outline-none transition placeholder:text-charcoal-deep/40 focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20 shadow-sm"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-charcoal-deep/40 hover:text-charcoal-deep"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* Category Filter Pills */}
          {menu.categories.length > 0 ? (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() =>
                  setSelectedCategory("ALL")
                }
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm",
                  selectedCategory === "ALL"
                    ? "bg-charcoal-deep text-amber-light ring-1 ring-amber-warm/30 shadow-md"
                    : "bg-white text-charcoal-deep/80 border border-stone/50 hover:bg-cream-warm hover:text-charcoal-deep",
                ].join(" ")}
              >
                All Items
              </button>

              {menu.categories.map((category) => {
                const categoryId = category.id;
                const active = selectedCategory === categoryId;

                return (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(categoryId)
                    }
                    className={[
                      "shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm",
                      active
                        ? "bg-charcoal-deep text-amber-light ring-1 ring-amber-warm/30 shadow-md"
                        : "bg-white text-charcoal-deep/80 border border-stone/50 hover:bg-cream-warm hover:text-charcoal-deep",
                    ].join(" ")}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Items Grid or Empty State */}
          {filteredItems.length === 0 ? (
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onClick={
                    orderingEnabled
                      ? () => handleRegularAdd(item)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}