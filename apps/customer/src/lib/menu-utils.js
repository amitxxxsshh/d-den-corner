export function normalizeMenuResponse(response) {
  if (!response) {
    return {
      categories: [],
      items: [],
    };
  }

  const categories = Array.isArray(response.categories)
    ? response.categories
    : [];

  const items = Array.isArray(response.items)
    ? response.items
    : [];

  return {
    categories,
    items,
  };
}

export function formatPrice(priceMinor) {
  const amount = Number(priceMinor || 0) / 100;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getItemsForCategory(items, categoryId) {
  if (!categoryId) {
    return items;
  }

  return items.filter((item) => item.category_id === categoryId);
}

export function searchItems(items, query) {
  const value = query?.trim().toLowerCase();

  if (!value) {
    return items;
  }

  return items.filter((item) => {
    const name = item.name?.toLowerCase() || "";
    const description = item.description?.toLowerCase() || "";

    return (
      name.includes(value) ||
      description.includes(value)
    );
  });
}