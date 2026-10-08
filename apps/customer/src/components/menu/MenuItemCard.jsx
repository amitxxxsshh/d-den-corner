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
    <article className="group relative flex flex-row items-stretch overflow-hidden rounded-2xl border border-stone/50 bg-white p-3.5 sm:p-4 card-warm-shadow menu-card-interactive gap-3.5 sm:gap-4">
      {/* Visual Food / Beverage Image (LEFT) */}
      <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 self-start rounded-xl overflow-hidden bg-cream-warm border border-stone/30">
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

      {/* Item Information (RIGHT) */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-charcoal-deep font-serif tracking-tight leading-snug line-clamp-2">
            {item.name}
          </h3>

          {item.description ? (
            <p className="mt-1 text-xs leading-relaxed text-charcoal-deep/65 line-clamp-2">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-stone/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-medium">
              Price
            </span>
            <span className="text-sm sm:text-base font-extrabold text-charcoal-deep">
              ₹{priceFormatted}
            </span>
          </div>

          {quantity > 0 && canOrder ? (
            <div
              className="inline-flex min-h-[40px] sm:min-h-[44px] items-center rounded-xl bg-charcoal-deep text-amber-light shadow-sm shrink-0 border border-charcoal-deep/30 select-none"
              role="group"
              aria-label={`Quantity controls for ${item.name}`}
            >
              <button
                type="button"
                onClick={handleDecrease}
                className="flex min-h-[40px] min-w-[34px] sm:min-h-[44px] sm:min-w-[38px] items-center justify-center text-sm sm:text-base font-bold text-amber-light hover:bg-charcoal-green hover:text-white rounded-l-xl transition active:scale-90"
                aria-label={`Decrease ${item.name} quantity`}
              >
                −
              </button>

              <span
                className="min-w-[26px] sm:min-w-[30px] text-center text-xs sm:text-sm font-extrabold text-white px-0.5"
                aria-live="polite"
                aria-atomic="true"
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={handleIncrease}
                className="flex min-h-[40px] min-w-[34px] sm:min-h-[44px] sm:min-w-[38px] items-center justify-center text-sm sm:text-base font-bold text-amber-light hover:bg-charcoal-green hover:text-white rounded-r-xl transition active:scale-90"
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
                "inline-flex min-h-[40px] sm:min-h-[44px] min-w-[76px] sm:min-w-[84px] items-center justify-center rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all shadow-sm shrink-0",
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