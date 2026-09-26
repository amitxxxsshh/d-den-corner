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
    item.available !== 1 &&
    item.available !== true;

  const isFestivalSpecial =
    item.festivalSpecial === true;

  const displayPrice =
    isFestivalSpecial &&
    item.specialPriceMinor !== undefined
      ? item.specialPriceMinor
      : item.price_minor;

  const regularPrice =
    isFestivalSpecial
      ? item.regularPriceMinor
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-3xl bg-white p-5">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                {item.name}
              </h2>

              {isFestivalSpecial ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                  Festival
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <p className="text-lg font-bold">
                {formatPrice(displayPrice)}
              </p>

              {isFestivalSpecial &&
              regularPrice !== null &&
              Number(regularPrice) !==
                Number(displayPrice) ? (
                <p className="text-sm text-gray-400 line-through">
                  {formatPrice(regularPrice)}
                </p>
              ) : null}
            </div>
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