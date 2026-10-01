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
  completeOrder,
  getStaffOrders,
} from "../lib/orders";

import StaffNavbar from "../components/StaffNavbar";
import StaffTableGroup from "../components/orders/StaffTableGroup";

function parseTableNumber(name) {
  if (!name) return null;
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function compareTableNamesNumerically(nameA, nameB) {
  const numA = parseTableNumber(nameA);
  const numB = parseTableNumber(nameB);

  if (numA !== null && numB !== null) {
    if (numA !== numB) {
      return numA - numB;
    }
  } else if (numA !== null) {
    return -1;
  } else if (numB !== null) {
    return 1;
  }

  return (nameA || "").localeCompare(nameB || "", undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export default function Home() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [staff, setStaff] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setError("");

      const response = await getStaffOrders();

      setOrders(response.orders || []);
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
        const response = await getCurrentStaff();

        if (!mounted) {
          return;
        }

        setStaff(response.user);

        await loadOrders();
      } catch {
        if (mounted) {
          router.replace("/login");
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

    const interval = window.setInterval(loadOrders, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [staff, loadOrders]);

  async function handleLogout() {
    try {
      await logoutStaff();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  async function handleAcceptOrder(orderId) {
    try {
      setBusyOrderId(orderId);
      setError("");

      const response = await advanceOrderStatus(orderId);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
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

  async function handleCompleteOrder(orderId) {
    try {
      setBusyOrderId(orderId);
      setError("");

      await completeOrder(orderId);

      await loadOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete order.",
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  // Filter only active orders (NEW and ACCEPTED), group by table, and sort tables numerically
  const tableGroups = useMemo(() => {
    const activeOrders = orders.filter(
      (order) => order.status === "NEW" || order.status === "ACCEPTED",
    );

    const map = new Map();

    for (const order of activeOrders) {
      const tableId = order.table?.id || "unassigned";
      const tableName = order.table?.name || "Unassigned Table";

      let group = map.get(tableId);
      if (!group) {
        group = {
          tableId,
          tableName,
          orders: [],
        };
        map.set(tableId, group);
      }
      group.orders.push(order);
    }

    const groups = Array.from(map.values());
    groups.sort((a, b) => compareTableNamesNumerically(a.tableName, b.tableName));

    return groups;
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

  const activeOrdersCount = orders.filter(
    (o) => o.status === "NEW" || o.status === "ACCEPTED",
  ).length;

  const totalNewCount = orders.filter((o) => o.status === "NEW").length;

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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-deep tracking-tight">
                Live Active Table Orders
              </h1>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-forest text-[11px] font-black text-cream-soft px-2.5">
                {activeOrdersCount} {activeOrdersCount === 1 ? "Order" : "Orders"}
              </span>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-charcoal-deep text-[11px] font-black text-cream-soft px-2.5">
                {tableGroups.length} {tableGroups.length === 1 ? "Table" : "Tables"}
              </span>

              {totalNewCount > 0 && (
                <span className="flex h-6 items-center justify-center rounded-full bg-amber-warm px-2.5 text-[11px] font-black text-charcoal-deep animate-pulse">
                  {totalNewCount} New to Accept
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Live customer table orders grouped by dining table. Workflow: NEW → ACCEPTED. Updates automatically.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-charcoal-deep/60">
            <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
            <span>Real-time polling active (5s)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Strict Vertical Layout (One Table Per Row) */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadOrders}
              className="underline font-bold ml-4"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading && orders.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-stone/40 bg-white p-8 text-center text-xs text-charcoal-deep/60 gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone/30 border-t-amber-warm" />
            <span>Loading active table orders...</span>
          </div>
        ) : tableGroups.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone/50 bg-white/60 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-warm/60 border border-stone/40 mb-3">
              <span className="text-xl text-forest font-bold">✓</span>
            </div>
            <h3 className="text-base font-bold font-serif text-charcoal-deep">
              No Active Orders
            </h3>
            <p className="mt-1 max-w-sm text-xs text-charcoal-deep/60">
              There are no pending or active customer table orders right now. New customer orders will appear here automatically.
            </p>
          </div>
        ) : (
          /* Strict Vertical Sequence: TABLE 1 -> TABLE 2 -> TABLE 3 -> TABLE 4 */
          <div className="flex flex-col gap-6 w-full">
            {tableGroups.map((group) => (
              <StaffTableGroup
                key={group.tableId}
                group={group}
                onAcceptOrder={handleAcceptOrder}
                onCompleteOrder={handleCompleteOrder}
                busyOrderId={busyOrderId}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}