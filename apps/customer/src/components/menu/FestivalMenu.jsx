"use client";

import { useState } from "react";

function formatPrice(amountMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountMinor || 0) / 100);
}

export default function FestivalMenu({
  festivals = [],
  onAdd,
}) {
  const [selectedFestival, setSelectedFestival] =
    useState(festivals[0]?.id || null);

  if (!Array.isArray(festivals) || festivals.length === 0) {
    return null;
  }

  const festival =
    festivals.find(
      (item) => item.id === selectedFestival,
    ) || festivals[0];

  return (
    <section className="relative overflow-hidden bg-charcoal-deep text-cream-soft border-b border-amber-warm/30 px-4 py-8 sm:px-6">
      {/* Subtle festive amber glow in background */}
      <div className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-amber-warm/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-forest-dark/30 blur-2xl" />

      <div className="relative mx-auto max-w-6xl">
       <div className="mb-6">
       <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cream-soft font-serif">
         Special Menu
       </h2>
      </div>

        {/* Festival Tabs (if multiple) */} 
        {festivals.length > 1 ? (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {festivals.map((item) => {
              const active = item.id === festival.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedFestival(item.id)}
                  className={[
                    "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-sm",
                    active
                      ? "bg-amber-warm text-charcoal-black font-bold ring-2 ring-amber-light"
                      : "bg-charcoal-green/70 text-cream-soft/80 border border-stone/30 hover:bg-charcoal-green hover:text-cream-soft",
                  ].join(" ")}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Festival Special Menus */}
        {Array.isArray(festival?.specialMenus) &&
        festival.specialMenus.length > 0 ? (
          <div className="space-y-7">
            {festival.specialMenus.map((specialMenu) => (
              <div key={specialMenu.id}>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.isArray(specialMenu.items)
                    ? specialMenu.items.map((item) => {
                        const regularPrice = Number(
                          item.regularPriceMinor || 0,
                        );

                        const specialPrice = Number(
                          item.specialPriceMinor ?? regularPrice,
                        );

                        return (
                          <article
                            key={item.id}
                            className="flex flex-col justify-between rounded-2xl border border-amber-warm/30 bg-cream-soft p-4 sm:p-5 text-charcoal-deep shadow-md transition hover:border-amber-warm hover:shadow-lg"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-charcoal-deep font-serif text-sm sm:text-base leading-snug">
                                      {item.name}
                                    </h4>
                                  </div>

                                  {item.description ? (
                                    <p className="mt-1 text-xs text-charcoal-deep/70 leading-relaxed line-clamp-2">
                                      {item.description}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-stone/30">
                              <div>
                                <span className="font-extrabold text-charcoal-deep text-sm sm:text-base">
                                  {formatPrice(specialPrice)}
                                </span>

                                {specialPrice !== regularPrice ? (
                                  <span className="ml-2 text-xs text-charcoal-deep/40 line-through">
                                    {formatPrice(regularPrice)}
                                  </span>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                disabled={item.available === false || !onAdd}
                                onClick={() =>
                                  onAdd?.({
                                    ...item,
                                    specialMenuId: specialMenu.id,
                                  })
                                }
                                className="inline-flex min-h-[44px] min-w-[76px] items-center justify-center rounded-xl bg-charcoal-deep px-4 py-2 text-xs font-bold text-amber-light hover:bg-charcoal-green hover:shadow transition disabled:cursor-not-allowed disabled:bg-stone/40 disabled:text-charcoal-deep/30"
                              >
                                {item.available === false
                                  ? "Unavailable"
                                  : !onAdd
                                    ? "View Only"
                                    : "Add +"}
                              </button>
                            </div>
                          </article>
                        );
                      })
                    : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone/30 bg-charcoal-green/40 p-6 text-center text-xs text-stone">
            No festival items are currently available for this celebration.
          </div>
        )}
      </div>

      {/* Checker strip at bottom of festival section */}
      <div className="checker-strip-subtle opacity-20 absolute inset-x-0 bottom-0" />
    </section>
  );
}