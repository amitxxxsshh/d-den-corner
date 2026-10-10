"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SunflowerMotif } from "../customer/Icons";

export default function OrderConfirmationDrawer({
  open,
  orderId,
  onClose,
}) {
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
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted && !open) {
    return null;
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
              Order Confirmed
            </h2>

            <p className="mt-0.5 text-xs text-stone/80">
              Your order has been received.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/15 text-sm font-bold text-stone hover:bg-white/20 hover:text-cream-soft transition"
            aria-label="Close order confirmation"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto px-5 py-6 sm:px-6 text-center"
        >
          {/* Prominent success checkmark */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-forest/25 text-amber-warm border border-forest/40 shadow-inner">
            <svg
              className="h-8 w-8 text-amber-warm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* D DEN CORNER KITCHEN */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-amber-gold">
            <SunflowerMotif className="w-4 h-4 text-amber-warm" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-warm/90">
              D Den Corner Kitchen
            </p>
          </div>

          {/* Order Received! */}
          <h3 className="mt-2 text-2xl font-bold font-serif text-cream-soft tracking-tight">
            Order Received!
          </h3>

          {/* Message */}
          <p className="mt-2 text-xs leading-relaxed text-stone/80 max-w-xs mx-auto">
            Your dishes have been received by the kitchen and are being queued for preparation.
          </p>

          {/* Order Reference */}
          {orderId ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone/60">
                Order Reference
              </p>

              <p className="mt-1 break-all font-mono text-xs font-bold text-amber-light">
                #{orderId}
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {orderId ? (
              <Link
                href={`/orders/${encodeURIComponent(orderId)}`}
                className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-amber-warm px-5 py-3.5 text-sm font-bold text-charcoal-black hover:bg-amber-light transition shadow-md amber-glow"
              >
                <span>Track Order Status</span>
                <span>→</span>
              </Link>
            ) : null}

            <Link
              href="/orders"
              className="flex w-full min-h-[46px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-cream-soft hover:bg-white/20 transition"
            >
              View Active Orders
            </Link>

            <button
              type="button"
              onClick={handleClose}
              className="block w-full pt-2 pb-1 text-center text-xs font-semibold text-stone/75 hover:text-cream-soft transition cursor-pointer"
            >
              Browse menu for more items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
