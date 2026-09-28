"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import CustomerHeader from "../../components/customer/CustomerHeader";
import TableBadge from "../../components/customer/TableBadge";
import RunningOrderCard from "../../components/orders/RunningOrderCard";
import { BotanicalAccent } from "../../components/customer/Icons";

import {
  getMyRunningOrders,
} from "../../lib/orders";

export default function OrdersPage() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOrders =
    useCallback(async () => {
      try {
        const response =
          await getMyRunningOrders();

        setOrders(
          response?.orders || [],
        );

        setError("");
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your orders.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadOrders();

    const interval =
      window.setInterval(
        loadOrders,
        5000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadOrders]);

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep pb-16 flex flex-col">
      {/* Exactly ONE Responsive Navbar */}
      <CustomerHeader
        title="D Den Corner"
        subtitle="YOUR ORDERS"
        rightContent={<TableBadge />}
      />

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-charcoal-deep tracking-tight">
                Running Orders
              </h1>
              {orders.length > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2">
                  {orders.length}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs sm:text-sm text-charcoal-deep/70">
              Kitchen updates automatically refresh every 5 seconds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-warm px-4 py-2 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-sm"
            >
              <span>+ Add More Dishes</span>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-terracotta/30 bg-terracotta/10 p-5 text-xs text-terracotta">
            <p className="font-bold text-sm">
              Unable to load orders
            </p>

            <p className="mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-3 rounded-xl bg-terracotta px-4 py-2 font-bold text-white shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-stone/50 bg-white p-12 text-center shadow-sm">
            <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
            </div>
            <p className="mt-4 text-xs font-semibold text-charcoal-deep/60">
              Checking kitchen orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-stone/50 bg-white p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-warm text-amber-gold">
              <BotanicalAccent className="h-7 w-7 text-forest" />
            </div>

            <h2 className="font-serif text-lg font-bold text-charcoal-deep">
              No Running Orders
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-charcoal-deep/60">
              When you place an order from your table, it will appear here with live preparation updates.
            </p>

            <Link
              href="/menu"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-warm px-6 py-3 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-md"
            >
              <span>Explore Menu &amp; Order</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <RunningOrderCard
                key={order.id}
                order={order}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}