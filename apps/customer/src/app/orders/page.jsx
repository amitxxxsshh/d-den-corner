"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import CustomerHeader from "../../components/customer/CustomerHeader";
import CustomerMenuBackground from "../../components/menu/CustomerMenuBackground";
import TableBadge from "../../components/customer/TableBadge";
import { BotanicalAccent } from "../../components/customer/Icons";

import { getMyRunningOrders } from "../../lib/orders";
import { formatCartPrice } from "../../lib/cart";
import { useCustomerSession } from "../../components/customer/CustomerSessionContext";

export default function OrdersPage() {
  const { status, isAuthenticated } = useCustomerSession();
  const [orders, setOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    async function fetchOrders(isInitial = false) {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      try {
        const response = await getMyRunningOrders();
        if (isMounted) {
          setOrders(response?.orders || []);
          setError("");
        }
      } catch (requestError) {
        if (isMounted) {
          const msg =
            requestError instanceof Error
              ? requestError.message
              : "Unable to load your orders.";
          setError(msg);
        }
      } finally {
        isFetchingRef.current = false;
        if (isInitial && isMounted) {
          setInitialLoading(false);
        }
      }
    }

    void fetchOrders(true);

    const interval = window.setInterval(() => {
      void fetchOrders(false);
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, retryCount]);

  const {
    aggregatedItems,
    totalItemCount,
    subtotalMinor,
    sgstMinor,
    cgstMinor,
    totalToPayMinor,
  } = useMemo(() => {
    const itemMap = new Map();

    for (const order of orders) {
      for (const item of order.items || []) {
        const key = `${item.menu_item_id || item.item_name_snapshot}_${item.unit_price_minor}`;
        const existing = itemMap.get(key);
        const quantity = Number(item.quantity || 0);
        const unitPriceMinor = Number(item.unit_price_minor || 0);
        const lineTotalMinor = Number(
          item.line_total_minor ?? unitPriceMinor * quantity,
        );

        if (existing) {
          existing.quantity += quantity;
          existing.lineTotalMinor += lineTotalMinor;
        } else {
          itemMap.set(key, {
            id: item.id,
            menuItemId: item.menu_item_id,
            name: item.item_name_snapshot,
            unitPriceMinor,
            quantity,
            lineTotalMinor,
          });
        }
      }
    }

    const itemsList = Array.from(itemMap.values());
    const count = itemsList.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = itemsList.reduce((sum, item) => sum + item.lineTotalMinor, 0);
    const sgst = Math.round(subtotal * 0.025);
    const cgst = Math.round(subtotal * 0.025);
    const totalToPay = subtotal + sgst + cgst;

    return {
      aggregatedItems: itemsList,
      totalItemCount: count,
      subtotalMinor: subtotal,
      sgstMinor: sgst,
      cgstMinor: cgst,
      totalToPayMinor: totalToPay,
    };
  }, [orders]);

  return (
    <main className="relative min-h-screen text-charcoal-deep pb-16 flex flex-col">
      <CustomerMenuBackground />

      {/* Exactly ONE Responsive Navbar */}
      <CustomerHeader
        title="D Den Corner"
        subtitle="YOUR ORDERS"
        rightContent={<TableBadge />}
      />

      <section className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-charcoal-deep tracking-tight">
                Running Orders
              </h1>
              {totalItemCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2">
                  {totalItemCount}
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

        {error && orders.length === 0 ? (
          <div className="mb-6 rounded-3xl border border-terracotta/30 bg-white/95 backdrop-blur-md p-5 text-xs text-terracotta shadow-sm">
            <p className="font-bold text-sm">
              Unable to load orders
            </p>

            <p className="mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                setInitialLoading(true);
                setError("");
                setRetryCount((c) => c + 1);
              }}
              className="mt-3 rounded-xl bg-terracotta px-4 py-2 font-bold text-white shadow-sm cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : null}

        {error && orders.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-amber-warm/30 bg-cream-soft/95 backdrop-blur-md px-4 py-2.5 text-xs text-charcoal-deep/80 shadow-xs">
            Unable to refresh latest order updates. Showing latest confirmed items.
          </div>
        ) : null}

        {status === "loading" || (initialLoading && orders.length === 0 && isAuthenticated) ? (
          <div className="rounded-3xl border border-stone/50 bg-white/95 backdrop-blur-md p-12 text-center shadow-sm">
            <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
            </div>
            <p className="mt-4 text-xs font-semibold text-charcoal-deep/60">
              Checking kitchen orders...
            </p>
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-3xl border border-stone/50 bg-white/95 backdrop-blur-md p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-warm text-amber-gold">
              <BotanicalAccent className="h-7 w-7 text-forest" />
            </div>

            <h2 className="font-serif text-lg font-bold text-charcoal-deep">
              No Active Table Session
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-charcoal-deep/60">
              Scan the physical QR code on your table stand to view running orders and place orders directly to your table.
            </p>

            <Link
              href="/menu"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-warm px-6 py-3 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-md"
            >
              <span>Explore Menu</span>
              <span>→</span>
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-stone/50 bg-white/95 backdrop-blur-md p-8 sm:p-12 text-center shadow-sm">
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
          <div className="overflow-hidden rounded-3xl border border-stone/40 bg-white/95 backdrop-blur-md p-6 sm:p-8 card-warm-shadow shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-stone/30">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                  Ordered Items
                </h2>
                <p className="mt-0.5 text-xs text-charcoal-deep/60">
                  All active dishes for your table session
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/10 px-3 py-1 text-xs font-bold text-forest">
                <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse" />
                In Kitchen
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-stone/20 py-2">
              {aggregatedItems.map((item) => (
                <div
                  key={`${item.menuItemId || item.name}_${item.unitPriceMinor}`}
                  className="flex items-start justify-between gap-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-charcoal-deep font-serif leading-snug">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-charcoal-deep/65">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm sm:text-base font-extrabold text-charcoal-deep font-mono sm:font-sans">
                      {formatCartPrice(item.lineTotalMinor)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="mt-0.5 text-[11px] text-charcoal-deep/50">
                        {formatCartPrice(item.unitPriceMinor)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Items Count */}
            <div className="border-t border-stone/30 pt-4 pb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
              <span>Total Items</span>
              <span className="font-extrabold text-charcoal-deep text-sm font-mono sm:font-sans">
                {totalItemCount}
              </span>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-stone/20 pt-3 text-xs sm:text-sm text-charcoal-deep/75">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal-deep">
                  {formatCartPrice(subtotalMinor)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>SGST (2.5%)</span>
                <span className="font-semibold text-charcoal-deep">
                  {formatCartPrice(sgstMinor)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>CGST (2.5%)</span>
                <span className="font-semibold text-charcoal-deep">
                  {formatCartPrice(cgstMinor)}
                </span>
              </div>
            </div>

            {/* Total to Pay */}
            <div className="mt-5 rounded-2xl bg-charcoal-deep p-4 sm:p-5 text-cream-soft flex items-center justify-between shadow-md">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-gold">
                  Total to Pay
                </p>
                <p className="text-[10px] text-cream-soft/60 mt-0.5">
                  Includes 2.5% SGST + 2.5% CGST
                </p>
              </div>

              <span className="text-xl sm:text-2xl font-black text-amber-warm tracking-tight">
                {formatCartPrice(totalToPayMinor)}
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}