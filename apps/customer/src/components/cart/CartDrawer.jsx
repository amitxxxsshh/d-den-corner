"use client";

import CartItem from "./CartItem";
import { useCart } from "./CartContext";
import { formatCartPrice } from "../../lib/cart";

export default function CartDrawer({
  open,
  onClose,
  onCheckout,
}) {
  const {
    items,
    subtotalMinor,
  } = useCart();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-bold">
              Your cart
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Review your order
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-semibold">
                Your cart is empty
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add something delicious from the menu.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.menuItemId}
                item={item}
              />
            ))
          )}
        </div>

        <div className="border-t border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Subtotal
            </span>

            <span className="text-lg font-bold">
              {formatCartPrice(subtotalMinor)}
            </span>
          </div>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={onCheckout}
            className="mt-4 w-full rounded-2xl bg-gray-900 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}