export function createCartItem(menuItem) {
  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    description: menuItem.description || "",
    priceMinor: Number(
      menuItem.specialPriceMinor ??
        menuItem.price_minor ??
        menuItem.priceMinor ??
        0,
    ),
    quantity: 1,
    available: menuItem.available !== false,

    specialMenuId:
      menuItem.specialMenuId || null,

    festivalSpecial:
      menuItem.festivalSpecial === true,

    regularPriceMinor:
      menuItem.regularPriceMinor ??
      menuItem.price_minor ??
      menuItem.priceMinor ??
      null,
  };
}

export function calculateCartItemCount(items) {
  return items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0,
  );
}

export function calculateCartSubtotal(items) {
  return items.reduce(
    (total, item) =>
      total +
      Number(item.priceMinor || 0) *
        Number(item.quantity || 0),
    0,
  );
}