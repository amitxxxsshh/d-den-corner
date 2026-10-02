"use client";

import { useEffect, useState } from "react";

import TableCard from "../../components/tables/TableCard";
import AddTableCard from "../../components/tables/AddTableCard";
import StaffNavbar from "../../components/StaffNavbar";

import {
  getStaffTables,
  openTable,
  closeTable,
  createTable,
} from "../../lib/tables";

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTableId, setBusyTableId] = useState(null);

  async function loadTables() {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffTables();

      setTables(
        Array.isArray(data?.tables)
          ? data.tables
          : [],
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load tables.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, []);

  async function handleOpen(tableId) {
    try {
      setBusyTableId(tableId);
      setError("");

      await openTable(tableId);

      await loadTables();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to open table.",
      );
    } finally {
      setBusyTableId(null);
    }
  }

  async function handleClose(tableId) {
    try {
      setBusyTableId(tableId);
      setError("");

      await closeTable(tableId);

      await loadTables();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to close table.",
      );
    } finally {
      setBusyTableId(null);
    }
  }

  async function handleCreateTable({ id, name }) {
    try {
      setError("");
      await createTable({ id, name });
      await loadTables();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create table.",
      );
      throw err;
    }
  }

  const openCount = tables.filter((t) => Boolean(t.activeSession)).length;

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-16">
      {/* Exactly ONE Unified Responsive Staff Navbar */}
      <StaffNavbar
        onRefresh={loadTables}
        refreshLoading={loading}
      />

      {/* Tables Operations Title Bar */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Dining Floor &amp; Table Management
              </h1>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2">
                {openCount}/{tables.length} Open
              </span>
            </div>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Open/close active table dining sessions.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta">
            {error}
          </div>
        ) : null}

        {loading && tables.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-stone/40 bg-white p-8 text-center text-xs text-charcoal-deep/60">
            Loading table states...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                busy={busyTableId === table.id}
                onOpen={handleOpen}
                onClose={handleClose}
              />
            ))}
            <AddTableCard
              onCreate={handleCreateTable}
              onCreated={loadTables}
            />
          </div>
        )}
      </div>
    </main>
  );
}