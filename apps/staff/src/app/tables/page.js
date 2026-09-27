"use client";

import { useEffect, useState } from "react";

import TableCard from "../../components/tables/TableCard";

import {
  getStaffTables,
  openTable,
  closeTable,
  generateTableLink,
} from "../../lib/tables";

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTableId, setBusyTableId] =
    useState(null);
  const [generatedQR, setGeneratedQR] =
    useState({});

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

  async function handleGenerateLink(tableId) {
    try {
      setBusyTableId(tableId);
      setError("");

      const data =
        await generateTableLink(tableId);

      if (data?.qr) {
        setGeneratedQR((current) => ({
          ...current,
          [tableId]: data.qr,
        }));
      }

      await loadTables();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create ordering link.",
      );
    } finally {
      setBusyTableId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Restaurant operations
          </p>

          <h1 className="mt-1 text-2xl font-bold text-zinc-950">
            Tables
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Open and close table sessions and manage
            table ordering links.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {error}
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-zinc-200 bg-white">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading tables...
              </p>
            </div>
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">
              No tables found
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Create tables before managing ordering
              links.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                generatedQR={
                  generatedQR[table.id] ||
                  null
                }
                busy={
                  busyTableId === table.id
                }
                onOpen={handleOpen}
                onClose={handleClose}
                onGenerateQR={
                  handleGenerateLink
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}