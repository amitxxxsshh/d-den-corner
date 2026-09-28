"use client";

import { useCart } from "./CartContext";
import { formatCartPrice } from "../../lib/cart";

export default function CartBar({
  onClick,
}) {
  const {
    itemCount,
    subtotalMinor,
  } = useCart();

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-2 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <button
          type="button"
          onClick={onClick}
          className="group flex w-full min-h-[54px] items-center justify-between rounded-2xl bg-charcoal-deep border border-amber-warm/40 px-5 py-3.5 text-cream-soft shadow-xl transition-all duration-200 hover:bg-charcoal-green hover:shadow-2xl active:scale-[0.99] amber-glow"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-xl bg-amber-warm px-2 text-xs font-extrabold text-charcoal-black">
              {itemCount}
            </span>

            <span className="text-xs sm:text-sm font-semibold text-stone">
              {itemCount === 1 ? "1 dish in cart" : `${itemCount} dishes in cart`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-cream-soft">
              View Cart · {formatCartPrice(subtotalMinor)}
            </span>
            <span className="text-amber-light font-bold transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}