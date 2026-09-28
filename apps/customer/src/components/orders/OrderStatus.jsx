"use client";

import {
  ORDER_STATUS_STEPS,
  getOrderStatusIndex,
} from "../../lib/order-status";

function getStepIcon(status, isCompleted, isCurrent) {
  if (isCompleted && !isCurrent) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  switch (status) {
    case "NEW":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "ACCEPTED":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
          <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "PREPARING":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case "READY":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "SERVED":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L7 17l-5-5" />
          <path d="M22 10l-7.5 7.5-1.5-1.5" />
        </svg>
      );
    default:
      return <span>✓</span>;
  }
}

export default function OrderStatus({
  status,
}) {
  const currentIndex =
    getOrderStatusIndex(status);

  return (
    <div className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone/30">
        <div>
          <h2 className="text-base font-bold font-serif text-charcoal-deep">
            Kitchen Preparation Progress
          </h2>
          <p className="mt-0.5 text-xs text-charcoal-deep/60">
            Real-time status updates from our kitchen
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-cream-warm/70 border border-stone/40 px-3 py-1 text-[11px] font-bold text-charcoal-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-warm animate-ping" />
          <span>Live Tracking</span>
        </div>
      </div>

      <div className="space-y-4">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const isCompleted = currentIndex >= index;
          const isCurrent = step.status === status;
          const isLast = index === ORDER_STATUS_STEPS.length - 1;

          // Color System:
          // Completed = Muted green (#72805A / #304A35)
          // Current / Active = Amber (#D89A3A)
          // Inactive = Stone/neutral (#D8D0C1)
          let circleBg = "bg-stone/20 text-stone-600 border border-stone/40";
          let labelColor = "text-charcoal-deep/50";
          let badgeText = null;

          if (isCurrent) {
            circleBg = "bg-amber-warm text-charcoal-black border-2 border-amber-light shadow-md amber-glow";
            labelColor = "text-charcoal-deep font-bold";
            badgeText = "CURRENT STAGE";
          } else if (isCompleted) {
            circleBg = "bg-forest-dark text-cream-soft border border-forest";
            labelColor = "text-charcoal-deep font-semibold";
          }

          return (
            <div key={step.status} className="relative flex items-start gap-4">
              {/* Connecting vertical line */}
              {!isLast && (
                <div
                  className={`absolute left-[17px] top-9 w-0.5 h-[calc(100%-8px)] transition-colors ${
                    currentIndex > index ? "bg-forest" : "bg-stone/30"
                  }`}
                />
              )}

              {/* Step Circle with Icon */}
              <div
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold transition-all ${circleBg}`}
              >
                {getStepIcon(step.status, isCompleted, isCurrent)}
              </div>

              {/* Step Info */}
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm ${labelColor}`}>
                    {step.label}
                  </p>

                  {badgeText && (
                    <span className="rounded-full bg-amber-warm/20 border border-amber-warm/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-gold">
                      {badgeText}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-xs text-charcoal-deep/60">
                  {isCurrent
                    ? "In progress right now at D Den Corner."
                    : isCompleted
                      ? "Completed"
                      : "Pending"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}