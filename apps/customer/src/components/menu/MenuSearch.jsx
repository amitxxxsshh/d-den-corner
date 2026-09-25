"use client";

export default function MenuSearch({
  value,
  onChange,
}) {
  return (
    <div className="relative">
      <label
        htmlFor="menu-search"
        className="sr-only"
      >
        Search menu
      </label>

      <input
        id="menu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search dishes..."
        autoComplete="off"
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
      />
    </div>
  );
}