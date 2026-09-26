"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getMyOrder,
} from "../../lib/orders";

import {
  formatCartPrice,
} from "../../lib/cart";

import OrderStatus from "./OrderStatus";

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

  if (
    loading &&
    !order
  ) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Loading your order...
        </p>
      </div>
    );
  }

  if (
    error &&
    !order
  ) {
    return (
      <div className="rounded-3xl bg-red-50 p-5">
        <p className="font-semibold text-red-800">
          Unable to load order
        </p>

        <p className="mt-1 text-sm text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={loadOrder}
          className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Order not found.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {error ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Unable to refresh the order. Showing the latest available status.
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Order
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          #{order.id.slice(0, 8)}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {order.status}
        </p>
      </div>

      <OrderStatus
        status={order.status}
      />

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900">
          Your items
        </h2>

        <div className="mt-4 divide-y divide-gray-100">
          {(order.items || []).map(
            (item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {
                      item.item_name_snapshot
                    }
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Quantity:{" "}
                    {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatCartPrice(
                    item.line_total_minor,
                  )}
                </p>
              </div>
            ),
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="font-semibold text-gray-700">
            Total
          </span>

          <span className="text-lg font-bold text-gray-900">
            {formatCartPrice(
              order.total_amount_minor,
            )}
          </span>
        </div>
      </div>
    </section>
  );
}