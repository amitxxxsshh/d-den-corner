"use client";

import { useState, useEffect } from "react";

import CartItem from "./CartItem";
import { useCart } from "./CartContext";
import { useCustomerSession } from "../customer/CustomerSessionContext";
import { createOrder } from "../../lib/orders";
import { joinTableWithQRToken } from "../../lib/qr";
import {
  getCustomerSessionToken,
  getQRToken,
} from "../../lib/session-token";
import { formatCartPrice } from "../../lib/cart";
import { BotanicalAccent } from "../customer/Icons";

export default function CartDrawer({
  open,
  onClose,
  onOrderSuccess,
}) {
  const { isAuthenticated, refreshSession } = useCustomerSession();

  const {
    items,
    subtotalMinor,
    clearCart,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [mounted, setMounted] = useState(open);
  const [active, setActive] = useState(open);

  if (open && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    let timer;
    let raf;

    if (open) {
      raf = requestAnimationFrame(() => {
        setActive(true);
      });
    } else {
      raf = requestAnimationFrame(() => {
        setActive(false);
      });
      timer = setTimeout(() => {
        setMounted(false);
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [open]);

  function handleClose() {
    if (submitting) {
      return;
    }
    setError("");
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !submitting) {
        setError("");
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!mounted && !open) {
    return null;
  }

  async function handleSendOrder() {
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
      let response = null;
      let needsRecovery = false;

      const currentSessionToken = getCustomerSessionToken();
      if (isAuthenticated && currentSessionToken) {
        try {
          response = await createOrder(items);
        } catch (submitError) {
          if (submitError?.status === 401) {
            needsRecovery = true;
          } else {
            throw submitError;
          }
        }
      } else {
        needsRecovery = true;
      }

      if (needsRecovery) {
        const qrToken = getQRToken();
        if (!qrToken) {
          throw new Error(
            "You must connect to a table using your table's QR link before placing an order.",
          );
        }

        await joinTableWithQRToken(qrToken);

        const refreshedSession = await refreshSession();
        const activeToken = getCustomerSessionToken();

        if (!activeToken || !refreshedSession) {
          throw new Error(
            "Unable to establish an active table session.",
          );
        }

        response = await createOrder(items);
      }

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

      if (typeof onOrderSuccess === "function") {
        onOrderSuccess(orderId);
      }
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
      data-lenis-prevent
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] cart-drawer-overlay ${
        active ? "cart-drawer-overlay--active" : "cart-drawer-overlay--inactive"
      }`}
      onClick={handleClose}
    >
      <div
        data-lenis-prevent
        className={`cart-drawer-panel flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-white/15 bg-charcoal-green/85 backdrop-blur-xl text-cream-soft shadow-2xl shadow-charcoal-black/80 ring-1 ring-white/10 ${
          active ? "cart-drawer-panel--active" : "cart-drawer-panel--inactive"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/25 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-bold font-serif text-cream-soft tracking-tight">
              Your Order Cart
            </h2>

            <p className="mt-0.5 text-xs text-stone/80">
              {items.length === 0
                ? "Your cart is empty"
                : `${items.length} ${items.length === 1 ? "item" : "items"} selected`}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/15 text-sm font-bold text-stone hover:bg-white/20 hover:text-cream-soft transition disabled:opacity-50"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items List */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto px-5 sm:px-6 divide-y divide-white/10"
        >
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/10 text-amber-warm">
                <BotanicalAccent className="h-6 w-6 text-amber-warm" />
              </div>
              <p className="font-serif text-base font-bold text-cream-soft">
                Your cart is empty
              </p>
              <p className="mt-1 text-xs text-stone/75">
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
          <div className="border-t border-white/10 bg-black/25 backdrop-blur-md p-5 sm:p-6 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone/80">
                Order Subtotal
              </span>

              <span className="text-xl font-extrabold text-cream-soft">
                {formatCartPrice(subtotalMinor)}
              </span>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-terracotta/40 bg-terracotta/15 px-3.5 py-2.5 text-xs text-amber-light"
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={handleSendOrder}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-amber-warm px-5 py-3.5 text-sm font-bold text-charcoal-black hover:bg-amber-light transition shadow-md amber-glow disabled:cursor-not-allowed disabled:bg-stone/30 disabled:text-stone/50"
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