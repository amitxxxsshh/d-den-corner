"use client";

import { useEffect, useMemo, useState } from "react";

import { getMenu } from "../../lib/menu";
import { getCurrentFestivals } from "../../lib/festivals";
import FestivalMenu from "./FestivalMenu";
import MenuItemCard from "./MenuItemCard";

export default function MenuPageContent({ onItemSelect }) {
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
          categories: Array.isArray(data?.categories)
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

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

            <p className="mt-4 text-sm text-gray-500">
              Loading menu...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to load the menu
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      </main>
    );
  }

  function handleFestivalAdd(item) {
    if (!onItemSelect) {
      return;
    }

    onItemSelect({
      id: item.menuItemId,
      name: item.name,
      description: item.description,

      /*
       * Display-only price.
       * The API recalculates the actual order price
       * from D1 during checkout.
       */
      price_minor:
        item.specialPriceMinor,

      available:
        item.available,

      festivalSpecial: true,

      /*
       * This is the parent special_menus.id.
       * It is the value required by the order API.
       */
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

  return (
    <main className="min-h-screen bg-white">
      {!festivalLoading &&
      festivals.length > 0 ? (
        <FestivalMenu
          festivals={festivals}
          onAdd={handleFestivalAdd}
        />
      ) : null}

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <label
              htmlFor="menu-search"
              className="sr-only"
            >
              Search menu
            </label>

            <input
              id="menu-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search menu..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          {menu.categories.length > 0 ? (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() =>
                  setSelectedCategory("ALL")
                }
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  selectedCategory ===
                  "ALL"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                All
              </button>

              {menu.categories.map(
                (category) => {
                  const categoryId =
                    category.id;

                  const active =
                    selectedCategory ===
                    categoryId;

                  return (
                    <button
                      key={categoryId}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          categoryId,
                        )
                      }
                      className={[
                        "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                        active
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      ].join(" ")}
                    >
                      {category.name}
                    </button>
                  );
                },
              )}
            </div>
          ) : null}

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                No menu items found.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(
                (item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onClick={() =>
                      onItemSelect?.(
                        item,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}