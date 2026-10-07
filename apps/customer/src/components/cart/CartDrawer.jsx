"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import CartItem from "./CartItem";
import { useCart } from "./CartContext";
import { useCustomerSession } from "../customer/CustomerSessionContext";
import { createOrder } from "../../lib/orders";
import { formatCartPrice } from "../../lib/cart";
import { BotanicalAccent } from "../customer/Icons";

export default function CartDrawer({
  open,
  onClose,
}) {
  const router = useRouter();
  const { isAuthenticated } = useCustomerSession();

  const {
    items,
    subtotalMinor,
    clearCart,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    setError("");
    onClose();
  }

  async function handleSendOrder() {
    if (!isAuthenticated) {
      setError(
        "You must connect to a table using your table's QR link before placing an order.",
      );
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await createOrder(items);

      const orderId =
        response?.order?.id ||
        response?.id;

      if (!orderId) {
        throw new Error(
          "Order was created, but no order ID was returned.",
        );
      }

      clearCart();
      setError("");
      onClose();

      router.push(
        `/order-confirmation?orderId=${encodeURIComponent(
          orderId,
        )}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to place your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-stone/40 bg-cream-soft text-charcoal-deep shadow-2xl transition-all"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-stone/70 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone/30 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-bold font-serif text-charcoal-deep tracking-tight">
              Your Order Cart
            </h2>

            <p className="mt-0.5 text-xs text-charcoal-deep/60">
              {items.length === 0
                ? "Your cart is empty"
                : `${items.length} ${items.length === 1 ? "item" : "items"} selected`}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-stone/50 text-sm font-bold text-charcoal-deep/70 hover:bg-cream-warm hover:text-charcoal-deep transition disabled:opacity-50"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 divide-y divide-stone/30">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-warm text-amber-gold">
                <BotanicalAccent className="h-6 w-6 text-forest" />
              </div>
              <p className="font-serif text-base font-bold text-charcoal-deep">
                Your cart is empty
              </p>
              <p className="mt-1 text-xs text-charcoal-deep/60">
                Explore our rooftop café menu and add your favorite dishes.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={`${item.menuItemId}::${
                  item.specialMenuId || "REGULAR"
                }`}
                item={item}
              />
            ))
          )}
        </div>

        {/* Footer & Order Submission */}
        {items.length > 0 && (
          <div className="border-t border-stone/30 bg-white/70 p-5 sm:p-6 backdrop-blur-sm rounded-b-3xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-charcoal-deep/70">
                Order Subtotal
              </span>

              <span className="text-xl font-extrabold text-charcoal-deep">
                {formatCartPrice(subtotalMinor)}
              </span>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-terracotta/30 bg-terracotta/10 px-3.5 py-2.5 text-xs text-terracotta"
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={handleSendOrder}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-amber-warm px-5 py-3.5 text-sm font-bold text-charcoal-black hover:bg-amber-light transition shadow-md amber-glow disabled:cursor-not-allowed disabled:bg-stone/40 disabled:text-charcoal-deep/40"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal-black border-t-transparent" />
                  <span>Sending order to kitchen...</span>
                </>
              ) : (
                <>
                  <span>Send Order to Kitchen</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}