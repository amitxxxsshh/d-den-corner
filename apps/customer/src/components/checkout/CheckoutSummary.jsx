"use client";

import Link from "next/link";
import CustomerHeader from "../customer/CustomerHeader";
import { formatCheckoutPrice } from "../../lib/checkout";

export default function CheckoutSummary({
  items = [],
  subtotalMinor = 0,
  onBack,
  onPlaceOrder,
  submitting = false,
  error = null,
}) {
  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col">
      {/* Exactly ONE Responsive Navbar */}
      <CustomerHeader subtitle="CHECKOUT" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-6 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-charcoal-deep/70 hover:text-charcoal-deep transition disabled:opacity-50"
        >
          <span>←</span>
          <span>Back to Menu</span>
        </button>

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-gold">
            Order Confirmation
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-serif text-charcoal-deep tracking-tight">
            Review Your Selections
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-charcoal-deep/70">
            Please verify your dishes before sending your order to the kitchen.
          </p>
        </div>

        {/* Order Items Card */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-stone/50 bg-white shadow-sm">
          <div className="border-b border-stone/30 bg-cream-warm/40 px-5 py-4">
            <h2 className="text-sm font-bold font-serif text-charcoal-deep">
              Order Items ({items.length})
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif text-base font-bold text-charcoal-deep">
                Your cart is empty.
              </p>
              <p className="mt-1 text-xs text-charcoal-deep/60">
                Add dishes from the menu before checking out.
              </p>
              <button
                type="button"
                onClick={onBack}
                className="mt-4 rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition"
              >
                Back to Menu
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone/30">
              {items.map((item) => {
                const unitPriceMinor = Number(item.priceMinor ?? 0);
                const lineTotal = unitPriceMinor * Number(item.quantity || 0);
                const isFestivalSpecial = item.festivalSpecial === true;

                return (
                  <div
                    key={`${item.menuItemId}::${
                      item.specialMenuId || "REGULAR"
                    }`}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-charcoal-deep font-serif text-sm sm:text-base leading-snug">
                          {item.name}
                        </p>

                        {isFestivalSpecial ? (
                          <span className="rounded-full bg-amber-warm/20 border border-amber-warm/40 px-2 py-0.5 text-[9px] font-bold text-amber-gold uppercase tracking-wider">
                            Festival
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs text-charcoal-deep/60">
                        {item.quantity} × {formatCheckoutPrice(unitPriceMinor)}
                      </p>

                      {isFestivalSpecial &&
                      item.regularPriceMinor !== null &&
                      item.regularPriceMinor !== undefined &&
                      Number(item.regularPriceMinor) !== unitPriceMinor ? (
                        <p className="mt-0.5 text-[11px] text-charcoal-deep/40">
                          Regular:{" "}
                          <span className="line-through">
                            {formatCheckoutPrice(item.regularPriceMinor)}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 text-sm sm:text-base font-extrabold text-charcoal-deep">
                      {formatCheckoutPrice(lineTotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Subtotal Row */}
          <div className="border-t border-stone/30 bg-cream-warm/30 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-charcoal-deep/80">
                Total Amount
              </span>

              <span className="text-xl font-extrabold text-charcoal-deep">
                {formatCheckoutPrice(subtotalMinor)}
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-xs text-terracotta"
          >
            {error}
          </div>
        ) : null}

        {/* Sticky Fixed Bottom Bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone/40 bg-white/95 p-4 sm:p-5 backdrop-blur-md">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              onClick={onPlaceOrder}
              disabled={submitting || items.length === 0}
              className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-amber-warm px-5 py-3.5 text-sm font-bold text-charcoal-black hover:bg-amber-light transition shadow-lg amber-glow disabled:cursor-not-allowed disabled:bg-stone/40 disabled:text-charcoal-deep/40"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal-black border-t-transparent" />
                  <span>Placing order with kitchen...</span>
                </>
              ) : (
                <>
                  <span>Send Order to Kitchen</span>
                  <span>·</span>
                  <span>{formatCheckoutPrice(subtotalMinor)}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}