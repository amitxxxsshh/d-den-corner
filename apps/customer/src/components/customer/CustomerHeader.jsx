"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DDenLogo } from "./Icons";
import TableBadge from "./TableBadge";
import { useCart } from "../cart/CartContext";

export default function CustomerHeader({
  title = "D Den Corner",
  subtitle = "",
  rightContent = null,
}) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const isMenu = pathname === "/menu";
  const isOrders = pathname?.startsWith("/orders");

  // Track header height for pixel-perfect floating popup attachment
  useEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Automatically close floating popup when pathname changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  // Handle ESC key and outside pointer events
  useEffect(() => {
    if (!drawerOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    function handlePointerDown(event) {
      if (hamburgerRef.current && hamburgerRef.current.contains(event.target)) {
        return;
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [drawerOpen]);

  // Close drawer if window is resized to desktop width
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setDrawerOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-white/10 shadow-sm transition-all"
      >
        <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* LEFT SIDE: Brand group on desktop, Hamburger + Brand group on mobile */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
              {/* Mobile Hamburger Button (Far Left on mobile, hidden on md+) */}
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setDrawerOpen((prev) => !prev)}
                aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={drawerOpen}
                aria-controls="customer-navigation-menu"
                className={`hamburger hamburger--elastic md:!hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-charcoal-deep/90 border border-amber-warm/40 text-amber-light shadow-xs shadow-amber-warm/15 ring-1 ring-amber-warm/20 hover:border-amber-warm/70 hover:ring-amber-warm/40 hover:bg-charcoal-green focus-visible:ring-2 focus-visible:ring-amber-warm focus-visible:outline-none transition-all shrink-0 ${
                  drawerOpen ? "is-active ring-2 ring-amber-warm/40 border-amber-warm/80 bg-charcoal-green" : ""
                }`}
              >
                <span className="hamburger-box">
                  <span className="hamburger-inner" />
                </span>
              </button>

              {/* Brand Logo & Name Cohesive Unit */}
              <Link
                href="/"
                className="group flex items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-90 min-w-0 shrink-0"
              >
                <DDenLogo
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  subtitle={subtitle || "ROOFTOP CAFÉ"}
                />
              </Link>
            </div>

            {/* RIGHT SIDE (DESKTOP): Navigation Links + Actions */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6 shrink-0">
              <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Customer Navigation">
                <Link
                  href="/menu"
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isMenu
                      ? "text-amber-light font-semibold bg-charcoal-black/40 shadow-xs border border-white/10"
                      : "text-stone hover:text-cream-soft hover:bg-white/5"
                  }`}
                >
                  Menu
                  {isMenu && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-warm" />
                  )}
                </Link>

                <Link
                  href="/orders"
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isOrders
                      ? "text-amber-light font-semibold bg-charcoal-black/40 shadow-xs border border-white/10"
                      : "text-stone hover:text-cream-soft hover:bg-white/5"
                  }`}
                >
                  Orders
                  {isOrders && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-warm" />
                  )}
                </Link>
              </nav>

              {/* Right Action / Table Status */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {rightContent ? (
                  rightContent
                ) : (
                  <TableBadge />
                )}
              </div>
            </div>

            {/* RIGHT SIDE (MOBILE): Compact controls only */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {rightContent ? (
                rightContent
              ) : (
                <TableBadge />
              )}
            </div>
          </div>
        </div>

        {/* Subtle Black-and-Cream Geometric Checker Accent Line */}
        <div className="checker-strip-subtle opacity-25 w-full" />
      </header>

      {/* MOBILE FLOATING NAVIGATION MENU (Rendered outside header to float freely) */}
      {/* Invisible Outside-Click Overlay (Closes popup when clicking outside; no dark backdrop) */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-transparent md:hidden transition-none ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      />

      {/* Small Floating Mobile Navigation Popup Attached Underneath Hamburger */}
      <div
        id="customer-navigation-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="false"
        aria-label="Mobile Navigation Menu"
        style={{ top: headerHeight ? `${headerHeight + 6}px` : undefined }}
        className={`mobile-floating-menu fixed top-[66px] left-4 z-50 w-56 max-w-[calc(100vw-2rem)] md:hidden rounded-2xl border border-amber-warm/35 bg-charcoal-deep/95 backdrop-blur-md p-2 shadow-2xl shadow-charcoal-black/90 ring-1 ring-amber-warm/20 ${
          drawerOpen
            ? "mobile-floating-menu--open"
            : "mobile-floating-menu--closed"
        }`}
      >
        <nav className="flex flex-col space-y-1" aria-label="Customer Mobile Navigation">
          {/* Home */}
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className={`mobile-menu-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              pathname === "/"
                ? "bg-amber-warm text-charcoal-black font-bold shadow-xs"
                : "text-stone hover:text-cream-soft hover:bg-charcoal-green/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className={`h-4 w-4 ${pathname === "/" ? "text-charcoal-black" : "text-amber-light"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </div>
            {pathname === "/" && <span className="text-[10px] font-black">●</span>}
          </Link>

          {/* Menu */}
          <Link
            href="/menu"
            onClick={() => setDrawerOpen(false)}
            className={`mobile-menu-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isMenu
                ? "bg-amber-warm text-charcoal-black font-bold shadow-xs"
                : "text-stone hover:text-cream-soft hover:bg-charcoal-green/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className={`h-4 w-4 ${isMenu ? "text-charcoal-black" : "text-amber-light"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Menu</span>
            </div>
            {isMenu && <span className="text-[10px] font-black">●</span>}
          </Link>

          {/* My Cart */}
          <Link
            href="/menu"
            onClick={() => setDrawerOpen(false)}
            className="mobile-menu-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone hover:text-cream-soft hover:bg-charcoal-green/70 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <svg
                className="h-4 w-4 text-amber-light"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>My Cart</span>
            </div>
            {itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-warm px-1.5 text-[10px] font-black text-charcoal-black shadow-xs">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link
            href="/orders"
            onClick={() => setDrawerOpen(false)}
            className={`mobile-menu-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isOrders
                ? "bg-amber-warm text-charcoal-black font-bold shadow-xs"
                : "text-stone hover:text-cream-soft hover:bg-charcoal-green/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg
                className={`h-4 w-4 ${isOrders ? "text-charcoal-black" : "text-amber-light"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Orders</span>
            </div>
            {isOrders && <span className="text-[10px] font-black">●</span>}
          </Link>
        </nav>
      </div>
    </>
  );
}