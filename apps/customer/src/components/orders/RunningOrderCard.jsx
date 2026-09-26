"use client";

import Link from "next/link";

import {
  getOrderStatusLabel,
} from "../../lib/order-status";

import {
  formatCartPrice,
} from "../../lib/cart";

export default function RunningOrderCard({
  order,
}) {
  if (!order) {
    return null;
  }

  return (
    <Link
      href={`/orders/${encodeURIComponent(
        order.id,
      )}`}
      className="block rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Order
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            #{order.id.slice(0, 8)}
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">
          {getOrderStatusLabel(
            order.status,
          )}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          Total
        </span>

        <span className="font-bold text-gray-900">
          {formatCartPrice(
            order.total_amount_minor,
          )}
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold text-gray-400">
        Tap to view order details →
      </p>
    </Link>
  );
}