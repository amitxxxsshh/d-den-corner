"use client";

import { useEffect, useRef } from "react";

export default function MenuCategories({
  categories = [],
  activeCategory = "ALL",
  onCategoryClick,
  onCategoryChange,
}) {
  const containerRef = useRef(null);
  const pillRefs = useRef({});

  const handleClick = onCategoryClick || onCategoryChange;

  // Bring active category pill into horizontal view when activeCategory updates
  useEffect(() => {
    const key =
      !activeCategory || activeCategory === "ALL"
        ? "ALL"
        : String(activeCategory);
    const pillElement = pillRefs.current[key];
    const container = containerRef.current;

    if (pillElement && container) {
      const pillLeft = pillElement.offsetLeft;
      const pillRight = pillLeft + pillElement.offsetWidth;
      const visibleLeft = container.scrollLeft;
      const visibleRight = container.scrollLeft + container.clientWidth;

      // Only scroll horizontally if the pill is partially or fully out of view
      if (pillLeft < visibleLeft + 16 || pillRight > visibleRight - 16) {
        const targetScrollLeft =
          pillLeft - (container.clientWidth - pillElement.offsetWidth) / 2;
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: "smooth",
        });
      }
    }
  }, [activeCategory]);

  if (!categories || categories.length === 0) {
    return null;
  }

  const isAllActive = !activeCategory || activeCategory === "ALL";

  return (
    <nav
      aria-label="Menu categories"
      ref={containerRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
    >
      <button
        ref={(el) => {
          pillRefs.current["ALL"] = el;
        }}
        type="button"
        onClick={() => handleClick?.("ALL")}
        className={[
          "shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm",
          isAllActive
            ? "bg-charcoal-deep text-amber-light ring-1 ring-amber-warm/30 shadow-md"
            : "bg-white text-charcoal-deep/80 border border-stone/50 hover:bg-cream-warm hover:text-charcoal-deep",
        ].join(" ")}
      >
        All Items
      </button>

      {categories.map((category) => {
        const categoryId = String(category.id);
        const active = !isAllActive && String(activeCategory) === categoryId;

        return (
          <button
            key={categoryId}
            ref={(el) => {
              pillRefs.current[categoryId] = el;
            }}
            type="button"
            onClick={() => handleClick?.(categoryId)}
            className={[
              "shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm",
              active
                ? "bg-charcoal-deep text-amber-light ring-1 ring-amber-warm/30 shadow-md"
                : "bg-white text-charcoal-deep/80 border border-stone/50 hover:bg-cream-warm hover:text-charcoal-deep",
            ].join(" ")}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}
