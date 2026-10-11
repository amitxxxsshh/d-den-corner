"use client";

import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import CustomerHeader from "../customer/CustomerHeader";
import { useCustomerSession } from "../customer/CustomerSessionContext";
import { joinTableWithQRToken } from "../../lib/qr";
import CinematicIntro from "../intro/CinematicIntro";

function subscribeReducedMotion(callback) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  } else if (typeof query.addListener === "function") {
    query.addListener(callback);
    return () => query.removeListener(callback);
  }
  return () => {};
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function MenuJoin({ token, onDismiss }) {
  const router = useRouter();
  const { refreshSession, setSessionData } = useCustomerSession();

  const [connectionStatus, setConnectionStatus] = useState(() =>
    token ? "joining" : "error",
  );

  const [errorMessage, setErrorMessage] = useState(() =>
    token
      ? ""
      : "No ordering link was provided. Please use the ordering link for your table.",
  );

  const [introState, setIntroState] = useState("playing"); // 'playing' | 'done' | 'skipped' | 'fallback'
  const [retryKey, setRetryKey] = useState(0);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const navigatedRef = useRef(false);
  const activeRequestIdRef = useRef(0);
  const fallbackOverlayRef = useRef(null);

  // Clean URL and complete transition into menu
  const performNavigation = useCallback(() => {
    if (navigatedRef.current) {
      return;
    }
    navigatedRef.current = true;

    /*
     * Remove the secret token from the
     * visible URL and browser history.
     */
    window.history.replaceState(
      {},
      "",
      window.location.pathname,
    );

    if (onDismiss) {
      onDismiss();
    }
    router.replace("/menu");
  }, [onDismiss, router]);

  // Concurrent table connection in background
  useEffect(() => {
    if (!token) {
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    let isCancelled = false;

    async function joinTable() {
      try {
        setConnectionStatus("joining");

        const result = await joinTableWithQRToken(token);

        if (isCancelled || currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        /*
         * Hydrate the global customer session context immediately
         * from the join response to avoid waiting on an extra network roundtrip.
         */
        if (result?.session && setSessionData) {
          setSessionData(result.session);
        }

        /*
         * Refresh the existing global customer session in background
         * to sync any extra context from /api/sessions/me.
         */
        await refreshSession().catch(() => {});

        if (isCancelled || currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        setConnectionStatus("success");
      } catch (error) {
        if (isCancelled || currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        setConnectionStatus("error");
        setErrorMessage(
          error?.message ||
            "We could not connect you to this table. Please use the ordering link for your table again.",
        );
      }
    }

    joinTable();

    return () => {
      isCancelled = true;
    };
  }, [token, refreshSession, setSessionData, retryKey]);

  // Watchdog timeout to prevent indefinite waiting if network hangs
  useEffect(() => {
    if (connectionStatus !== "joining") {
      return;
    }

    const timeoutId = setTimeout(() => {
      setConnectionStatus("error");
      setErrorMessage(
        "Connecting to your table timed out. Please check your connection and try again.",
      );
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [connectionStatus, retryKey]);

  // Reset and reconnect when retrying
  const handleRetry = useCallback(() => {
    setIntroState("skipped");
    setConnectionStatus("joining");
    setErrorMessage("");
    setRetryKey((prev) => prev + 1);
  }, []);

  // When reducedMotion is active or intro was bypassed/fallback, coordinate transition directly
  useEffect(() => {
    if (connectionStatus !== "success") {
      return;
    }

    const isIntroBypassed =
      reducedMotion ||
      introState === "skipped" ||
      introState === "fallback";

    if (isIntroBypassed) {
      if (fallbackOverlayRef.current) {
        gsap.to(fallbackOverlayRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: performNavigation,
        });
      } else {
        performNavigation();
      }
    }
  }, [connectionStatus, reducedMotion, introState, performNavigation]);

  // Cleanup tweens on unmount
  useEffect(() => {
    const fallbackEl = fallbackOverlayRef.current;
    return () => {
      if (fallbackEl) {
        gsap.killTweensOf(fallbackEl);
      }
    };
  }, []);

  // Connection failure UI (takes immediate priority over intro)
  if (connectionStatus === "error") {
    return (
      <main className="fixed inset-0 z-50 overflow-y-auto bg-charcoal-deep flex flex-col justify-between px-4 py-8 text-cream-soft">
        <CustomerHeader subtitle="CONNECT TABLE" />

        <div className="mx-auto my-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-terracotta/30 bg-cream-soft p-6 sm:p-8 text-center text-charcoal-deep shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta/15 text-terracotta">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
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
                onClick={handleRetry}
                className="w-full rounded-xl bg-charcoal-deep py-3 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition cursor-pointer"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => {
                  window.history.replaceState(
                    {},
                    "",
                    window.location.pathname,
                  );
                  if (onDismiss) {
                    onDismiss();
                  }
                  router.replace("/menu");
                }}
                className="w-full rounded-xl border border-stone/60 bg-transparent py-2.5 text-xs font-semibold text-charcoal-deep hover:bg-stone/20 transition cursor-pointer"
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

  // Intro completed and dissolved; menu is active underneath
  if (introState === "done") {
    return null;
  }

  // Cinematic Intro View (Standard QR flow)
  if (!reducedMotion && introState === "playing") {
    return (
      <CinematicIntro
        isConnected={connectionStatus === "success"}
        onComplete={() => {
          setIntroState("done");
          performNavigation();
        }}
        onSkip={() => {
          setIntroState("skipped");
          if (connectionStatus === "success") {
            performNavigation();
          }
        }}
        onFallback={() => {
          setIntroState("fallback");
          if (connectionStatus === "success") {
            performNavigation();
          }
        }}
      />
    );
  }

  // Quiet fallback overlay shown ONLY while waiting for connection if intro was skipped, bypassed, or reduced motion
  return (
    <main
      ref={fallbackOverlayRef}
      className="fixed inset-0 z-50 bg-charcoal-deep flex flex-col justify-between px-4 py-8 text-cream-soft"
    >
      <CustomerHeader subtitle="MENU" />

      <div className="mx-auto my-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-charcoal-green/40 border border-amber-warm/30 px-4 py-2 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-amber-warm animate-ping" />
          <span className="text-xs font-medium text-cream-warm tracking-wide">
            Finalizing table connection...
          </span>
        </div>
      </div>

      <div className="checker-strip-subtle opacity-20" />
    </main>
  );
}