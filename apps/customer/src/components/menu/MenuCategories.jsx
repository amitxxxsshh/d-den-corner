"use client";

export default function MenuCategories({
  categories,
  activeCategory,
  onCategoryChange,
}) {
  if (!categories?.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2 pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeCategory === null
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              onCategoryChange(category.id)
            }
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeCategory === category.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}