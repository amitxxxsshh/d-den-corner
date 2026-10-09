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
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 sm:px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:pb-6 pointer-events-none">
      <div
        className={`pointer-events-auto w-fit max-w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-lg ${
          active ? "floating-overlay-enter" : "floating-overlay-exit"
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          className="group flex w-auto sm:w-full min-h-[46px] sm:min-h-[52px] items-center justify-between gap-2.5 sm:gap-6 rounded-full bg-charcoal-black/60 backdrop-blur-md border border-white/20 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-cream-soft shadow-lg shadow-black/40 ring-1 ring-white/10 transition-all duration-200 hover:bg-charcoal-black/75 hover:border-amber-warm/50 hover:shadow-xl active:scale-[0.99] amber-glow"
        >
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="flex h-6 min-w-6 sm:h-7 sm:min-w-7 items-center justify-center rounded-full bg-amber-warm px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold text-charcoal-black border border-amber-light/80 ring-1 ring-amber-warm/30 shadow-xs">
              {countToDisplay}
            </span>

            <span className="text-[11px] sm:text-sm font-semibold text-stone/90 whitespace-nowrap">
              {countToDisplay === 1 ? "1 dish in cart" : `${countToDisplay} dishes in cart`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-xs sm:text-base font-bold text-cream-soft whitespace-nowrap">
              View Cart · {formatCartPrice(subtotalToDisplay)}
            </span>
            <span className="text-amber-light font-bold text-xs sm:text-base transition-transform group-hover:translate-x-0.5 shrink-0">
              →
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}