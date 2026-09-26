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
    <main className="min-h-screen bg-gray-50 pb-10">
      <CustomerHeader
        title="D Den Corner"
        subtitle="Your orders"
        rightContent={
          <TableBadge />
        }
      />

      <section className="px-4 py-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Running orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Your active orders update automatically.
            </p>
          </div>

          <Link
            href="/menu"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm"
          >
            Menu
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              Unable to load orders
            </p>

            <p className="mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-3 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading your orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-gray-900">
              No running orders
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Place an order from the menu and it will appear here.
            </p>

            <Link
              href="/menu"
              className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(
              (order) => (
                <RunningOrderCard
                  key={order.id}
                  order={order}
                />
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}