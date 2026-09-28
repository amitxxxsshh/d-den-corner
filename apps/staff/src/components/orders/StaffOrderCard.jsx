"use client";

function formatPrice(priceMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(priceMinor || 0) / 100);
}

const NEXT_LABEL = {
  NEW: "Accept Order",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Mark Served",
  SERVED: null,
};

function getStatusStyle(status) {
  switch (status) {
    case "NEW":
      return "bg-amber-warm/15 text-amber-gold border-amber-warm/40 font-bold";
    case "ACCEPTED":
      return "bg-amber-warm/25 text-charcoal-deep border-amber-warm/50 font-bold";
    case "PREPARING":
      return "bg-charcoal-deep text-amber-light border-amber-warm/30 font-bold";
    case "READY":
      return "bg-forest/15 text-forest border-forest/40 font-extrabold";
    case "SERVED":
      return "bg-green-muted/20 text-forest border-green-muted/30 font-semibold";
    default:
      return "bg-stone/30 text-charcoal-deep/70 border-stone/50";
  }
}

export default function StaffOrderCard({
  order,
  onAdvance,
  busy,
}) {
  const nextLabel = NEXT_LABEL[order.status];
  const statusStyle = getStatusStyle(order.status);

  const orderTime =
    order.created_at || order.createdAt
      ? new Date(order.created_at || order.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-stone/50 bg-white p-4 sm:p-5 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md">
      {/* Order Header: Order # + Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50">
            <span>Order</span>
            {orderTime ? (
              <>
                <span>·</span>
                <span>{orderTime}</span>
              </>
            ) : null}
          </div>

          <h3 className="mt-0.5 text-lg font-bold font-serif text-charcoal-deep tracking-tight">
            #{order.id.slice(0, 8)}
          </h3>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider ${statusStyle}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {order.status}
        </span>
      </div>

      {/* Table Badge */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl border border-stone/40 bg-cream-warm/30 px-3.5 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-deep/60">
          Table
        </span>

        <span className="text-xs sm:text-sm font-extrabold text-charcoal-deep font-serif">
          {order.table?.name || "Unassigned Table"}
        </span>
      </div>

      {/* Items Breakdown */}
      <div className="mt-3.5 space-y-2 border-t border-stone/30 pt-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-2.5 text-xs"
          >
            <div className="min-w-0 flex-1">
              <span className="font-bold text-charcoal-deep">
                {item.quantity}×{" "}
              </span>
              <span className="text-charcoal-deep/85 font-medium">
                {item.item_name_snapshot}
              </span>
            </div>

            <span className="shrink-0 font-semibold text-charcoal-deep/70">
              {formatPrice(item.line_total_minor)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Total & Advance Action Button */}
      <div className="mt-4 flex items-center justify-between border-t border-stone/30 pt-3.5">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-medium block">
            Total
          </span>
          <span className="text-base font-extrabold text-charcoal-deep">
            {formatPrice(order.total_amount_minor)}
          </span>
        </div>

        {nextLabel ? (
          <button
            type="button"
            onClick={() => onAdvance(order.id)}
            disabled={busy}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-bold text-amber-light hover:bg-charcoal-green transition active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-amber-light border-t-transparent" />
                <span>Updating...</span>
              </span>
            ) : (
              nextLabel
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-forest">
            <span>✓</span>
            <span>Completed</span>
          </span>
        )}
      </div>
    </article>
  );
}