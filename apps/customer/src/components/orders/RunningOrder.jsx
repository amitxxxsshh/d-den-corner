"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  getMyOrder,
} from "../../lib/orders";

import {
  formatCartPrice,
} from "../../lib/cart";

import OrderStatus from "./OrderStatus";
import { getOrderStatusLabel } from "../../lib/order-status";

function getStatusBadgeStyle(status) {
  switch (status) {
    case "SERVED":
      return "bg-forest/15 text-forest border-forest/30";
    case "READY":
      return "bg-amber-warm/20 text-charcoal-deep border-amber-warm/50 font-bold";
    case "PREPARING":
    case "ACCEPTED":
    case "NEW":
      return "bg-amber-warm/20 text-amber-gold border-amber-warm/40";
    default:
      return "bg-stone/30 text-charcoal-deep/70 border-stone/50";
  }
}

export default function RunningOrder({
  orderId,
}) {
  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOrder =
    useCallback(async () => {
      if (!orderId) {
        setError(
          "Order ID is missing.",
        );

        setLoading(false);

        return;
      }

      try {
        const response =
          await getMyOrder(
            orderId,
          );

        setOrder(
          response?.order ||
            null,
        );

        setError("");
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your order.",
        );
      } finally {
        setLoading(false);
      }
    }, [orderId]);

  useEffect(() => {
    loadOrder();

    const interval =
      window.setInterval(
        loadOrder,
        5000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadOrder]);

  if (loading && !order) {
    return (
      <div className="rounded-3xl border border-stone/50 bg-white p-12 text-center shadow-sm">
        <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
        </div>
        <p className="mt-4 text-xs font-semibold text-charcoal-deep/60">
          Loading order details...
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-3xl border border-terracotta/30 bg-terracotta/10 p-6 text-center">
        <p className="font-bold text-sm text-terracotta">
          Unable to load order
        </p>

        <p className="mt-1 text-xs text-charcoal-deep/70">
          {error}
        </p>

        <button
          type="button"
          onClick={loadOrder}
          className="mt-4 rounded-xl bg-terracotta px-4 py-2 text-xs font-bold text-white shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-stone/50 bg-white p-12 text-center shadow-sm">
        <p className="font-serif text-base font-bold text-charcoal-deep">
          Order Not Found
        </p>
        <p className="mt-1 text-xs text-charcoal-deep/60">
          We could not locate this order in the active session.
        </p>
        <Link
          href="/orders"
          className="mt-4 inline-flex rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-bold text-cream-soft"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const badgeStyle = getStatusBadgeStyle(order.status);
  const statusLabel = getOrderStatusLabel(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal-deep/70 hover:text-charcoal-deep transition"
        >
          <span>←</span>
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-charcoal-deep/60">
          <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse" />
          <span>Live updates active</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-warm/30 bg-amber-warm/10 p-4 text-xs text-amber-gold">
          Unable to refresh the order. Showing the latest available status.
        </div>
      ) : null}

      {/* Order Header Card */}
      <div className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50">
              Table Order Reference
            </p>

            <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-serif text-charcoal-deep tracking-tight">
              #{order.id.slice(0, 8)}
            </h1>

            <p className="mt-1 font-mono text-[11px] text-charcoal-deep/40 break-all">
              {order.id}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shrink-0 ${badgeStyle}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Kitchen Timeline */}
      <OrderStatus status={order.status} />

      {/* Ordered Items Breakdown */}
      <div className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone/30">
          <h2 className="text-base font-bold font-serif text-charcoal-deep">
            Ordered Items
          </h2>
          <span className="text-xs text-charcoal-deep/50 font-medium">
            {(order.items || []).length} dishes
          </span>
        </div>

        <div className="divide-y divide-stone/30">
          {(order.items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div>
                <p className="text-sm font-bold text-charcoal-deep font-serif">
                  {item.item_name_snapshot}
                </p>

                <p className="mt-0.5 text-xs text-charcoal-deep/60">
                  Qty: {item.quantity}
                </p>
              </div>

              <p className="shrink-0 text-sm font-extrabold text-charcoal-deep">
                {formatCartPrice(item.line_total_minor)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-stone/40 pt-4">
          <span className="text-sm font-bold text-charcoal-deep/80">
            Total Amount
          </span>

          <span className="text-xl font-extrabold text-charcoal-deep">
            {formatCartPrice(order.total_amount_minor)}
          </span>
        </div>
      </div>
    </div>
  );
}