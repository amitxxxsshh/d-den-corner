"use client";

function formatPrice(priceMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(priceMinor || 0) / 100);
}

function formatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * StaffTableGroup component
 *
 * Implements SINGLE ACTIVE ORDER PER TABLE:
 * Displays Order ID only ONCE at the beginning.
 * Renders all items as a single continuous list of menu rows.
 * Displays exactly ONE order subtotal at the bottom.
 * No second Order ID, no second order card, no second order block,
 * no separate subtotal, no separate visual section.
 */
export default function StaffTableGroup({
  group,
  onAcceptOrder,
  onCompleteOrder,
  busyOrderId,
}) {
  const { tableName, orders = [] } = group;

  if (!orders || orders.length === 0) {
    return null;
  }

  // Exactly one active order session per table
  const primaryOrder = orders[0];

  // Flatten all items across the table session into one continuous item list
  const allItems = orders.flatMap((o) => o.items || []);

  // Compute table total
  const totalAmountMinor = orders.reduce(
    (sum, o) => sum + Number(o.total_amount_minor || 0),
    0,
  );

  const hasNew = orders.some((o) => o.status === "NEW");
  const isAccepted = !hasNew && orders.every((o) => o.status === "ACCEPTED");

  const isBusy = busyOrderId === primaryOrder.id;

  return (
    <article className="w-full overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md">
      {/* ============================================================ */}
      {/* ORDER HEADER — Order ID displayed ONCE at the top             */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-stone/30 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-xs text-charcoal-deep/70 tracking-wider">
              Order #{primaryOrder.id.slice(0, 8)}
            </span>
            <span className="text-charcoal-deep/30">•</span>
            <span className="text-xs text-charcoal-deep/60">
              {primaryOrder.accepted_at
                ? `Accepted ${formatTime(primaryOrder.accepted_at)}`
                : `Received ${formatTime(primaryOrder.created_at)}`}
            </span>
          </div>

          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold font-serif text-charcoal-deep tracking-tight">
            {tableName}
          </h2>
        </div>

        {/* Status Badge */}
        <div>
          {hasNew ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-warm/50 bg-amber-warm/20 px-3.5 py-1 text-xs font-bold text-amber-gold uppercase tracking-wider animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-warm" />
              <span>NEW</span>
            </span>
          ) : isAccepted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/15 px-3.5 py-1 text-xs font-bold text-forest uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-forest" />
              <span>ACCEPTED</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ORDER ITEMS — Single continuous list without separate blocks */}
      {/* ============================================================ */}
      <div className="py-4 space-y-2.5">
        {allItems.map((item, index) => (
          <div
            key={item.id || index}
            className="flex items-baseline justify-between gap-3 text-sm py-0.5"
          >
            <div className="min-w-0 flex-1">
              <span className="font-bold text-charcoal-deep text-base font-serif">
                {item.quantity}×{" "}
              </span>
              <span className="text-charcoal-deep font-medium">
                {item.item_name_snapshot}
              </span>
            </div>
            <span className="shrink-0 font-semibold text-charcoal-deep/80 font-mono text-xs">
              {formatPrice(item.line_total_minor)}
            </span>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ORDER SUBTOTAL & ACTIONS                                      */}
      {/* ============================================================ */}
      <div className="pt-4 border-t border-stone/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/60 block">
            ORDER SUBTOTAL
          </span>
          <span className="text-xl sm:text-2xl font-black font-serif text-charcoal-deep tracking-tight">
            {formatPrice(totalAmountMinor)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {hasNew ? (
            <button
              type="button"
              onClick={() => onAcceptOrder(primaryOrder.id)}
              disabled={isBusy}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-charcoal-deep px-6 py-2.5 text-xs font-bold text-amber-light hover:bg-charcoal-green transition active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-light border-t-transparent" />
                  <span>Accepting Order...</span>
                </span>
              ) : (
                "Accept Order"
              )}
            </button>
          ) : isAccepted ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/15 px-3 py-1.5 text-xs font-bold text-forest uppercase tracking-wider">
                <span>✓</span>
                <span>Accepted</span>
              </span>

              {onCompleteOrder ? (
                <button
                  type="button"
                  onClick={() => onCompleteOrder(primaryOrder.id)}
                  disabled={isBusy}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-stone/60 bg-cream-warm/40 px-4 py-2 text-xs font-bold text-charcoal-deep hover:bg-stone/30 transition active:scale-95 shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                  title="Complete this order and move it to Order History"
                >
                  {isBusy ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-charcoal-deep border-t-transparent" />
                      <span>Completing...</span>
                    </span>
                  ) : (
                    "Complete Order"
                  )}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
