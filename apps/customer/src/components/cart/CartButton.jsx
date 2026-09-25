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
      className="relative flex h-10 items-center gap-2 rounded-full bg-gray-900 px-4 text-sm font-semibold text-white"
    >
      <span>Cart</span>

      {itemCount > 0 ? (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-gray-900">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}