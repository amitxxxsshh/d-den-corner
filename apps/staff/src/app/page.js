"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getCurrentStaff,
  logoutStaff,
} from "./../lib/auth";

import {
  advanceOrderStatus,
  getStaffOrders,
} from "../lib/orders";

import StaffNavbar from "../components/StaffNavbar";
import StaffOrderCard from "../components/orders/StaffOrderCard";

const STATUS_ORDER = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
];

const STATUS_TITLES = {
  NEW: { title: "New Orders", color: "bg-amber-warm/20 text-amber-gold border-amber-warm/40" },
  ACCEPTED: { title: "Accepted", color: "bg-amber-warm/25 text-charcoal-deep border-amber-warm/50" },
  PREPARING: { title: "Kitchen Prep", color: "bg-charcoal-deep text-amber-light border-amber-warm/30" },
  READY: { title: "Ready to Serve", color: "bg-forest/20 text-forest border-forest/40" },
};

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
      <main className="flex min-h-screen items-center justify-center bg-cream-soft text-charcoal-deep">
        <div className="rounded-3xl border border-stone/50 bg-white p-8 text-center shadow-sm">
          <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
          </div>
          <p className="mt-4 text-xs font-semibold text-charcoal-deep/60">
            Verifying staff credentials...
          </p>
        </div>
      </main>
    );
  }

  const totalActive = orders.length;

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-16">
      {/* Exactly ONE Unified Responsive Staff Navbar */}
      <StaffNavbar
        staff={staff}
        onRefresh={loadOrders}
        refreshLoading={loading}
        onLogout={handleLogout}
      />

      {/* Operational Dashboard Title Bar */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Live Kitchen &amp; Floor Operations
              </h1>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2">
                {totalActive} {totalActive === 1 ? "Order" : "Orders"}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Manage incoming customer table orders through kitchen stages. Updates automatically.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-charcoal-deep/60">
            <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
            <span>Real-time polling active (5s)</span>
          </div>
        </div>
      </div>

      {/* Kanban Order Columns */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta">
            {error}
          </div>
        ) : null}

        {loading && orders.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-stone/40 bg-white p-8 text-center text-xs text-charcoal-deep/60">
            Loading operational orders...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {STATUS_ORDER.map((status) => {
              const statusItems = groupedOrders[status] || [];
              const config = STATUS_TITLES[status];

              return (
                <section
                  key={status}
                  className="flex flex-col rounded-3xl border border-stone/40 bg-cream-warm/30 p-3 sm:p-4"
                >
                  {/* Column Header */}
                  <div className="mb-3.5 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-charcoal-deep" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-deep">
                        {config.title}
                      </h2>
                    </div>

                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal-deep px-1.5 text-[10px] font-black text-cream-soft">
                      {statusItems.length}
                    </span>
                  </div>

                  {/* Orders In This Status */}
                  <div className="space-y-3.5 flex-1">
                    {statusItems.length === 0 ? (
                      <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-stone/50 bg-white/40 p-4 text-center text-xs text-charcoal-deep/40 font-medium">
                        No orders in this stage
                      </div>
                    ) : (
                      statusItems.map((order) => (
                        <StaffOrderCard
                          key={order.id}
                          order={order}
                          onAdvance={handleAdvance}
                          busy={busyOrderId === order.id}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}