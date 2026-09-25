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
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex w-full max-w-lg items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 text-white shadow-xl"
      >
        <span className="text-sm font-bold">
          {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"}
        </span>

        <span className="text-sm font-bold">
          View cart · {formatCartPrice(subtotalMinor)}
        </span>
      </button>
    </div>
  );
}