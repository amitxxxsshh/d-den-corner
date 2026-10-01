"use client";

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

  return (
    <header className="sticky top-0 z-30 bg-charcoal-deep border-b border-forest-dark/40 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex min-h-[64px] items-center justify-between gap-4 py-2.5">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-90 shrink-0"
          >
            <DDenStaffLogo />
          </Link>

          {/* Center Navigation Links (Hidden on small mobile, visible from sm up) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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

          {/* Right Area: Staff Role & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {staff && (
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-cream-soft truncate max-w-[160px]">
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
                >
                  <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
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

        {/* Mobile Navigation Scrollbar Row (Shown only on small screens < md) */}
        <nav className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2.5 pt-1 scrollbar-none border-t border-forest-dark/30">
          {navLinks.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-amber-warm text-charcoal-black font-bold shadow-xs"
                    : "text-stone bg-charcoal-green/50 hover:bg-charcoal-green hover:text-cream-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Subtle geometric checker accent divider */}
      <div className="checker-strip-subtle opacity-30 w-full" />
    </header>
  );
}
