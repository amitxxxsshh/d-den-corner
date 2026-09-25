"use client";

import { formatPrice } from "../../lib/menu-utils";

export default function MenuItemDetails({
  item,
  onClose,
  onAdd,
}) {
  if (!item) {
    return null;
  }

  const unavailable =
    item.available !== 1 && item.available !== true;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-3xl bg-white p-5">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {item.name}
            </h2>

            <p className="mt-2 text-lg font-bold">
              {formatPrice(item.price_minor)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold"
          >
            ×
          </button>
        </div>

        {item.description ? (
          <p className="mt-5 text-sm leading-6 text-gray-600">
            {item.description}
          </p>
        ) : null}

        <button
          type="button"
          disabled={unavailable}
          onClick={() => onAdd(item)}
          className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {unavailable
            ? "Currently unavailable"
            : "Add to order"}
        </button>
      </div>
    </div>
  );
}