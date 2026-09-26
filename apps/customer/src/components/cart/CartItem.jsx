"use client";

import { useCart } from "./CartContext";
import { formatCartPrice } from "../../lib/cart";

export default function CartItem({ item }) {
  const {
    increaseItem,
    decreaseItem,
    removeItem,
  } = useCart();

  const specialMenuId =
    item.specialMenuId || null;

  const isFestivalSpecial =
    item.festivalSpecial === true;

  return (
    <div className="border-b border-gray-100 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {item.name}
            </h3>

            {isFestivalSpecial ? (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                Festival
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {formatCartPrice(
                item.priceMinor,
              )}
            </span>

            {isFestivalSpecial &&
            item.regularPriceMinor !== null &&
            item.regularPriceMinor !==
              undefined &&
            Number(item.regularPriceMinor) !==
              Number(item.priceMinor) ? (
              <span className="text-xs text-gray-400 line-through">
                {formatCartPrice(
                  item.regularPriceMinor,
                )}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            removeItem(
              item.menuItemId,
              specialMenuId,
            )
          }
          className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-700"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center rounded-full border border-gray-200">
          <button
            type="button"
            onClick={() =>
              decreaseItem(
                item.menuItemId,
                specialMenuId,
              )
            }
            className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-50"
            aria-label={`Decrease ${item.name}`}
          >
            −
          </button>

          <span className="min-w-8 text-center text-sm font-semibold">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              increaseItem(
                item.menuItemId,
                specialMenuId,
              )
            }
            className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-50"
            aria-label={`Increase ${item.name}`}
          >
            +
          </button>
        </div>

        <span className="text-sm font-bold text-gray-900">
          {formatCartPrice(
            Number(item.priceMinor || 0) *
              Number(item.quantity || 0),
          )}
        </span>
      </div>
    </div>
  );
}