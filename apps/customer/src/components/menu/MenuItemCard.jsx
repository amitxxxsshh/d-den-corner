"use client";

export default function MenuItemCard({
  item,
  onClick,
  onSelect,
  onAdd,
  onAddToCart,
  onAddItem,
  onAddItemToCart,
  disabled = false,
  disabledReason = "",
}) {
  const handleAdd =
    onClick ||
    onSelect ||
    onAdd ||
    onAddToCart ||
    onAddItem ||
    onAddItemToCart;

  function handleClick() {
    if (typeof handleAdd === "function") {
      handleAdd(item);
    }
  }

  const isUnavailable =
    disabled ||
    (item.available !== 1 && item.available !== true && item.available !== undefined);

  const priceFormatted = (Number(item.price_minor || 0) / 100).toFixed(2);
  const imageUrl = item.image_url || item.imageUrl;

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone/50 bg-white p-4 sm:p-5 card-warm-shadow transition-all duration-200 hover:border-amber-warm/40 hover:shadow-md">
      <div>
        {/* If existing image exists in data, display it */}
        {imageUrl ? (
          <div className="relative mb-3.5 h-40 w-full overflow-hidden rounded-xl bg-cream-warm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-charcoal-deep font-serif tracking-tight leading-snug">
              {item.name}
            </h3>

            {item.description ? (
              <p className="mt-1 text-xs leading-relaxed text-charcoal-deep/65 line-clamp-2">
                {item.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-stone/30">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-charcoal-deep/50 font-medium">
            Price
          </span>
          <span className="text-base font-extrabold text-charcoal-deep">
            ₹{priceFormatted}
          </span>
        </div>

        <button
          type="button"
          disabled={isUnavailable || !handleAdd}
          onClick={handleClick}
          className={[
            "inline-flex min-h-[44px] min-w-[84px] items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm",
            isUnavailable || !handleAdd
              ? "cursor-not-allowed bg-stone/40 text-charcoal-deep/40"
              : "bg-charcoal-deep text-amber-light hover:bg-charcoal-green hover:shadow active:scale-95",
          ].join(" ")}
        >
          {isUnavailable
            ? (disabledReason || "Sold Out")
            : !handleAdd
              ? "View Only"
              : "Add +"}
        </button>
      </div>
    </article>
  );
}