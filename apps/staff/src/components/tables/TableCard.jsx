"use client";

import { useState } from "react";

export function TableCard({
  table,
  busy,
  onOpen,
  onClose,
  onDelete,
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOpen = Boolean(table.activeSession);
  const hasQR = Boolean(table.qr);
  const qrIsActive = Boolean(table.qr?.active);
  const orderingUrl = table.orderingUrl || table.qr?.url || "";

  async function handleCopy() {
    if (!orderingUrl) return;
    try {
      await navigator.clipboard.writeText(orderingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy ordering link:", err);
    }
  }

  async function handleDeleteClick() {
    if (busy || deleting) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${table.name}? This will permanently remove the table and its ordering link.`
    );
    if (!confirmed) return;

    if (typeof onDelete === "function") {
      try {
        setDeleting(true);
        await onDelete(table.id);
      } finally {
        setDeleting(false);
      }
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Table Header: Name + Delete Icon + Open/Closed Badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50 block">
              D Den Corner Table
            </span>

            <h2 className="mt-0.5 text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
              {table.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={busy || deleting}
              onClick={handleDeleteClick}
              aria-label={`Delete ${table.name}`}
              className="inline-flex items-center justify-center p-1 rounded-lg text-charcoal-deep/40 hover:text-terracotta hover:bg-terracotta/10 transition-colors disabled:opacity-40"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${
                isOpen
                  ? "bg-forest/15 text-forest border-forest/40"
                  : "bg-stone/30 text-charcoal-deep/60 border-stone/50"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
        </div>

        {/* Active Session Status */}
        <div className="mt-4 rounded-2xl border border-stone/30 bg-cream-warm/30 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50">
              Session Status
            </span>
            {isOpen && (
              <span className="text-[10px] font-semibold text-forest">
                Accepting Orders
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-medium text-charcoal-deep/80">
            {isOpen
              ? `Started ${new Date(
                  table.activeSession.started_at,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })} (${new Date(
                  table.activeSession.started_at,
                ).toLocaleDateString()})`
              : "No active session currently running"}
          </p>
        </div>

        {/* Ordering Link Status */}
        <div className="mt-3.5 rounded-2xl border border-stone/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-charcoal-deep">
                Ordering Link Status
              </p>
              <p className="mt-0.5 text-[11px] text-charcoal-deep/60">
                {hasQR
                  ? qrIsActive
                    ? "Active and accepting orders"
                    : "Configured (activates when table is opened)"
                  : "No ordering link configured"}
              </p>
            </div>

            {hasQR ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                  qrIsActive
                    ? "bg-forest/15 text-forest border-forest/30"
                    : "bg-stone/20 text-charcoal-deep/50 border-stone/40"
                }`}
              >
                {qrIsActive ? "ACTIVE" : "INACTIVE"}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2.5 pt-3 border-t border-stone/30">
        {/* Open / Close Table Action */}
        {isOpen ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onClose(table.id)}
            className="w-full min-h-[44px] rounded-xl border border-stone/50 bg-white py-2.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition disabled:opacity-50"
          >
            {busy ? "Closing table..." : "Close Table Session"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !hasQR}
            onClick={() => onOpen(table.id)}
            className="w-full min-h-[44px] rounded-xl bg-charcoal-deep py-2.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition disabled:cursor-not-allowed disabled:bg-stone/40 disabled:text-charcoal-deep/40 shadow-sm"
          >
            {busy
              ? "Opening table..."
              : hasQR
                ? "Open Table Session"
                : "No Ordering Link Configured"}
          </button>
        )}

        {/* Existing Permanent Ordering Link + Copy */}
        {orderingUrl ? (
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <span
              className="truncate text-[11px] font-mono text-charcoal-deep/60 select-all"
              title={orderingUrl}
            >
              {orderingUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 text-xs font-bold text-charcoal-deep hover:text-forest transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default TableCard;