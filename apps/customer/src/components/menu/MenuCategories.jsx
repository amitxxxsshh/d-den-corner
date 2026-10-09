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
      data-lenis-prevent
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
    >
      <button
        ref={(el) => {
          pillRefs.current["ALL"] = el;
        }}
        type="button"
        onClick={() => handleClick?.("ALL")}
        className={[
          "shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
          isAllActive
            ? "bg-amber-warm text-charcoal-black font-bold border border-amber-light/80 ring-2 ring-amber-warm/30 shadow-md amber-glow"
            : "bg-charcoal-black/50 backdrop-blur-md text-stone/90 border border-white/15 hover:bg-charcoal-black/70 hover:text-cream-soft hover:border-white/25 shadow-xs",
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
              "shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
              active
                ? "bg-amber-warm text-charcoal-black font-bold border border-amber-light/80 ring-2 ring-amber-warm/30 shadow-md amber-glow"
                : "bg-charcoal-black/50 backdrop-blur-md text-stone/90 border border-white/15 hover:bg-charcoal-black/70 hover:text-cream-soft hover:border-white/25 shadow-xs",
            ].join(" ")}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}
