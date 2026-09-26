"use client";

export default function MenuCategories({
  categories,
  activeCategory,
  onCategoryChange,
}) {
  if (!categories?.length) {
    return null;
  }

  function handleCategoryClick(categoryId) {
    onCategoryChange(categoryId);

    if (!categoryId) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const element = document.getElementById(
      `menu-category-${categoryId}`,
    );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-30 -mx-4 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur"
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          <button
            type="button"
            onClick={() => handleCategoryClick(null)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeCategory === null
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                handleCategoryClick(category.id)
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}