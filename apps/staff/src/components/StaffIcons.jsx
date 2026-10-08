"use client";

export function DDenStaffLogo({ className = "h-8 w-8" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/d-den-corner-logo.png"
          alt="D Den Corner Logo"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm sm:text-base font-bold tracking-tight text-cream-soft font-serif truncate">
          D DEN CORNER
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-amber-warm font-semibold">
          Staff Operations
        </span>
      </div>
    </div>
  );
}
