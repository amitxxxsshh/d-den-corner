"use client";

import { formatPrice } from "../../lib/menu-utils";
import { getMenuItemImageUrl, DEFAULT_MENU_IMAGE } from "../../lib/menu-images";

export default function MenuItemDetails({
  item,
  onClose,
  onAdd,
}) {
  if (!item) {
    return null;
  }

  const unavailable =
    item.available !== 1 &&
    item.available !== true;

  const isFestivalSpecial =
    item.festivalSpecial === true;

  const displayPrice =
    isFestivalSpecial &&
    item.specialPriceMinor !== undefined
      ? item.specialPriceMinor
      : item.price_minor;

  const regularPrice =
    isFestivalSpecial
      ? item.regularPriceMinor
      : null;

  const imageUrl = getMenuItemImageUrl(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone/40 bg-cream-soft p-6 sm:p-7 shadow-2xl text-charcoal-deep transition-all"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone/70 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
            <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-cream-warm border border-stone/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_MENU_IMAGE;
                }}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                  {item.name}
                </h2>

                {isFestivalSpecial ? (
                  <span className="rounded-full bg-amber-warm/20 border border-amber-warm/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-gold uppercase tracking-wider">
                    Festival Special
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex items-baseline gap-2.5">
                <p className="text-lg sm:text-xl font-extrabold text-charcoal-deep">
                  {formatPrice(displayPrice)}
                </p>

                {isFestivalSpecial &&
                regularPrice !== null &&
                Number(regularPrice) !== Number(displayPrice) ? (
                  <p className="text-xs sm:text-sm text-charcoal-deep/40 line-through">
                    {formatPrice(regularPrice)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-stone/50 text-base font-bold text-charcoal-deep/70 hover:bg-cream-warm hover:text-charcoal-deep transition"
          >
            ✕
          </button>
        </div>

        {item.description ? (
          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-charcoal-deep/75">
            {item.description}
          </p>
        ) : null}

        <div className="mt-6 pt-4 border-t border-stone/40">
          <button
            type="button"
            disabled={unavailable}
            onClick={() => onAdd(item)}
            className={[
              "w-full min-h-[48px] rounded-2xl px-5 py-3.5 text-sm font-bold transition shadow-md",
              unavailable
                ? "cursor-not-allowed bg-stone/40 text-charcoal-deep/40"
                : "bg-amber-warm text-charcoal-black hover:bg-amber-light active:scale-[0.99]",
            ].join(" ")}
          >
            {unavailable ? "Currently unavailable" : "Add to order"}
          </button>
        </div>
      </div>
    </div>
  );
}