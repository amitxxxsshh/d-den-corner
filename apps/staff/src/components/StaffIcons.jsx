"use client";

export function DDenStaffLogo({ className = "h-8 w-8" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center rounded-xl bg-charcoal-deep border border-amber-warm/40 p-2 shadow-sm shrink-0 ${className}`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Arch outline */}
          <path d="M6 28V14C6 8.47715 10.4772 4 16 4C21.5228 4 26 8.47715 26 14V28" stroke="#D89A3A" strokeWidth="1.8" strokeLinecap="round" />
          {/* Horizontal crossbeam */}
          <line x1="4" y1="28" x2="28" y2="28" stroke="#D89A3A" strokeWidth="1.5" strokeLinecap="round" />
          {/* Hanging chain */}
          <line x1="16" y1="4" x2="16" y2="11" stroke="#E8B85C" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 1.5" />
          {/* Warm Amber Lantern / Flame */}
          <circle cx="16" cy="14" r="3.5" fill="#D89A3A" />
          <circle cx="16" cy="14" r="1.8" fill="#F7F1E5" />
          {/* Botanical leaf */}
          <path d="M12 24C12 21 16 19 16 19C16 19 20 21 20 24Z" fill="#304A35" opacity="0.9" />
        </svg>
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
