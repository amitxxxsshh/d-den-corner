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

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-zinc-900">
            {item.name}
          </h3>

          {item.description ? (
            <p className="mt-1 text-sm text-zinc-500">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-sm font-semibold text-zinc-900">
          ₹
          {(Number(item.price_minor || 0) / 100).toFixed(2)}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabledReason || "Add"}
      </button>
    </article>
  );
}