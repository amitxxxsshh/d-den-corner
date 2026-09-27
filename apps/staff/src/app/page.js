"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getCurrentStaff,
  logoutStaff,
} from "./../lib/auth";

import {
  advanceOrderStatus,
  getStaffOrders,
} from "../lib/orders";

import StaffOrderCard from "../components/orders/StaffOrderCard";

const STATUS_ORDER = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
];

export default function Home() {
  const router = useRouter();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busyOrderId, setBusyOrderId] =
    useState(null);

  const [staff, setStaff] =
    useState(null);

  const loadOrders =
    useCallback(async () => {
      try {
        setError("");

        const response =
          await getStaffOrders();

        setOrders(
          response.orders || [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load staff orders.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const response =
          await getCurrentStaff();

        if (!mounted) {
          return;
        }

        setStaff(response.user);

        await loadOrders();
      } catch {
        if (mounted) {
          router.replace(
            "/login",
          );
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [router, loadOrders]);

  useEffect(() => {
    if (!staff) {
      return;
    }

    const interval =
      window.setInterval(
        loadOrders,
        5000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [staff, loadOrders]);

  async function handleLogout() {
    try {
      await logoutStaff();
    } finally {
      router.replace(
        "/login",
      );
      router.refresh();
    }
  }

  async function handleAdvance(
    orderId,
  ) {
    try {
      setBusyOrderId(orderId);
      setError("");

      const response =
        await advanceOrderStatus(
          orderId,
        );

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order.id === orderId
                ? {
                    ...order,
                    ...response.order,
                  }
                : order,
          ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update order.",
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  const groupedOrders =
    useMemo(() => {
      return STATUS_ORDER.reduce(
        (
          groups,
          status,
        ) => {
          groups[status] =
            orders.filter(
              (order) =>
                order.status ===
                status,
            );

          return groups;
        },
        {},
      );
    }, [orders]);

  if (!staff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm text-zinc-500 shadow-sm">
          Checking authentication...
        </div>
      </main>
    );
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
              Staff Orders
            </h1>

            <p className="mt-1 text-xs text-zinc-500">
              {staff.email}
              {" · "}
              {staff.role}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/tables"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Tables & QR
            </Link>

            <Link
              href="/festivals"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              Festival Menu
            </Link>

            <button
              type="button"
              onClick={
                loadOrders
              }
              disabled={loading}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500">
            Loading orders...
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-4">
            {STATUS_ORDER.map(
              (status) => (
                <section
                  key={status}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-700">
                      {status}
                    </h2>

                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                      {
                        groupedOrders[
                          status
                        ].length
                      }
                    </span>
                  </div>

                  <div className="space-y-4">
                    {groupedOrders[
                      status
                    ].length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-400">
                        No orders
                      </div>
                    ) : (
                      groupedOrders[
                        status
                      ].map(
                        (order) => (
                          <StaffOrderCard
                            key={
                              order.id
                            }
                            order={
                              order
                            }
                            onAdvance={
                              handleAdvance
                            }
                            busy={
                              busyOrderId ===
                              order.id
                            }
                          />
                        ),
                      )
                    )}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}