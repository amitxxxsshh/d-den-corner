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
  getItemsForCategory,
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
  const [activeCategory, setActiveCategory] =
    useState(null);

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

  const visibleItems = useMemo(() => {
    const categoryItems = getItemsForCategory(
      menu.items,
      activeCategory,
    );

    return searchItems(
      categoryItems,
      searchQuery,
    );
  }, [
    menu.items,
    activeCategory,
    searchQuery,
  ]);

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

      <section className="space-y-5 px-4 py-5">
        <MenuSearch
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <MenuCategories
          categories={menu.categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">
              {searchQuery
                ? "Search results"
                : activeCategory
                  ? "Items"
                  : "Menu"}
            </h2>

            <span className="text-xs text-gray-500">
              {visibleItems.length} items
            </span>
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center">
              <p className="font-semibold text-gray-700">
                No dishes found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try another search or category.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onSelect={onItemSelect}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}