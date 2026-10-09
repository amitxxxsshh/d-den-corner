"use client";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";

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

/**
 * SmoothScrollProvider integrates Lenis smooth scrolling into the customer application.
 * - Sits at the root of the document without altering visual layout or native document scrolling architecture.
 * - Uses conservative, responsive settings tailored for restaurant menu navigation.
 * - Leaves touch scrolling native (`syncTouch: false`) on mobile devices to preserve capacitive 120Hz momentum.
 * - Respects `prefers-reduced-motion` by gracefully bypassing smooth scrolling for users requesting reduced motion.
 * - Honors `data-lenis-prevent` on nested containers (modals, drawers, horizontal category pill navigation).
 */
export default function SmoothScrollProvider({ children }) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Graceful fallback for reduced motion: maintain native browser scrolling
  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.0, // Crisp, natural deceleration suitable for restaurant menus
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Natural exponential ease-out
        smoothWheel: true,
        syncTouch: false, // Preserves native mobile capacitive momentum scrolling
        touchMultiplier: 1.0,
        wheelMultiplier: 1.0,
        autoResize: true,
        prevent: (node) =>
          Boolean(
            node?.hasAttribute?.("data-lenis-prevent") ||
              node?.closest?.("[data-lenis-prevent]")
          ),
      }}
    >
      {children}
    </ReactLenis>
  );
}
