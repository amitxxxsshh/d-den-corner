"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import TableCard from "../../components/tables/TableCard";

import {
  getStaffTables,
  openTable,
  closeTable,
  generateTableQR,
} from "../../lib/tables";

const STAFF_USER_ID =
  process.env.NEXT_PUBLIC_STAFF_USER_ID ||
  "";

export default function TablesPage() {
  const [locations, setLocations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busyTableId, setBusyTableId] =
    useState(null);

  const [generatedQRs, setGeneratedQRs] =
    useState({});

  const loadTables =
    useCallback(async () => {
      if (!STAFF_USER_ID) {
        setError(
          "NEXT_PUBLIC_STAFF_USER_ID is not configured.",
        );

        setLoading(false);

        return;
      }

      try {
        setError("");

        const response =
          await getStaffTables(
            STAFF_USER_ID,
          );

        setLocations(
          response?.locations ||
            [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load tables.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadTables();

    const interval =
      window.setInterval(
        loadTables,
        5000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadTables]);

  const tables =
    useMemo(
      () =>
        locations.flatMap(
          (location) =>
            (location.tables || []).map(
              (table) => ({
                ...table,
                locationName:
                  location.name,
              }),
            ),
        ),
      [locations],
    );

  async function handleOpen(
    tableId,
  ) {
    try {
      setBusyTableId(tableId);
      setError("");

      await openTable(
        tableId,
        STAFF_USER_ID,
      );

      await loadTables();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to open table.",
      );
    } finally {
      setBusyTableId(null);
    }
  }

  async function handleClose(
    tableId,
  ) {
    try {
      setBusyTableId(tableId);
      setError("");

      await closeTable(
        tableId,
        STAFF_USER_ID,
      );

      await loadTables();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to close table.",
      );
    } finally {
      setBusyTableId(null);
    }
  }

  async function handleGenerateQR(
    tableId,
  ) {
    try {
      setBusyTableId(tableId);
      setError("");

      const response =
        await generateTableQR(
          tableId,
          STAFF_USER_ID,
        );

      if (response?.qr) {
        setGeneratedQRs(
          (current) => ({
            ...current,
            [tableId]:
              response.qr,
          }),
        );
      }

      await loadTables();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to assign QR code.",
      );
    } finally {
      setBusyTableId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              D Den Corner
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
              Tables & QR
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Open and close table sessions. Each table keeps its fixed physical QR.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            >
              Orders
            </Link>

            <button
              type="button"
              onClick={loadTables}
              disabled={loading}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500">
            Loading tables...
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="font-semibold text-zinc-900">
              No tables found
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Add tables to the D1 database before managing them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tables.map(
              (table) => (
                <div
                  key={table.id}
                >
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {table.locationName}
                  </p>

                  <TableCard
                    table={table}
                    generatedQR={
                      generatedQRs[
                        table.id
                      ] || null
                    }
                    busy={
                      busyTableId ===
                      table.id
                    }
                    onOpen={
                      handleOpen
                    }
                    onClose={
                      handleClose
                    }
                    onGenerateQR={
                      handleGenerateQR
                    }
                  />
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}