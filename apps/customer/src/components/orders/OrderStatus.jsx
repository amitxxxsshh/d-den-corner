"use client";

import {
  ORDER_STATUS_STEPS,
  getOrderStatusIndex,
} from "../../lib/order-status";

export default function OrderStatus({
  status,
}) {
  const currentIndex =
    getOrderStatusIndex(
      status,
    );

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">
        Order status
      </h2>

      <div className="mt-5 space-y-4">
        {ORDER_STATUS_STEPS.map(
          (step, index) => {
            const completed =
              currentIndex >= index;

            const current =
              step.status === status;

            return (
              <div
                key={
                  step.status
                }
                className="flex items-start gap-3"
              >
                <div
                  className={[
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    completed
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-400",
                  ].join(" ")}
                >
                  {completed
                    ? "✓"
                    : index + 1}
                </div>

                <div className="min-w-0">
                  <p
                    className={[
                      "text-sm font-semibold",
                      current
                        ? "text-gray-900"
                        : "text-gray-600",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>

                  {current ? (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Current status
                    </p>
                  ) : null}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}