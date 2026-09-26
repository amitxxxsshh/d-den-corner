"use client";

function formatPrice(priceMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(priceMinor || 0) / 100);
}

const NEXT_LABEL = {
  NEW: "Accept Order",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Mark Served",
  SERVED: null,
};

export default function StaffOrderCard({
  order,
  onAdvance,
  busy,
}) {
  const nextLabel = NEXT_LABEL[order.status];

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Order
          </p>

          <h2 className="mt-1 text-lg font-semibold text-zinc-950">
            #{order.id.slice(0, 8)}
          </h2>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
          {order.status}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-50 p-3">
        <p className="text-sm font-semibold text-zinc-900">
          Table
        </p>

        <p className="mt-1 text-sm text-zinc-600">
          {order.table?.name || "Unknown table"}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <span className="font-medium text-zinc-900">
                {item.quantity} × {item.item_name_snapshot}
              </span>
            </div>

            <span className="shrink-0 text-zinc-600">
              {formatPrice(item.line_total_minor)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
        <span className="font-semibold text-zinc-950">
          {formatPrice(order.total_amount_minor)}
        </span>

        {nextLabel ? (
          <button
            type="button"
            onClick={() => onAdvance(order.id)}
            disabled={busy}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Updating..." : nextLabel}
          </button>
        ) : (
          <span className="text-sm font-medium text-zinc-500">
            Completed
          </span>
        )}
      </div>
    </article>
  );
}