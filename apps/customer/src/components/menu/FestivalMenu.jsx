"use client";

import { useState } from "react";

function formatPrice(amountMinor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountMinor || 0) / 100);
}

export default function FestivalMenu({
  festivals = [],
  onAdd,
}) {
  const [selectedFestival, setSelectedFestival] =
    useState(festivals[0]?.id || null);

  if (!Array.isArray(festivals) || festivals.length === 0) {
    return null;
  }

  const festival =
    festivals.find(
      (item) => item.id === selectedFestival,
    ) || festivals[0];

  return (
    <section className="border-b border-gray-200 bg-amber-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Special menu
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Festival Specials
          </h2>

          {festival.description ? (
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              {festival.description}
            </p>
          ) : null}
        </div>

        {festivals.length > 1 ? (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {festivals.map((item) => {
              const active =
                item.id === festival.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelectedFestival(item.id)
                  }
                  className={[
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {Array.isArray(festival.specialMenus) &&
        festival.specialMenus.length > 0 ? (
          <div className="space-y-8">
            {festival.specialMenus.map(
              (specialMenu) => (
                <div key={specialMenu.id}>
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    {specialMenu.name}
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(
                      specialMenu.items,
                    )
                      ? specialMenu.items.map(
                          (item) => {
                            const regularPrice =
                              Number(
                                item.regularPriceMinor ||
                                  0,
                              );

                            const specialPrice =
                              Number(
                                item.specialPriceMinor ??
                                  regularPrice,
                              );

                            return (
                              <article
                                key={item.id}
                                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-100"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-gray-900">
                                      {item.name}
                                    </h4>

                                    {item.description ? (
                                      <p className="mt-1 text-sm leading-5 text-gray-600">
                                        {
                                          item.description
                                        }
                                      </p>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <div>
                                    <span className="font-semibold text-gray-900">
                                      {formatPrice(
                                        specialPrice,
                                      )}
                                    </span>

                                    {specialPrice !==
                                    regularPrice ? (
                                      <span className="ml-2 text-sm text-gray-400 line-through">
                                        {formatPrice(
                                          regularPrice,
                                        )}
                                      </span>
                                    ) : null}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={
                                      item.available ===
                                      false
                                    }
                                    onClick={() =>
                                      onAdd?.({
                                        ...item,
                                        specialMenuId:
                                          specialMenu.id,
                                      })
                                    }
                                    className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                  >
                                    Add
                                  </button>
                                </div>
                              </article>
                            );
                          },
                        )
                      : null}
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No festival items are currently available.
          </p>
        )}
      </div>
    </section>
  );
}