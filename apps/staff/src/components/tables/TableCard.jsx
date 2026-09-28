"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TableCard({
  table,
  generatedQR,
  busy,
  onOpen,
  onClose,
  onGenerateQR,
}) {
  const [copied, setCopied] = useState(false);

  const isOpen = Boolean(table.activeSession);
  const hasQR = Boolean(table.qr);
  const qrIsActive = Boolean(table.qr?.active);

  function handleCopy(url) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handlePrintQR() {
    window.print();
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Table Header: Name + Open/Closed Badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50 block">
              D Den Corner Table
            </span>

            <h2 className="mt-0.5 text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
              {table.name}
            </h2>
          </div>

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

        {/* Ordering Link Association Status */}
        <div className="mt-3.5 rounded-2xl border border-stone/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-charcoal-deep">
                Ordering Link
              </p>
              <p className="mt-0.5 text-[11px] text-charcoal-deep/60">
                {hasQR
                  ? qrIsActive
                    ? "Active and accepting orders"
                    : "Assigned (activates when table is opened)"
                  : "No ordering link assigned"}
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

          {table.qr?.createdAt ? (
            <p className="mt-2 text-[10px] text-charcoal-deep/40">
              Assigned {new Date(table.qr.createdAt).toLocaleDateString()}
            </p>
          ) : null}
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
                : "Assign Ordering Link First"}
          </button>
        )}

        {/* Generate / Replace QR Link Action */}
        <button
          type="button"
          disabled={busy}
          onClick={() => onGenerateQR(table.id)}
          className="w-full min-h-[40px] rounded-xl border border-amber-warm/40 bg-amber-warm/10 py-2 text-xs font-bold text-charcoal-deep hover:bg-amber-warm/20 transition disabled:opacity-50"
        >
          {hasQR ? "Replace Ordering Link" : "Create Ordering Link"}
        </button>

        {/* Generated QR Container (High contrast, clean white surface, scannable) */}
        {generatedQR ? (
          <div className="mt-4 rounded-2xl border-2 border-amber-warm/40 bg-white p-5 text-center shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone/30">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-gold">
                Table QR Code
              </span>
              <span className="text-xs font-bold font-serif text-charcoal-deep">
                {table.name}
              </span>
            </div>

            {/* QR Container with Sufficient Quiet Zone */}
            <div className="mx-auto my-3 flex items-center justify-center rounded-2xl bg-white p-4 border border-stone/30 shadow-xs w-fit">
              <QRCodeSVG
                value={generatedQR.url}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>

            <p className="text-[11px] font-bold text-charcoal-deep">
              Scannable Table Ordering Link
            </p>

            <p className="mt-1 break-all rounded-xl bg-cream-warm/40 border border-stone/30 p-2 text-[10px] font-mono text-charcoal-deep/80 select-all">
              {generatedQR.url}
            </p>

            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={() => handleCopy(generatedQR.url)}
                className="flex-1 rounded-xl bg-charcoal-deep py-2.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(generatedQR.url, "_blank", "noopener,noreferrer")
                }
                className="flex-1 rounded-xl border border-stone/50 bg-white py-2.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition"
              >
                Test Link
              </button>

              <button
                type="button"
                onClick={handlePrintQR}
                className="rounded-xl border border-stone/50 bg-white px-3 py-2.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition"
                title="Print QR code"
              >
                Print
              </button>
            </div>

            <p className="mt-2.5 text-[10px] text-charcoal-deep/50 leading-tight">
              Secret token generated. Keep this link permanently associated with {table.name}.
            </p>
          </div>
        ) : hasQR ? (
          <p className="text-center text-[10px] text-charcoal-deep/50 pt-1">
            Ordering link is permanently active for this table.
          </p>
        ) : null}
      </div>
    </article>
  );
}