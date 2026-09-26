"use client";

import { useEffect, useState } from "react";

import {
  createFestival,
  getFestivals,
  updateFestival,
} from "../../lib/festivals";

const CATEGORIES = [
  { value: "ODISHA", label: "Odisha" },
  { value: "INDIAN", label: "Indian" },
  { value: "CUSTOM", label: "Custom" },
];

const EMPTY_FORM = {
  category: "ODISHA",
  name: "",
  description: "",
  startDate: "",
  endDate: "",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function categoryLabel(category) {
  return (
    CATEGORIES.find((item) => item.value === category)?.label ||
    category
  );
}

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingFestivalId, setEditingFestivalId] =
    useState(null);

  async function loadFestivals() {
    try {
      setLoading(true);
      setError("");

      const result = await getFestivals();
      setFestivals(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load festivals.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFestivals();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingFestivalId(null);
  }

  function startEdit(festival) {
    setSuccess("");
    setError("");

    setEditingFestivalId(festival.id);

    setForm({
      category: festival.category,
      name: festival.name,
      description: festival.description || "",
      startDate: festival.start_date,
      endDate: festival.end_date,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Festival name is required.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setSaving(true);

      if (editingFestivalId) {
        await updateFestival(editingFestivalId, {
          category: form.category,
          name,
          description: form.description.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
        });

        setSuccess("Festival updated successfully.");
      } else {
        await createFestival({
          category: form.category,
          name,
          description: form.description.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
        });

        setSuccess("Festival created successfully.");
      }

      resetForm();
      await loadFestivals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save festival.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleFestival(festival) {
    setError("");
    setSuccess("");

    try {
      await updateFestival(festival.id, {
        active: !Boolean(festival.active),
      });

      setSuccess(
        festival.active
          ? "Festival deactivated."
          : "Festival activated.",
      );

      await loadFestivals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update festival status.",
      );
    }
  }

  async function toggleArchived(festival) {
    setError("");
    setSuccess("");

    try {
      await updateFestival(festival.id, {
        archived: !Boolean(festival.archived),
      });

      setSuccess(
        festival.archived
          ? "Festival restored."
          : "Festival archived.",
      );

      await loadFestivals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update archive status.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                D Den Corner
              </p>

              <h1 className="mt-1 text-3xl font-bold text-zinc-900">
                Festival Menu
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Create festivals, control their availability, and
                manage special menus.
              </p>
            </div>

            <a
              href="/"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Back to Dashboard
            </a>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingFestivalId
                ? "Edit Festival"
                : "Create Festival"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Define the festival details and active period.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >
            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Category
              </span>

              <select
                value={form.category}
                onChange={(event) =>
                  updateForm(
                    "category",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
              >
                {CATEGORIES.map((category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Festival Name
              </span>

              <input
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="e.g. Durga Puja"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                Description
              </span>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Optional festival description"
                className="w-full resize-none rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                Start Date
              </span>

              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateForm(
                    "startDate",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">
                End Date
              </span>

              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(event) =>
                  updateForm(
                    "endDate",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
              />
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingFestivalId
                    ? "Update Festival"
                    : "Create Festival"}
              </button>

              {editingFestivalId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Festivals
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Manage existing festival configurations.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
              Loading festivals...
            </div>
          ) : festivals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              No festivals have been created yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {festivals.map((festival) => (
                <article
                  key={festival.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {festival.name}
                        </h3>

                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                          {categoryLabel(
                            festival.category,
                          )}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            festival.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {festival.active
                            ? "Active"
                            : "Inactive"}
                        </span>

                        {festival.archived ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Archived
                          </span>
                        ) : null}
                      </div>

                      {festival.description && (
                        <p className="mt-2 text-sm text-zinc-600">
                          {festival.description}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-zinc-500">
                        {formatDate(
                          festival.start_date,
                        )}{" "}
                        —{" "}
                        {formatDate(
                          festival.end_date,
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(festival)
                        }
                        className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleFestival(festival)
                        }
                        className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        {festival.active
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleArchived(festival)
                        }
                        className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        {festival.archived
                          ? "Restore"
                          : "Archive"}
                      </button>

                      <a
                        href={`/festivals/${festival.id}`}
                        className="rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                      >
                        Manage Menus
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}