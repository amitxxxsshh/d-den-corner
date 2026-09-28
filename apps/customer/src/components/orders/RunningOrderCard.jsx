"use client";

import Link from "next/link";
import { getOrderStatusLabel } from "../../lib/order-status";
import { formatCartPrice } from "../../lib/cart";

function getStatusBadgeStyle(status) {
  switch (status) {
    case "SERVED":
      return "bg-forest/15 text-forest border-forest/30";
    case "READY":
      return "bg-amber-warm/20 text-charcoal-deep border-amber-warm/50 font-bold";
    case "PREPARING":
    case "ACCEPTED":
    case "NEW":
      return "bg-amber-warm/20 text-amber-gold border-amber-warm/40";
    default:
      return "bg-stone/30 text-charcoal-deep/70 border-stone/50";
  }
}

export default function RunningOrderCard({
  order,
}) {
  if (!order) {
    return null;
  }

  const badgeStyle = getStatusBadgeStyle(order.status);
  const statusLabel = getOrderStatusLabel(order.status);

  return (
    <Link
      href={`/orders/${encodeURIComponent(order.id)}`}
      className="group block overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-amber-warm/40 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-charcoal-deep/50 text-[10px] font-bold uppercase tracking-wider">
            <span>Order</span>
            <span>·</span>
            <span>Table Order</span>
          </div>

          <h3 className="mt-1 text-xl font-bold font-serif text-charcoal-deep tracking-tight group-hover:text-amber-gold transition">
            #{order.id.slice(0, 8)}
          </h3>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badgeStyle}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stone/30 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-deep/50">
            Total Amount
          </p>
          <p className="text-base font-extrabold text-charcoal-deep">
            {formatCartPrice(order.total_amount_minor)}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-gold group-hover:text-amber-warm transition">
          <span>Track Order</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}