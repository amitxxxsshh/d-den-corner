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

      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <svg
          className="h-4 w-4 text-stone/75"
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
        className="w-full rounded-full border border-white/20 bg-charcoal-black/50 backdrop-blur-md pl-11 pr-14 py-2.5 sm:py-3 text-sm font-medium text-cream-soft outline-none transition placeholder:text-stone/60 hover:bg-charcoal-black/60 hover:border-white/30 focus:border-amber-warm/80 focus:bg-charcoal-black/65 focus:ring-2 focus:ring-amber-warm/30 focus:shadow-[0_0_15px_rgba(216,154,58,0.25)] shadow-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold text-stone/80 hover:text-cream-soft transition"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
