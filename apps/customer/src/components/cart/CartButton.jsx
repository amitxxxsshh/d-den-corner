"use client";

import { useCart } from "./CartContext";

export default function CartButton({
  onClick,
}) {
  const { itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-9 items-center gap-2 rounded-xl bg-charcoal-deep border border-amber-warm/40 px-3.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition shadow-sm"
      aria-label="Open Cart"
    >
      <svg className="h-4 w-4 text-amber-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <span className="hidden xs:inline">Cart</span>

      {itemCount > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-warm px-1.5 text-[10px] font-black text-charcoal-black">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}