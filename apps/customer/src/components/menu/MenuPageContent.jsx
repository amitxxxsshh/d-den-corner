"use client";

import { useEffect, useMemo, useState } from "react";

import CustomerHeader from "../customer/CustomerHeader";
import TableBadge from "../customer/TableBadge";
import LoadingState from "../customer/LoadingState";
import ErrorState from "../customer/ErrorState";

import MenuSearch from "./MenuSearch";
import MenuCategories from "./MenuCategories";
import MenuItemCard from "./MenuItemCard";

import { getMenu } from "../../lib/menu";
import {
  normalizeMenuResponse,
  searchItems,
} from "../../lib/menu-utils";

export default function MenuPageContent({
  onItemSelect,
}) {
  const [menu, setMenu] = useState({
    categories: [],
    items: [],
  });

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  async function loadMenu() {
    setStatus("loading");
    setError("");

    try {
      const result = await getMenu();

      setMenu(normalizeMenuResponse(result));
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err?.message ||
          "Unable to load the menu right now.",
      );
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  /*
   * When the user scrolls through the menu, determine
   * which category section is currently visible.
   */
  useEffect(() => {
    if (
      status !== "success" ||
      !menu.categories.length ||
      searchQuery.trim()
    ) {
      return;
    }

    const sections = menu.categories
      .map((category) => ({
        id: category.id,
        element: document.getElementById(
          `menu-category-${category.id}`,
        ),
      }))
      .filter((section) => section.element);

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top -
              b.boundingClientRect.top,
          );

        if (visibleEntries.length > 0) {
          const visibleId =
            visibleEntries[0].target.dataset.categoryId;

          if (visibleId) {
            setActiveCategory(visibleId);
          }
        }
      },
      {
        root: null,
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      },
    );

    sections.forEach(({ element }) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [
    status,
    menu.categories,
    searchQuery,
  ]);

  const searchableItems = useMemo(() => {
    return searchItems(
      menu.items,
      searchQuery,
    );
  }, [
    menu.items,
    searchQuery,
  ]);

  const itemsByCategory = useMemo(() => {
    const result = new Map();

    for (const category of menu.categories) {
      result.set(category.id, []);
    }

    for (const item of searchableItems) {
      if (!result.has(item.category_id)) {
        result.set(item.category_id, []);
      }

      result
        .get(item.category_id)
        .push(item);
    }

    return result;
  }, [
    menu.categories,
    searchableItems,
  ]);

  const visibleCategoryCount =
    menu.categories.filter(
      (category) =>
        (itemsByCategory.get(category.id) || [])
          .length > 0,
    ).length;

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white">
        <CustomerHeader
          title="D Den Corner"
          subtitle="Menu"
          rightContent={<TableBadge />}
        />

        <LoadingState message="Loading menu..." />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-white">
        <CustomerHeader
          title="D Den Corner"
          subtitle="Menu"
          rightContent={<TableBadge />}
        />

        <ErrorState
          title="Menu unavailable"
          message={error}
          onRetry={loadMenu}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <CustomerHeader
        title="D Den Corner"
        subtitle="Choose your favourites"
        rightContent={<TableBadge />}
      />

      <section className="px-4 pt-5">
        <MenuSearch
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);

            if (value.trim()) {
              setActiveCategory(null);
            }
          }}
        />

        <div className="mt-5">
          <MenuCategories
            categories={menu.categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </section>

      <section className="px-4 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">
            {searchQuery
              ? "Search results"
              : "Menu"}
          </h2>

          <span className="text-xs text-gray-500">
            {searchableItems.length} items
          </span>
        </div>

        {searchableItems.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="font-semibold text-gray-700">
              No dishes found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try another search.
            </p>
          </div>
        ) : searchQuery ? (
          /*
           * Search mode:
           * show matching items in one simple list.
           */
          <div className="space-y-3">
            {searchableItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelect={onItemSelect}
              />
            ))}
          </div>
        ) : (
          /*
           * Normal mode:
           * render every category as its own section.
           */
          <div className="space-y-10">
            {menu.categories.map((category) => {
              const categoryItems =
                itemsByCategory.get(
                  category.id,
                ) || [];

              if (!categoryItems.length) {
                return null;
              }

              return (
                <section
                  key={category.id}
                  id={`menu-category-${category.id}`}
                  data-category-id={category.id}
                  className="scroll-mt-28"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {categoryItems.length}{" "}
                      {categoryItems.length === 1
                        ? "item"
                        : "items"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {categoryItems.map(
                      (item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onSelect={
                            onItemSelect
                          }
                        />
                      ),
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!searchQuery &&
        visibleCategoryCount === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="font-semibold text-gray-700">
              No dishes found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              There are currently no available
              menu items.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}