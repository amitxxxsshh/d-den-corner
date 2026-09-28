"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CustomerHeader from "../../components/customer/CustomerHeader";
import { SunflowerMotif } from "../../components/customer/Icons";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col">
      <CustomerHeader subtitle="ORDER CONFIRMED" />

      <div className="mx-auto my-auto w-full max-w-md px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-6 sm:p-8 text-center shadow-lg">
          {/* Success Checkmark Circle */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-forest/15 text-forest border border-forest/30">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-amber-gold">
            <SunflowerMotif className="w-4 h-4 text-amber-warm" />
            <p className="text-[11px] font-bold uppercase tracking-widest">
              D Den Corner Kitchen
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
            Order Received!
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-charcoal-deep/70">
            Your dishes have been received by the kitchen and are being queued for preparation.
          </p>

          {orderId ? (
            <div className="mt-6 rounded-2xl border border-stone/40 bg-cream-warm/40 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50">
                Order Reference
              </p>

              <p className="mt-1 break-all font-mono text-xs font-bold text-charcoal-deep">
                #{orderId}
              </p>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {orderId ? (
              <Link
                href={`/orders/${encodeURIComponent(orderId)}`}
                className="flex w-full min-h-[46px] items-center justify-center rounded-xl bg-amber-warm py-3 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-sm"
              >
                Track Order Status →
              </Link>
            ) : null}

            <Link
              href="/orders"
              className="flex w-full min-h-[46px] items-center justify-center rounded-xl bg-charcoal-deep py-3 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition"
            >
              View Active Orders
            </Link>

            <Link
              href="/menu"
              className="block pt-2 text-xs font-semibold text-charcoal-deep/70 hover:text-charcoal-deep transition"
            >
              Browse menu for more items
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-cream-soft flex flex-col">
      <CustomerHeader subtitle="ORDER CONFIRMED" />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-3xl border border-stone/40 bg-white p-8 text-center text-xs text-charcoal-deep/60">
          Loading order details...
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ConfirmationContent />
    </Suspense>
  );
}