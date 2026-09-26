import { apiRequest } from "./api";

export function formatCheckoutPrice(
  amountMinor,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(amountMinor || 0) / 100,
  );
}

export async function createOrder(
  items,
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "Your cart is empty.",
    );
  }

  const normalizedItems =
    items.map((item) => ({
      menuItemId:
        item.menuItemId,
      quantity:
        Number(item.quantity),
    }));

  const invalidItem =
    normalizedItems.some(
      (item) =>
        !item.menuItemId ||
        !Number.isInteger(
          item.quantity,
        ) ||
        item.quantity <= 0,
    );

  if (invalidItem) {
    throw new Error(
      "Your cart contains an invalid item.",
    );
  }

  return apiRequest(
    "/api/orders",
    {
      method: "POST",
      body: JSON.stringify({
        items:
          normalizedItems,
      }),
    },
  );
}