export function createCartItem(item, quantity = 1) {
  return {
    menuItemId: item.id,
    name: item.name,
    description: item.description || "",
    unitPriceMinor: Number(item.price_minor || 0),
    quantity,
  };
}

export function calculateCartSubtotal(items) {
  return items.reduce(
    (total, item) =>
      total +
      Number(item.unitPriceMinor || 0) *
        Number(item.quantity || 0),
    0,
  );
}

export function calculateCartItemCount(items) {
  return items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0,
  );
}

export function formatCartPrice(priceMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(priceMinor || 0) / 100);
}