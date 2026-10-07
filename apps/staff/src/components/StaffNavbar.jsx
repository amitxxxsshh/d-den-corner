"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DDenStaffLogo } from "./StaffIcons";
import { logoutStaff } from "../lib/auth";

export default function StaffNavbar({
  staff = null,
  onRefresh = null,
  refreshLoading = false,
  onLogout = null,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }

    try {
      await logoutStaff();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", exact: false },
    { href: "/", label: "Active Orders", exact: true },
    { href: "/tables", label: "Tables & QR", exact: false },
    { href: "/menu", label: "Menu Catalogue", exact: false },
    { href: "/festivals", label: "Festival Menus", exact: false },
  ];

  function isActive(link) {
    if (link.exact) {
      return pathname === link.href;
    }
    return pathname.startsWith(link.href);
  }

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
        className="sticky top-0 z-30 bg-charcoal-deep border-b border-forest-dark/40 shadow-md"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Top Navbar Row */}
          <div className="flex min-h-[64px] items-center justify-between gap-4 py-2.5">
            {/* LEFT SIDE: Brand on desktop, Hamburger + Brand on mobile */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
              {/* Mobile Hamburger Button (Far Left on mobile, hidden on md+) */}
              <button
                type="button"
                onClick={() => setDrawerOpen((prev) => !prev)}
                aria-label={drawerOpen ? "Close staff navigation menu" : "Open staff navigation menu"}
                aria-expanded={drawerOpen}
                aria-controls="staff-navigation-menu"
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
                className="flex items-center gap-2.5 sm:gap-3 transition hover:opacity-90 min-w-0 shrink-0"
              >
                <DDenStaffLogo />
              </Link>
            </div>

            {/* RIGHT SIDE (DESKTOP): Staff Navigation Links + Staff Profile + Actions */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
              {/* Navigation Links */}
              <nav className="flex items-center gap-1 lg:gap-1.5" aria-label="Staff Navigation">
                {navLinks.map((link) => {
                  const active = isActive(link);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                        active
                          ? "text-amber-light bg-charcoal-green font-bold shadow-xs"
                          : "text-stone hover:text-cream-soft hover:bg-charcoal-green/50"
                      }`}
                    >
                      {link.label}
                      {active && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-warm" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Staff Role & Action Buttons */}
              <div className="flex items-center gap-2 lg:gap-3 shrink-0 border-l border-forest-dark/50 pl-3 lg:pl-4">
                {staff && (
                  <div className="hidden xl:flex flex-col text-right">
                    <span className="text-xs font-semibold text-cream-soft truncate max-w-[150px]">
                      {staff.email}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-gold">
                      {staff.role}
                    </span>
                  </div>
                )}

                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone/30 bg-charcoal-green/70 px-3 py-2 text-xs font-semibold text-cream-soft hover:bg-charcoal-green transition disabled:opacity-50"
                    title="Refresh operational data"
                  >
                    <svg
                      className={`h-3.5 w-3.5 text-amber-light ${refreshLoading ? "animate-spin" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="hidden lg:inline">Refresh</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-stone/30 bg-charcoal-deep px-3 py-2 text-xs font-semibold text-cream-soft hover:bg-charcoal-green transition"
                >
                  Sign out
                </button>
              </div>
            </div>

            {/* RIGHT SIDE (MOBILE): Compact action control only */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshLoading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone/30 bg-charcoal-green/70 text-cream-soft hover:bg-charcoal-green transition disabled:opacity-50"
                  aria-label="Refresh operational data"
                  title="Refresh operational data"
                >
                  <svg
                    className={`h-4 w-4 text-amber-light ${refreshLoading ? "animate-spin" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subtle geometric checker accent divider */}
        <div className="checker-strip-subtle opacity-30 w-full" />
      </header>

      {/* MOBILE FLOATING NAVIGATION MENU (Rendered outside header to float freely) */}
      {/* Invisible Outside-Click Overlay (Closes popup when clicking outside; no dark backdrop) */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-transparent md:hidden transition-none ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      />

      {/* Small Floating Mobile Navigation Popup Attached Underneath Hamburger */}
      <div
        id="staff-navigation-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="false"
        aria-label="Staff Navigation Menu"
        style={{ top: headerHeight ? `${headerHeight + 6}px` : undefined }}
        className={`mobile-floating-menu fixed top-[70px] left-4 z-50 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto md:hidden rounded-2xl border border-amber-warm/35 bg-charcoal-deep/95 backdrop-blur-md p-2.5 shadow-2xl shadow-charcoal-black/90 ring-1 ring-amber-warm/20 ${
          drawerOpen
            ? "mobile-floating-menu--open"
            : "mobile-floating-menu--closed"
        }`}
      >
        {/* Staff Info Card inside Floating Popup */}
        {staff && (
          <div className="mobile-menu-item mb-2 p-2.5 rounded-xl bg-charcoal-green/75 border border-forest-dark/50 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-cream-soft truncate">{staff.email}</p>
              <p className="text-[10px] text-amber-gold uppercase font-bold tracking-wider mt-0.5">{staff.role}</p>
            </div>
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-warm/20 text-amber-light border border-amber-warm/30">
              Staff
            </span>
          </div>
        )}

        {/* Staff Navigation Links inside Floating Popup */}
        <nav className="flex flex-col space-y-1" aria-label="Staff Mobile Navigation">
          {navLinks.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className={`mobile-menu-item flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? "bg-amber-warm text-charcoal-black font-bold shadow-xs"
                    : "text-stone hover:text-cream-soft hover:bg-charcoal-green/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {link.href === "/dashboard" && (
                    <svg className={`h-4 w-4 ${active ? "text-charcoal-black" : "text-amber-light"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  )}
                  {link.href === "/" && (
                    <svg className={`h-4 w-4 ${active ? "text-charcoal-black" : "text-amber-light"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  )}
                  {link.href === "/tables" && (
                    <svg className={`h-4 w-4 ${active ? "text-charcoal-black" : "text-amber-light"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                  )}
                  {link.href === "/menu" && (
                    <svg className={`h-4 w-4 ${active ? "text-charcoal-black" : "text-amber-light"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  )}
                  {link.href === "/festivals" && (
                    <svg className={`h-4 w-4 ${active ? "text-charcoal-black" : "text-amber-light"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  <span>{link.label}</span>
                </div>
                {active && <span className="text-[10px] font-black">●</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider & Actions */}
        <div className="mt-2 pt-2 border-t border-forest-dark/50 space-y-1">
          {onRefresh && (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onRefresh();
              }}
              disabled={refreshLoading}
              className="mobile-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone hover:text-cream-soft hover:bg-charcoal-green/70 transition disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 text-amber-light shrink-0 ${refreshLoading ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Refresh Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              handleLogout();
            }}
            className="mobile-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone hover:text-cream-soft hover:bg-charcoal-green/70 transition"
          >
            <svg className="h-4 w-4 text-amber-light shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
}
