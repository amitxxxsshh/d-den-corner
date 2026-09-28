"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CustomerHeader from "../customer/CustomerHeader";
import { DDenLogo, BotanicalAccent, SunflowerMotif } from "../customer/Icons";
import { useCustomerSession } from "../customer/CustomerSessionContext";
import { joinTableWithQRToken } from "../../lib/qr";

export default function MenuJoin({ token }) {
  const router = useRouter();

  const {
    refreshSession,
  } = useCustomerSession();

  const [status, setStatus] =
    useState("joining");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");

      setErrorMessage(
        "No ordering link was provided. Please use the ordering link for your table.",
      );

      return;
    }

    let cancelled = false;

    async function joinTable() {
      try {
        setStatus("joining");

        await joinTableWithQRToken(token);

        if (cancelled) {
          return;
        }

        /*
         * Refresh the existing global customer
         * session so /menu immediately enters
         * ordering mode.
         */
        await refreshSession();

        if (cancelled) {
          return;
        }

        /*
         * Remove the secret token from the
         * visible URL and browser history.
         */
        window.history.replaceState(
          {},
          "",
          window.location.pathname,
        );

        router.replace("/menu");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");

        setErrorMessage(
          error?.message ||
            "We could not connect you to this table. Please use the ordering link for your table again.",
        );
      }
    }

    joinTable();

    return () => {
      cancelled = true;
    };
  }, [
    router,
    token,
    refreshSession,
  ]);

  if (status === "error") {
    return (
      <main className="min-h-screen bg-charcoal-deep flex flex-col justify-between px-4 py-8 text-cream-soft">
        <CustomerHeader subtitle="CONNECT TABLE" />

        <div className="mx-auto my-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-terracotta/30 bg-cream-soft p-6 sm:p-8 text-center text-charcoal-deep shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta/15 text-terracotta">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>

            <h1 className="mt-5 text-xl font-bold font-serif text-charcoal-deep">
              Unable to Connect to Table
            </h1>

            <p className="mt-3 text-xs leading-relaxed text-charcoal-deep/75">
              {errorMessage}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-xl bg-charcoal-deep py-3 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => router.replace("/menu")}
                className="w-full rounded-xl border border-stone/60 bg-transparent py-2.5 text-xs font-semibold text-charcoal-deep hover:bg-stone/20 transition"
              >
                View Menu Without Seating
              </button>
            </div>
          </div>
        </div>

        <div className="checker-strip-subtle opacity-20" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-charcoal-deep flex flex-col justify-between px-4 py-8 text-cream-soft">
      <CustomerHeader subtitle="CONNECTING" />

      {/* Atmospheric Table Join Card */}
      <div className="relative mx-auto my-auto w-full max-w-md">
        {/* Warm amber architectural glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-48 w-64 rounded-full bg-amber-warm/20 blur-2xl" />

        <div className="relative overflow-hidden rounded-3xl border border-amber-warm/30 bg-cream-soft p-6 sm:p-8 text-center text-charcoal-deep shadow-2xl">
          {/* Subtle top checker accent */}
          <div className="checker-strip-subtle opacity-30 -mx-8 -mt-8 mb-6 h-1.5" />

          {/* D Den Corner Arch & Lantern Emblem */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal-deep border border-amber-warm/40 p-3 shadow-md">
            <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 28V14C6 8.47715 10.4772 4 16 4C21.5228 4 26 8.47715 26 14V28" stroke="#D89A3A" strokeWidth="2" strokeLinecap="round" />
              <line x1="4" y1="28" x2="28" y2="28" stroke="#D89A3A" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="4" x2="16" y2="12" stroke="#E8B85C" strokeWidth="1.5" strokeDasharray="1 1.5" />
              <circle cx="16" cy="14" r="4" fill="#D89A3A" />
              <circle cx="16" cy="14" r="2" fill="#F7F1E5" />
              <path d="M12 24C12 21 16 19 16 19C16 19 20 21 20 24Z" fill="#304A35" />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-warm animate-ping" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-gold">
              D Den Corner Rooftop
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold font-serif text-charcoal-deep">
            Connecting to Your Table
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-charcoal-deep/70">
            Setting up your table session and loading the live rooftop café menu...
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-forest animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-amber-warm animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-forest animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>

          <div className="mt-6 rounded-2xl bg-charcoal-green/5 border border-stone/40 p-3.5 text-left">
            <div className="flex items-center gap-2">
              <BotanicalAccent className="h-4 w-4 text-forest" />
              <span className="text-xs font-semibold text-charcoal-deep">
                Table-Side Contactless Dining
              </span>
            </div>
            <p className="mt-1 text-[11px] text-charcoal-deep/60 leading-normal">
              Browse dishes, add festival specials, customize selections, and send orders directly to our kitchen.
            </p>
          </div>
        </div>
      </div>

      <div className="checker-strip-subtle opacity-20" />
    </main>
  );
}