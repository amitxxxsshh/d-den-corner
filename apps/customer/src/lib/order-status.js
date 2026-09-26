export const ORDER_STATUSES = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "SERVED",
];

export const ORDER_STATUS_STEPS = [
  {
    status: "NEW",
    label: "Order received",
  },
  {
    status: "ACCEPTED",
    label: "Order accepted",
  },
  {
    status: "PREPARING",
    label: "Preparing your order",
  },
  {
    status: "READY",
    label: "Ready to serve",
  },
  {
    status: "SERVED",
    label: "Served",
  },
];

export function getOrderStatusLabel(
  status,
) {
  const step =
    ORDER_STATUS_STEPS.find(
      (item) =>
        item.status === status,
    );

  return (
    step?.label ||
    status ||
    "Unknown"
  );
}

export function getOrderStatusIndex(
  status,
) {
  return ORDER_STATUSES.indexOf(
    status,
  );
}