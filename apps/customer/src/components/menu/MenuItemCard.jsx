"use client";

import { formatPrice } from "../../lib/menu-utils";

export default function MenuItemCard({
  item,
  onSelect,
}) {
  const unavailable =
    item.available !== 1 && item.available !== true;

  const archived =
    item.archived === 1 || item.archived === true;

  const disabled = unavailable || archived;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(item)}
      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">
            {item.name}
          </h3>

          {item.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {item.description}
            </p>
          ) : null}

          <p className="mt-3 text-sm font-bold text-gray-900">
            {formatPrice(item.price_minor)}
          </p>
        </div>

        <div className="shrink-0">
          {disabled ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
              Unavailable
            </span>
          ) : (
            <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
              Add
            </span>
          )}
        </div>
      </div>
    </button>
  );
}