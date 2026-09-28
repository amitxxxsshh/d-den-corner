"use client";

export function DDenLogo({ className = "h-8 w-8", withText = true, subtitle = "ROOFTOP CAFÉ" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center rounded-xl bg-charcoal-deep border border-amber-warm/40 p-2 shadow-sm shrink-0 ${className}`}>
        {/* Architectural Arch with Hanging Amber Lantern Motif */}
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
          {/* Botanical leaf silhouette at base */}
          <path d="M12 24C12 21 16 19 16 19C16 19 20 21 20 24C18.5 25 13.5 25 12 24Z" fill="#304A35" opacity="0.9" />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-cream-soft font-serif">
            D DEN CORNER
          </span>
          {subtitle && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-warm/90 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function BotanicalAccent({ className = "w-6 h-6 text-forest" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C12 22 11.5 14 17 9C19 7 21 6 21 6C21 6 20 8 18 10C15 13 14 17 14 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18C12 18 9 14 9 10C9 6.5 11 3 12 2C13 3 15 6.5 15 10C15 14 12 18 12 18Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 22C12 22 12.5 14 7 9C5 7 3 6 3 6C3 6 4 8 6 10C9 13 10 17 10 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SunflowerMotif({ className = "w-5 h-5 text-amber-warm" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3.5" fill="#4A3020" />
      <circle cx="12" cy="4" r="1.5" opacity="0.85" />
      <circle cx="12" cy="20" r="1.5" opacity="0.85" />
      <circle cx="4" cy="12" r="1.5" opacity="0.85" />
      <circle cx="20" cy="12" r="1.5" opacity="0.85" />
      <circle cx="6.34" cy="6.34" r="1.5" opacity="0.85" />
      <circle cx="17.66" cy="17.66" r="1.5" opacity="0.85" />
      <circle cx="6.34" cy="17.66" r="1.5" opacity="0.85" />
      <circle cx="17.66" cy="6.34" r="1.5" opacity="0.85" />
    </svg>
  );
}
