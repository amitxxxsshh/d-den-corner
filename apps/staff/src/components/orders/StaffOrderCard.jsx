"use client";

import { useState } from "react";

function formatPrice(priceMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(priceMinor || 0) / 100);
}

function getStatusStyle(status) {
  switch (status) {
    case "NEW":
      return "bg-amber-warm/20 text-amber-gold border-amber-warm/50 font-bold animate-pulse";
    case "ACCEPTED":
      return "bg-forest/15 text-forest border-forest/30 font-bold";
    case "PREPARING":
      return "bg-charcoal-deep text-amber-light border-amber-warm/30 font-bold";
    case "READY":
      return "bg-forest/20 text-forest border-forest/40 font-extrabold";
    case "SERVED":
      return "bg-green-muted/20 text-forest border-green-muted/30 font-semibold";
    default:
      return "bg-stone/30 text-charcoal-deep/70 border-stone/50";
  }
}

export default function StaffOrderCard({
  order,
  onAdvance,
  onComplete,
  onDeleteItem,
  busy = false,
  readOnly = false,
}) {
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);

  if (!order) return null;

  const statusStyle = getStatusStyle(order.status);
  const isNew = order.status === "NEW";
  const isAccepted = order.status === "ACCEPTED";

  const orderTime =
    order.created_at || order.createdAt
      ? !isNaN(new Date(order.created_at || order.createdAt).getTime())
        ? new Date(order.created_at || order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null
      : null;

  async function handleConfirmDelete(itemId) {
    if (!onDeleteItem) return;
    try {
      setDeletingItemId(itemId);
      await onDeleteItem(order.id, itemId);
      setConfirmDeleteItemId(null);
    } catch {
      // Error handled at parent dashboard level
    } finally {
      setDeletingItemId(null);
    }
  }

  return (
    <article className="flex flex-col justify-between w-[290px] sm:w-[320px] shrink-0 rounded-2xl border border-stone/50 bg-white p-4 sm:p-5 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md">
      <div>
        {/* Order Header: Order # + Status Badge */}
        <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-stone/30">
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

            <h3 className="mt-0.5 text-base sm:text-lg font-bold font-serif text-charcoal-deep tracking-tight">
              #{order.id.slice(0, 8)}
            </h3>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] sm:text-[11px] uppercase tracking-wider ${statusStyle}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {order.status}
          </span>
        </div>

        {/* Order Line Items */}
        <div className="py-3 space-y-2.5">
          {(order.items || []).map((item) => {
            const isDeleting = deletingItemId === item.id;
            const isConfirming = confirmDeleteItemId === item.id;

            return (
              <div
                key={item.id}
                className="group/item relative rounded-lg py-1 px-1 transition-colors hover:bg-stone/10"
              >
                {isConfirming ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-terracotta/10 p-2 text-xs">
                    <span className="font-semibold text-terracotta text-[11px] truncate">
                      Remove item?
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(item.id)}
                        disabled={isDeleting}
                        className="rounded bg-terracotta px-2 py-0.5 text-[10px] font-bold text-white hover:bg-terracotta/90 transition disabled:opacity-50"
                      >
                        {isDeleting ? "..." : "Yes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteItemId(null)}
                        disabled={isDeleting}
                        className="rounded border border-stone/60 bg-white px-2 py-0.5 text-[10px] font-medium text-charcoal-deep hover:bg-stone/20 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-charcoal-deep font-serif text-sm">
                        {item.quantity}×{" "}
                      </span>
                      <span className="text-charcoal-deep/90 font-medium leading-snug">
                        {item.item_name_snapshot}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-charcoal-deep/75 font-mono text-[11px]">
                        {formatPrice(item.line_total_minor)}
                      </span>

                      {/* Small Delete Control for Unavailable Items (eligible in NEW status only) */}
                      {!readOnly && isNew && onDeleteItem ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItemId(item.id)}
                          className="opacity-60 group-hover/item:opacity-100 hover:opacity-100 text-charcoal-deep/40 hover:text-terracotta p-1 rounded transition"
                          title="Remove unavailable item from this order"
                          aria-label={`Remove ${item.item_name_snapshot}`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Total & Order Actions */}
      <div className="mt-3 border-t border-stone/30 pt-3 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-bold block">
            Order Total
          </span>
          <span className="text-base sm:text-lg font-black font-serif text-charcoal-deep">
            {formatPrice(order.total_amount_minor)}
          </span>
        </div>

        <div>
          {readOnly ? (
            order.accepted_at ? (
              <span className="text-[11px] text-charcoal-deep/60 block text-right font-mono">
                {new Date(order.accepted_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null
          ) : isNew && onAdvance ? (
            <button
              type="button"
              onClick={() => onAdvance(order.id)}
              disabled={busy}
              className="inline-flex min-h-[38px] items-center justify-center rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-bold text-amber-light hover:bg-charcoal-green transition active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-light border-t-transparent" />
                  <span>Accepting...</span>
                </span>
              ) : (
                "Accept Order"
              )}
            </button>
          ) : isAccepted ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-forest py-1 px-2 rounded-lg bg-forest/10 border border-forest/20">
                <span>✓</span>
                <span>Accepted</span>
              </span>

              {onComplete ? (
                <button
                  type="button"
                  onClick={() => onComplete(order.id)}
                  disabled={busy}
                  className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-stone/60 bg-cream-warm/40 px-3 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/30 transition active:scale-95 shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                  title="Serve and complete this order"
                >
                  {busy ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-charcoal-deep border-t-transparent" />
                  ) : (
                    "Serve"
                  )}
                </button>
              ) : null}
            </div>
          ) : (
            <span className="text-xs font-bold text-charcoal-deep/60">
              {order.status}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}