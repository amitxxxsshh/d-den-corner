"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  createFestival,
  getFestivals,
  updateFestival,
} from "../../lib/festivals";

import StaffNavbar from "../../components/StaffNavbar";

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
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-16">
      {/* Exactly ONE Unified Responsive Staff Navbar */}
      <StaffNavbar
        onRefresh={loadFestivals}
        refreshLoading={loading}
      />

      {/* Festival Title Bar */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Seasonal &amp; Festival Menus
              </h1>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2">
                {festivals.filter((f) => f.active).length} Active
              </span>
            </div>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Configure cultural festival dining events, dates, special item pricing, and seasonal catalogues.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-forest/30 bg-forest/10 px-5 py-3.5 text-xs text-forest font-semibold">
            {success}
          </div>
        )}

        {/* Festival Form */}
        <section className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold font-serif text-charcoal-deep">
              {editingFestivalId ? "Edit Festival Celebration" : "Create New Festival Celebration"}
            </h2>

            <p className="mt-0.5 text-xs text-charcoal-deep/60">
              Define the celebration timeframe and category
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                Cultural Category
              </label>

              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                Festival Name
              </label>

              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="e.g. Raja Parba Specials"
                className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={2}
                placeholder="Story, festival specials highlight, cultural dishes..."
                className="w-full resize-none rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                Start Date
              </label>

              <input
                type="date"
                value={form.startDate}
                onChange={(event) => updateForm("startDate", event.target.value)}
                className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
                End Date
              </label>

              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(event) => updateForm("endDate", event.target.value)}
                className="w-full rounded-xl border border-stone/60 bg-cream-soft/30 px-3.5 py-2.5 text-xs font-medium text-charcoal-deep outline-none focus:border-amber-warm"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-charcoal-deep px-5 py-2.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="rounded-xl border border-stone/50 bg-white px-4 py-2.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Existing Festivals List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone/30">
            <h2 className="text-base font-bold font-serif text-charcoal-deep">
              Configured Festivals
            </h2>
            <span className="text-xs text-charcoal-deep/50 font-medium">
              {festivals.length} total
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-stone/40 bg-white p-8 text-center text-xs text-charcoal-deep/60">
              Loading festivals...
            </div>
          ) : festivals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone/50 bg-white p-8 text-center text-xs text-charcoal-deep/60">
              No festival celebrations created yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {festivals.map((festival) => (
                <article
                  key={festival.id}
                  className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold font-serif text-charcoal-deep tracking-tight">
                          {festival.name}
                        </h3>

                        <span className="rounded-full bg-cream-warm border border-stone/40 px-2.5 py-0.5 text-[10px] font-bold text-charcoal-deep uppercase tracking-wider">
                          {categoryLabel(festival.category)}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            festival.active
                              ? "bg-forest/15 text-forest border-forest/30"
                              : "bg-stone/30 text-charcoal-deep/50 border-stone/40"
                          }`}
                        >
                          {festival.active ? "Active" : "Inactive"}
                        </span>

                        {festival.archived ? (
                          <span className="rounded-full bg-amber-warm/20 border border-amber-warm/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-gold uppercase tracking-wider">
                            Archived
                          </span>
                        ) : null}
                      </div>

                      {festival.description && (
                        <p className="mt-1.5 text-xs text-charcoal-deep/70 leading-relaxed max-w-3xl">
                          {festival.description}
                        </p>
                      )}

                      <p className="mt-2.5 text-xs font-semibold text-charcoal-deep/55">
                        Active Period: {formatDate(festival.start_date)} — {formatDate(festival.end_date)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone/20">
                      <button
                        type="button"
                        onClick={() => startEdit(festival)}
                        className="rounded-xl border border-stone/50 bg-white px-3 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFestival(festival)}
                        className="rounded-xl border border-stone/50 bg-white px-3 py-1.5 text-xs font-bold text-charcoal-deep hover:bg-stone/20 transition"
                      >
                        {festival.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleArchived(festival)}
                        className="rounded-xl border border-terracotta/30 bg-white px-3 py-1.5 text-xs font-bold text-terracotta hover:bg-terracotta/10 transition"
                      >
                        {festival.archived ? "Restore" : "Archive"}
                      </button>

                      <Link
                        href={`/festivals/${festival.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-warm px-4 py-1.5 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-sm"
                      >
                        <span>Manage Menus</span>
                        <span>→</span>
                      </Link>
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