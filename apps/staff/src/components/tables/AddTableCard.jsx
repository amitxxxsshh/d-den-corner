"use client";

import { useState } from "react";
import { createTable } from "../../lib/tables";

export function AddTableCard({ onCreate, onCreated }) {
  const [tableId, setTableId] = useState("");
  const [tableName, setTableName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    const trimmedId = tableId.trim();
    const trimmedName = tableName.trim();

    if (!trimmedId || !trimmedName) {
      setError("Table ID and Table Name are required.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      if (onCreate) {
        await onCreate({ id: trimmedId, name: trimmedName });
      } else {
        await createTable({ id: trimmedId, name: trimmedName });
        if (onCreated) {
          await onCreated();
        }
      }
      setTableId("");
      setTableName("");
    } catch (err) {
      setError(err?.message || "Failed to create table.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full">
        <div>
          {/* Header: Name + Badge */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50 block">
                D Den Corner Table
              </span>

              <h2 className="mt-0.5 text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Add Table
              </h2>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider bg-stone/30 text-charcoal-deep/60 border-stone/50">
              <span className="h-1.5 w-1.5 rounded-full bg-forest" />
              NEW
            </span>
          </div>

          {/* Table ID Input Box */}
          <div className="mt-4 rounded-2xl border border-stone/30 bg-cream-warm/30 p-3.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="new-table-id"
                className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50"
              >
                Table ID
              </label>
            </div>

            <input
              id="new-table-id"
              type="text"
              value={tableId}
              onChange={(e) => {
                setTableId(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. dev-table-4"
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-stone/40 bg-white/90 px-3 py-1.5 text-xs font-medium text-charcoal-deep placeholder:text-charcoal-deep/35 focus:border-forest/60 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Table Name Input Box */}
          <div className="mt-3.5 rounded-2xl border border-stone/40 p-3.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="new-table-name"
                className="text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50"
              >
                Table Name
              </label>
            </div>

            <input
              id="new-table-name"
              type="text"
              value={tableName}
              onChange={(e) => {
                setTableName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Table 4"
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-stone/40 bg-white/90 px-3 py-1.5 text-xs font-medium text-charcoal-deep placeholder:text-charcoal-deep/35 focus:border-forest/60 focus:bg-white focus:outline-none"
            />
          </div>

          {error ? (
            <p className="mt-2 text-[11px] font-medium text-terracotta">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-2.5 pt-3 border-t border-stone/30">
          <button
            type="submit"
            disabled={busy || !tableId.trim() || !tableName.trim()}
            className="w-full min-h-[44px] rounded-xl bg-charcoal-deep py-2.5 text-xs font-bold text-cream-soft hover:bg-charcoal-green transition disabled:cursor-not-allowed disabled:bg-stone/40 disabled:text-charcoal-deep/40 shadow-sm"
          >
            {busy ? "Generating Table..." : "Generate Table"}
          </button>

          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <span className="truncate text-[11px] text-charcoal-deep/50">
              Creates initial permanent ordering link
            </span>
          </div>
        </div>
      </form>
    </article>
  );
}

export default AddTableCard;

