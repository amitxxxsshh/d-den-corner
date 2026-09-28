"use client";

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

  const isMenu = pathname === "/menu";
  const isOrders = pathname?.startsWith("/orders");

  return (
    <header className="sticky top-0 z-30 bg-charcoal-deep/95 border-b border-forest-dark/40 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo & Title */}
          <Link
            href="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90 min-w-0"
          >
            <DDenLogo
              className="h-8 w-8 sm:h-9 sm:w-9"
              subtitle={subtitle || "ROOFTOP CAFÉ"}
            />
          </Link>

          {/* Center Navigation Links (Responsive) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/menu"
              className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isMenu
                  ? "text-amber-light font-semibold bg-forest-dark/40 shadow-sm"
                  : "text-stone hover:text-cream-soft hover:bg-charcoal-green/50"
              }`}
            >
              Menu
              {isMenu && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-warm" />
              )}
            </Link>

            <Link
              href="/orders"
              className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isOrders
                  ? "text-amber-light font-semibold bg-forest-dark/40 shadow-sm"
                  : "text-stone hover:text-cream-soft hover:bg-charcoal-green/50"
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
      </div>

      {/* Subtle Black-and-Cream Geometric Checker Accent Line */}
      <div className="checker-strip-subtle opacity-40 w-full" />
    </header>
  );
}