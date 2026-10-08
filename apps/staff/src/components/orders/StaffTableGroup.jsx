"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StaffOrderCard from "./StaffOrderCard";

function formatPrice(priceMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(priceMinor || 0) / 100);
}

export default function StaffTableGroup({
  group,
  onAcceptOrder,
  onCompleteOrder,
  onDeleteItem,
  busyOrderId,
}) {
  const { tableName, orders = [] } = group;
  const scrollContainerRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const pendingOrders = orders.filter((o) => o.status === "NEW");

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    // Small epsilon buffer for high-DPI scaling
    const hasLeft = el.scrollLeft > 6;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;

    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  useEffect(() => {
    checkScroll();

    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [pendingOrders, checkScroll]);

  function scroll(direction) {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = 340;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }

  if (!orders || orders.length === 0) {
    return null;
  }

  const activeCount = orders.length;
  const newCount = orders.filter((o) => o.status === "NEW").length;
  const tableTotalMinor = orders.reduce(
    (sum, o) => sum + Number(o.total_amount_minor || 0),
    0,
  );

  // Derive accepted orders for the Table Items panel, sorted chronologically (earliest first)
  const acceptedOrders = orders.filter(
    (order) => order.status === "ACCEPTED",
  );

  const sortedAcceptedOrders = [...acceptedOrders].sort((a, b) => {
    const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
    const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  const acceptedItems = sortedAcceptedOrders.flatMap(
    (order) => order.items || [],
  );

  const acceptedTotalMinor = sortedAcceptedOrders.reduce(
    (sum, o) => sum + Number(o.total_amount_minor || 0),
    0,
  );

  return (
    <section className="w-full overflow-hidden rounded-3xl border border-stone/50 bg-cream-warm/20 p-4 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone">
      {/* Table Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone/30 pb-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold font-serif text-charcoal-deep tracking-tight">
              {tableName}
            </h2>

            <span className="flex items-center rounded-full bg-charcoal-deep text-cream-soft px-3 py-0.5 text-xs font-black uppercase tracking-wider">
              {activeCount} {activeCount === 1 ? "Active Order" : "Active Orders"}
            </span>

            {newCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-warm/50 bg-amber-warm/25 px-2.5 py-0.5 text-xs font-bold text-amber-gold uppercase tracking-wider animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-warm" />
                <span>{newCount} New</span>
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-charcoal-deep/60">
            Combined Table Running Total:{" "}
            <span className="font-bold text-charcoal-deep">
              {formatPrice(tableTotalMinor)}
            </span>
          </p>
        </div>

        {/* Scroll Controls (Visible if multiple cards can be navigated) */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone/50 bg-white text-charcoal-deep shadow-2xs transition hover:bg-stone/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            title="Scroll orders left"
            aria-label="Scroll left"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone/50 bg-white text-charcoal-deep shadow-2xs transition hover:bg-stone/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            title="Scroll orders right"
            aria-label="Scroll right"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table Content Area: Left Panel (Table Items) + Right (Existing Horizontally Scrollable Cards) */}
      <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
        {/* Left Side: Table Items Panel (Accepted Orders Only) */}
        <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 rounded-2xl border border-stone/50 bg-white p-4 sm:p-5 card-warm-shadow flex flex-col justify-between">
          <div>
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-stone/30 pb-3 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-serif text-charcoal-deep tracking-tight">
                  {tableName} Items
                </h3>
                <p className="text-[11px] text-charcoal-deep/60">
                  {acceptedOrders.length > 0
                    ? `${acceptedItems.length} ${
                        acceptedItems.length === 1 ? "Item" : "Items"
                      }`
                    : "No accepted items"}
                </p>
              </div>

              {acceptedOrders.length > 0 ? (
                <span className="inline-flex items-center rounded-full bg-forest/15 border border-forest/30 px-2.5 py-0.5 text-[10px] font-bold text-forest uppercase tracking-wider">
                  Accepted
                </span>
              ) : null}
            </div>

            {/* Continuous Accepted Items List or Empty State */}
            {acceptedItems.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-cream-warm/70 text-xs text-charcoal-deep/50 border border-stone/30">
                  📋
                </div>
                <p className="text-xs font-semibold text-charcoal-deep/70">
                  No accepted items yet
                </p>
                <p className="mt-1 text-[11px] text-charcoal-deep/50 leading-relaxed">
                  Items will appear here once an order is accepted.
                </p>
              </div>
            ) : (
              <div className="py-1 space-y-2 max-h-[540px] overflow-y-auto pr-1">
                {acceptedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start justify-between gap-2 text-xs py-1"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-charcoal-deep font-serif text-xs sm:text-sm">
                        {item.quantity}×{" "}
                      </span>
                      <span className="text-charcoal-deep/90 font-medium leading-snug">
                        {item.item_name_snapshot}
                      </span>
                    </div>

                    <span className="font-semibold text-charcoal-deep/75 font-mono text-[11px] shrink-0">
                      {formatPrice(item.line_total_minor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Items Summary Total at the bottom (if orders accepted) */}
          {acceptedOrders.length > 0 ? (
            <div className="mt-4 pt-3 border-t border-stone/30 flex items-center justify-between text-xs">
              <span className="text-charcoal-deep/60 font-semibold uppercase tracking-wider text-[10px]">
                Accepted Total
              </span>
              <span className="font-extrabold font-serif text-sm text-charcoal-deep">
                {formatPrice(acceptedTotalMinor)}
              </span>
            </div>
          ) : null}
        </aside>

        {/* Right Side: Orders waiting for staff action */}
        <div className="flex-1 min-w-0 w-full">
          {pendingOrders.length === 0 ? (
            <div className="flex min-h-[160px] sm:min-h-[180px] h-full items-center justify-center rounded-2xl border border-dashed border-stone/40 bg-white/40 p-6 text-center">
              <div className="text-center">
                <p className="text-xs font-semibold text-charcoal-deep/60">
                  No pending orders waiting for action
                </p>
                <p className="mt-1 text-[11px] text-charcoal-deep/40">
                  New orders from this table will appear here
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto scroll-smooth py-2 px-1 focus:outline-none"
              style={{
                scrollbarWidth: "thin",
                scrollSnapType: "x proximity",
              }}
            >
              {pendingOrders.map((order) => (
                <div key={order.id} style={{ scrollSnapAlign: "start" }}>
                  <StaffOrderCard
                    order={order}
                    onAdvance={onAcceptOrder}
                    onComplete={onCompleteOrder}
                    onDeleteItem={onDeleteItem}
                    busy={busyOrderId === order.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
