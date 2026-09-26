"use client";

import {
  formatCheckoutPrice,
} from "../../lib/checkout";

export default function CheckoutSummary({
  items = [],
  subtotalMinor = 0,
  onBack,
  onPlaceOrder,
  submitting = false,
  error = null,
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-sm font-semibold text-gray-600 disabled:opacity-50"
        >
          ← Back to menu
        </button>

        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          Confirm your order
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review your items before placing the order.
        </p>

        <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-4">
            <h2 className="font-bold text-gray-900">
              Order items
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-semibold text-gray-900">
                Your cart is empty.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add items from the menu before checking out.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const unitPriceMinor =
                  Number(
                    item.priceMinor ?? 0,
                  );

                const lineTotal =
                  unitPriceMinor *
                  Number(
                    item.quantity || 0,
                  );

                const isFestivalSpecial =
                  item.festivalSpecial === true;

                return (
                  <div
                    key={`${item.menuItemId}::${
                      item.specialMenuId ||
                      "REGULAR"
                    }`}
                    className="flex items-start justify-between gap-4 px-4 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>

                        {isFestivalSpecial ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                            Festival
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.quantity} ×{" "}
                        {formatCheckoutPrice(
                          unitPriceMinor,
                        )}
                      </p>

                      {isFestivalSpecial &&
                      item.regularPriceMinor !==
                        null &&
                      item.regularPriceMinor !==
                        undefined &&
                      Number(
                        item.regularPriceMinor,
                      ) !==
                        unitPriceMinor ? (
                        <p className="mt-1 text-xs text-gray-400">
                          Regular price:{" "}
                          <span className="line-through">
                            {formatCheckoutPrice(
                              item.regularPriceMinor,
                            )}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 font-semibold text-gray-900">
                      {formatCheckoutPrice(
                        lineTotal,
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">
                Subtotal
              </span>

              <span className="text-lg font-bold text-gray-900">
                {formatCheckoutPrice(
                  subtotalMinor,
                )}
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              onClick={onPlaceOrder}
              disabled={
                submitting ||
                items.length === 0
              }
              className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting
                ? "Placing order..."
                : "Place order"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}