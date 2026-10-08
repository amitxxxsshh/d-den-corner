"use client";

import { useCart } from "../cart/CartContext";
import { getMenuItemImageUrl, DEFAULT_MENU_IMAGE } from "../../lib/menu-images";

export default function MenuItemCard({
  item,
  onClick,
  onSelect,
  onAdd,
  onAddToCart,
  onAddItem,
  onAddItemToCart,
  disabled = false,
  disabledReason = "",
  orderingEnabled,
}) {
  const { items, increaseItem, decreaseItem } = useCart();

  const handleAdd =
    onClick ||
    onSelect ||
    onAdd ||
    onAddToCart ||
    onAddItem ||
    onAddItemToCart;

  function handleClick() {
    if (typeof handleAdd === "function") {
      handleAdd(item);
    }
  }

  const isUnavailable =
    disabled ||
    (item.available !== 1 && item.available !== true && item.available !== undefined);

  const canOrder =
    (orderingEnabled !== undefined ? orderingEnabled : Boolean(handleAdd)) &&
    !isUnavailable;

  const cartItem =
    canOrder && Array.isArray(items)
      ? items.find(
          (ci) =>
            String(ci.menuItemId) === String(item.id) &&
            !ci.specialMenuId,
        )
      : null;

  const quantity = cartItem?.quantity || 0;

  function handleDecrease(e) {
    e.stopPropagation();
    if (!canOrder) return;
    decreaseItem(item.id);
  }

  function handleIncrease(e) {
    e.stopPropagation();
    if (!canOrder) return;
    increaseItem(item.id);
  }

  const priceFormatted = (Number(item.price_minor || 0) / 100).toFixed(2);
  const imageUrl = getMenuItemImageUrl(item);

  return (
    <article className="group relative flex flex-col md:flex-row items-stretch overflow-hidden rounded-2xl border border-stone/50 bg-white p-2.5 sm:p-3 md:p-4 card-warm-shadow menu-card-interactive gap-2.5 sm:gap-3 md:gap-4">
      {/* Visual Food / Beverage Image (Top on mobile, Left on desktop) */}
      <div className="relative shrink-0 w-full aspect-[4/3] md:w-32 md:h-32 md:aspect-auto self-start rounded-xl overflow-hidden bg-cream-warm border border-stone/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_MENU_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Item Information (Below image on mobile, Right on desktop) */}
      <div className="flex flex-1 flex-col justify-between min-w-0 w-full">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-charcoal-deep font-serif tracking-tight leading-snug line-clamp-2">
            {item.name}
          </h3>

          {item.description ? (
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-tight sm:leading-relaxed text-charcoal-deep/65 line-clamp-2">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-1 sm:gap-2 pt-2 md:pt-2.5 border-t border-stone/30">
          <div className="flex flex-col min-w-0 shrink">
            <span className="hidden md:block text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-medium">
              Price
            </span>
            <span className="text-xs sm:text-sm md:text-base font-extrabold text-charcoal-deep truncate">
              ₹{priceFormatted}
            </span>
          </div>

          {quantity > 0 && canOrder ? (
            <div
              className="inline-flex h-8 sm:h-9 md:h-11 items-center rounded-xl bg-charcoal-deep text-amber-light shadow-sm shrink-0 border border-charcoal-deep/30 select-none"
              role="group"
              aria-label={`Quantity controls for ${item.name}`}
            >
              <button
                type="button"
                onClick={handleDecrease}
                className="flex h-8 min-w-[24px] sm:h-9 sm:min-w-[28px] md:h-11 md:min-w-[38px] items-center justify-center text-xs sm:text-sm md:text-base font-bold text-amber-light hover:bg-charcoal-green hover:text-white rounded-l-xl transition active:scale-90 px-1 sm:px-1.5 md:px-2"
                aria-label={`Decrease ${item.name} quantity`}
              >
                −
              </button>

              <span
                className="min-w-[18px] sm:min-w-[22px] md:min-w-[30px] text-center text-[11px] sm:text-xs md:text-sm font-extrabold text-white px-0.5"
                aria-live="polite"
                aria-atomic="true"
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={handleIncrease}
                className="flex h-8 min-w-[24px] sm:h-9 sm:min-w-[28px] md:h-11 md:min-w-[38px] items-center justify-center text-xs sm:text-sm md:text-base font-bold text-amber-light hover:bg-charcoal-green hover:text-white rounded-r-xl transition active:scale-90 px-1 sm:px-1.5 md:px-2"
                aria-label={`Increase ${item.name} quantity`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isUnavailable || !handleAdd}
              onClick={handleClick}
              className={[
                "inline-flex h-8 sm:h-9 md:h-11 min-w-[54px] sm:min-w-[64px] md:min-w-[84px] items-center justify-center rounded-xl px-2.5 sm:px-3 md:px-4 text-[11px] sm:text-xs font-bold transition-all shadow-sm shrink-0",
                isUnavailable || !handleAdd
                  ? "cursor-not-allowed bg-stone/40 text-charcoal-deep/40"
                  : "bg-charcoal-deep text-amber-light hover:bg-charcoal-green hover:shadow active:scale-95",
              ].join(" ")}
            >
              {isUnavailable
                ? (disabledReason || "Sold Out")
                : !handleAdd
                  ? "View Only"
                  : "Add +"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}