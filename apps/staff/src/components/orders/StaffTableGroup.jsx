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

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

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
  }, [orders, checkScroll]);

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

      {/* Horizontally Scrollable Order Cards Row */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth py-2 px-1 focus:outline-none"
        style={{
          scrollbarWidth: "thin",
          scrollSnapType: "x proximity",
        }}
      >
        {orders.map((order) => (
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
    </section>
  );
}
