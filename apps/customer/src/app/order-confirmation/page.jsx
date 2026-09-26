"use client";

import Link from "next/link";
import {
  Suspense,
} from "react";
import {
  useSearchParams,
} from "next/navigation";

function ConfirmationContent() {
  const searchParams =
    useSearchParams();

  const orderId =
    searchParams.get(
      "orderId",
    );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl text-green-700">
              ✓
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Order placed
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Your order has been received by D Den Corner.
          </p>

          {orderId ? (
            <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Order ID
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                {orderId}
              </p>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {orderId ? (
              <Link
                href={`/orders/${encodeURIComponent(
                  orderId,
                )}`}
                className="block rounded-2xl bg-gray-900 px-5 py-4 text-sm font-bold text-white"
              >
                Track this order
              </Link>
            ) : null}

            <Link
              href="/orders"
              className="block rounded-2xl bg-gray-100 px-5 py-4 text-sm font-bold text-gray-800"
            >
              View active orders
            </Link>

            <Link
              href="/menu"
              className="block px-5 py-3 text-sm font-semibold text-gray-600"
            >
              Back to menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center">
        Loading...
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <LoadingState />
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}