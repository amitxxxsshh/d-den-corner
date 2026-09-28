"use client";

import Link from "next/link";
import { useCustomerSession } from "./CustomerSessionContext";

export default function SessionStatus() {
  const {
    session,
    status,
    error,
    refreshSession,
  } = useCustomerSession();

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-stone/40 bg-cream-soft p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone border-t-amber-warm" />
          <p className="text-sm font-medium text-charcoal-deep/70">
            Checking your table session...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-cream-soft p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-xs font-bold text-terracotta">
            !
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-charcoal-deep">
              Session Unavailable
            </p>
            <p className="mt-1 text-xs text-charcoal-deep/70">
              {error}
            </p>
            <button
              type="button"
              onClick={refreshSession}
              className="mt-3 inline-flex items-center rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-semibold text-cream-soft hover:bg-charcoal-green transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-stone/50 bg-cream-soft p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal-deep text-amber-light">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-charcoal-deep font-serif">
              Ready to Order at Your Table?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-charcoal-deep/70">
              Scan the physical QR code on your table stand to connect your session and place orders directly to the kitchen.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest-dark px-3.5 py-1.5 text-xs font-semibold text-cream-soft hover:bg-forest transition"
              >
                Browse Menu
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-forest/30 bg-cream-soft p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-dark text-amber-light">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 18v3M20 18v3M4 10h16M4 14h16M4 6h16" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-muted"></span>
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest">
                Table Session Active
              </p>
            </div>

            <h3 className="mt-1 text-lg font-bold text-charcoal-deep font-serif">
              {session?.tableName || "Your Table"}
            </h3>

            <p className="text-xs text-charcoal-deep/60">
              Orders will be served directly to this table.
            </p>
          </div>
        </div>

        <Link
          href="/menu"
          className="shrink-0 rounded-xl bg-amber-warm px-4 py-2.5 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-sm"
        >
          Open Menu
        </Link>
      </div>
    </div>
  );
}