"use client";

import { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { formatCartPrice } from "../../lib/cart";

export default function CartBar({
  onClick,
}) {
  const {
    itemCount,
    subtotalMinor,
  } = useCart();

  const [mounted, setMounted] = useState(itemCount > 0);
  const [active, setActive] = useState(itemCount > 0);
  const [snapshot, setSnapshot] = useState({
    count: itemCount,
    subtotal: subtotalMinor,
  });

  if (
    itemCount > 0 &&
    (itemCount !== snapshot.count || subtotalMinor !== snapshot.subtotal)
  ) {
    setSnapshot({ count: itemCount, subtotal: subtotalMinor });
  }

  if (itemCount > 0 && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    let timer;
    let raf;
    if (itemCount > 0) {
      raf = requestAnimationFrame(() => {
        setActive(true);
      });
    } else {
      raf = requestAnimationFrame(() => {
        setActive(false);
      });
      timer = setTimeout(() => {
        setMounted(false);
      }, 220);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [itemCount]);

  if (!mounted && itemCount === 0) {
    return null;
  }

  const countToDisplay = itemCount > 0 ? itemCount : snapshot.count;
  const subtotalToDisplay = itemCount > 0 ? subtotalMinor : snapshot.subtotal;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-2 sm:pb-6 pointer-events-none">
      <div
        className={`mx-auto max-w-lg pointer-events-auto ${
          active ? "floating-overlay-enter" : "floating-overlay-exit"
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          className="group flex w-full min-h-[54px] items-center justify-between rounded-2xl bg-charcoal-deep border border-amber-warm/40 px-5 py-3.5 text-cream-soft shadow-xl transition-colors duration-200 hover:bg-charcoal-green hover:shadow-2xl active:scale-[0.99] amber-glow"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-xl bg-amber-warm px-2 text-xs font-extrabold text-charcoal-black">
              {countToDisplay}
            </span>

            <span className="text-xs sm:text-sm font-semibold text-stone">
              {countToDisplay === 1 ? "1 dish in cart" : `${countToDisplay} dishes in cart`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-cream-soft">
              View Cart · {formatCartPrice(subtotalToDisplay)}
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