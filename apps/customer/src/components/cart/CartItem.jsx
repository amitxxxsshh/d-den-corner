"use client";

import { useCart } from "./CartContext";
import { formatCartPrice } from "../../lib/cart";

export default function CartItem({ item }) {
  const {
    increaseItem,
    decreaseItem,
    removeItem,
  } = useCart();

  const specialMenuId =
    item.specialMenuId || null;

  const isFestivalSpecial =
    item.festivalSpecial === true;

  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-charcoal-deep font-serif text-sm sm:text-base leading-snug">
              {item.name}
            </h3>

            {isFestivalSpecial ? (
              <span className="rounded-full bg-amber-warm/20 border border-amber-warm/40 px-2 py-0.5 text-[9px] font-bold text-amber-gold uppercase tracking-wider">
                Festival
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-charcoal-deep/80">
              {formatCartPrice(item.priceMinor)}
            </span>

            {isFestivalSpecial &&
            item.regularPriceMinor !== null &&
            item.regularPriceMinor !== undefined &&
            Number(item.regularPriceMinor) !== Number(item.priceMinor) ? (
              <span className="text-[11px] text-charcoal-deep/40 line-through">
                {formatCartPrice(item.regularPriceMinor)}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            removeItem(
              item.menuItemId,
              specialMenuId,
            )
          }
          className="shrink-0 p-1 text-xs font-medium text-charcoal-deep/45 hover:text-terracotta transition"
          aria-label={`Remove ${item.name}`}
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {/* Thumb-friendly Quantity Controls (min 40px) */}
        <div className="inline-flex items-center rounded-xl border border-stone/50 bg-white shadow-xs">
          <button
            type="button"
            onClick={() =>
              decreaseItem(
                item.menuItemId,
                specialMenuId,
              )
            }
            className="flex h-9 w-9 items-center justify-center text-sm font-bold text-charcoal-deep hover:bg-cream-warm rounded-l-xl transition active:scale-95"
            aria-label={`Decrease ${item.name}`}
          >
            −
          </button>

          <span className="min-w-9 text-center text-xs font-bold text-charcoal-deep">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              increaseItem(
                item.menuItemId,
                specialMenuId,
              )
            }
            className="flex h-9 w-9 items-center justify-center text-sm font-bold text-charcoal-deep hover:bg-cream-warm rounded-r-xl transition active:scale-95"
            aria-label={`Increase ${item.name}`}
          >
            +
          </button>
        </div>

        <span className="text-sm font-extrabold text-charcoal-deep">
          {formatCartPrice(
            Number(item.priceMinor || 0) * Number(item.quantity || 0),
          )}
        </span>
      </div>
    </div>
  );
}