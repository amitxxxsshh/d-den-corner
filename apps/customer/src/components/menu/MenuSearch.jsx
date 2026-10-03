"use client";

export default function MenuSearch({
  value,
  onChange,
  onClear,
}) {
  return (
    <div className="relative">
      <label
        htmlFor="menu-search"
        className="sr-only"
      >
        Search dishes, drinks, specials
      </label>

      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-600">
        <svg
          className="h-4 w-4 text-charcoal-deep/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        id="menu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search dishes, drinks, specials..."
        autoComplete="off"
        className="w-full rounded-2xl border border-stone/60 bg-white pl-10 pr-12 py-2.5 sm:py-3 text-sm text-charcoal-deep outline-none transition placeholder:text-charcoal-deep/40 focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20 shadow-sm"
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-charcoal-deep/50 hover:text-charcoal-deep transition"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
