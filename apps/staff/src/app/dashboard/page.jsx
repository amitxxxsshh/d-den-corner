"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentStaff, logoutStaff } from "../../lib/auth";
import {
  getStaffDashboardRevenue,
  getStaffOrderHistory,
  runOrderHistoryCleanup,
} from "../../lib/dashboard";

import StaffNavbar from "../../components/StaffNavbar";

function formatPrice(minor) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(minor || 0) / 100);
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const STATUS_CONFIG = {
  ACCEPTED: {
    label: "Accepted",
    badge: "bg-amber-warm/25 text-charcoal-deep border-amber-warm/50 font-bold",
  },
  PREPARING: {
    label: "Kitchen Prep",
    badge: "bg-charcoal-deep text-amber-light border-amber-warm/30 font-bold",
  },
  READY: {
    label: "Ready to Serve",
    badge: "bg-forest/20 text-forest border-forest/40 font-extrabold",
  },
  SERVED: {
    label: "Served",
    badge: "bg-green-muted/20 text-forest border-green-muted/30 font-semibold",
  },
};

export default function StaffDashboardPage() {
  const router = useRouter();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [cleanupMessage, setCleanupMessage] = useState("");
  const [cleanupRunning, setCleanupRunning] = useState(false);

  // Revenue State
  const [revenue, setRevenue] = useState({
    today: { revenueMinor: 0, ordersCount: 0, date: "" },
    month: { revenueMinor: 0, ordersCount: 0, month: "" },
    timeZone: "Asia/Kolkata",
  });

  // History State
  const [historyOrders, setHistoryOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [selectedStatus, setSelectedStatus] = useState("");

  const loadRevenueData = useCallback(async () => {
    try {
      setRevenueLoading(true);
      const data = await getStaffDashboardRevenue();
      setRevenue({
        today: data.today || { revenueMinor: 0, ordersCount: 0, date: "" },
        month: data.month || { revenueMinor: 0, ordersCount: 0, month: "" },
        timeZone: data.timeZone || "Asia/Kolkata",
      });
    } catch (err) {
      console.error("Failed to load revenue:", err);
      setError(err instanceof Error ? err.message : "Unable to load revenue.");
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const loadHistoryData = useCallback(
    async (pageToLoad = pagination.page, statusFilter = selectedStatus) => {
      try {
        setHistoryLoading(true);
        const data = await getStaffOrderHistory({
          page: pageToLoad,
          limit: pagination.limit,
          status: statusFilter,
        });
        setHistoryOrders(data.orders || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error("Failed to load order history:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load order history.",
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [pagination.page, pagination.limit, selectedStatus],
  );

  const refreshAll = useCallback(async () => {
    setError("");
    setCleanupMessage("");
    await Promise.all([loadRevenueData(), loadHistoryData(pagination.page)]);
  }, [loadRevenueData, loadHistoryData, pagination.page]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const response = await getCurrentStaff();
        if (!mounted) return;
        setStaff(response.user);

        await Promise.all([
          loadRevenueData(),
          loadHistoryData(1, selectedStatus),
        ]);
      } catch {
        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [router, loadRevenueData, loadHistoryData, selectedStatus]);

  async function handleLogout() {
    try {
      await logoutStaff();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  async function handlePageChange(newPage) {
    if (newPage < 1 || newPage > pagination.totalPages || historyLoading) return;
    await loadHistoryData(newPage, selectedStatus);
  }

  async function handleStatusFilterChange(newStatus) {
    setSelectedStatus(newStatus);
    await loadHistoryData(1, newStatus);
  }

  async function handleTriggerCleanup() {
    try {
      setCleanupRunning(true);
      setCleanupMessage("");
      const result = await runOrderHistoryCleanup();
      setCleanupMessage(
        `Retention cleanup completed successfully. ${result.deletedOrdersCount} historical order(s) older than 6 months retired.`,
      );
      await refreshAll();
    } catch (err) {
      setCleanupMessage(
        `Cleanup notice: ${err instanceof Error ? err.message : "Cleanup process could not complete."}`,
      );
    } finally {
      setCleanupRunning(false);
    }
  }

  if (loading || !staff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-soft text-charcoal-deep">
        <div className="rounded-3xl border border-stone/50 bg-white p-8 text-center shadow-sm">
          <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
          </div>
          <p className="mt-4 text-xs font-semibold text-charcoal-deep/60">
            Loading Staff Dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col pb-16">
      <StaffNavbar
        staff={staff}
        onRefresh={refreshAll}
        refreshLoading={revenueLoading || historyLoading}
        onLogout={handleLogout}
      />

      {/* Dashboard Sub-Header / Title Bar */}
      <div className="border-b border-stone/30 bg-white/60 px-4 py-5 sm:px-6 lg:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-gold font-mono">
                D Den Corner Staff
              </span>
              <span className="h-1 w-1 rounded-full bg-charcoal-deep/30" />
              <span className="text-xs font-medium text-charcoal-deep/60">
                Business Timezone: {revenue.timeZone}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold font-serif text-charcoal-deep tracking-tight">
              Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-charcoal-deep/65">
              Order history &amp; dynamic revenue analytics calculated directly from accepted orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshAll}
              disabled={revenueLoading || historyLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone/40 bg-white px-3.5 py-2 text-xs font-semibold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-50 shadow-xs"
            >
              <svg
                className={`h-3.5 w-3.5 text-amber-gold ${
                  revenueLoading || historyLoading ? "animate-spin" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M23 4v6h-6M1 20v-6h6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {error ? (
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-5 py-3.5 text-xs text-terracotta flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={refreshAll}
              className="underline font-bold ml-4"
            >
              Retry
            </button>
          </div>
        ) : null}

        {cleanupMessage ? (
          <div className="rounded-2xl border border-forest/30 bg-forest/10 px-5 py-3 text-xs text-forest flex items-center justify-between">
            <span>{cleanupMessage}</span>
            <button
              type="button"
              onClick={() => setCleanupMessage("")}
              className="text-forest hover:opacity-75 font-bold ml-2"
            >
              ×
            </button>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* REVENUE CARDS                                                */}
        {/* ============================================================ */}
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-deep/70">
              Revenue Metrics
            </h2>
            <span className="text-[11px] font-semibold text-charcoal-deep/50">
              Only qualifying accepted orders contribute
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Today's Revenue */}
            <div className="rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-warm/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-deep/60">
                    Today&apos;s Revenue
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-warm/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-gold uppercase tracking-wider border border-amber-warm/30">
                    {revenue.today.date || "Today"}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal-deep tracking-tight">
                    {revenueLoading ? (
                      <span className="text-charcoal-deep/30 animate-pulse">
                        Calculating...
                      </span>
                    ) : (
                      formatPrice(revenue.today.revenueMinor)
                    )}
                  </div>
                  <p className="mt-1 text-xs text-charcoal-deep/60">
                    From {revenue.today.ordersCount}{" "}
                    {revenue.today.ordersCount === 1 ? "order" : "orders"} accepted
                    on current date
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone/30 flex items-center justify-between text-[11px] text-charcoal-deep/50">
                <span>Timezone: {revenue.timeZone}</span>
                <span className="font-semibold text-forest">Live Calculated</span>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="rounded-3xl border border-stone/50 bg-white p-5 sm:p-6 card-warm-shadow transition-all duration-200 hover:border-stone hover:shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-28 h-28 bg-forest/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-deep/60">
                    Monthly Revenue
                  </span>
                  <span className="inline-flex items-center rounded-full bg-forest/15 px-2.5 py-0.5 text-[10px] font-bold text-forest uppercase tracking-wider border border-forest/30">
                    {revenue.month.month || "Current Month"}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-3xl sm:text-4xl font-extrabold font-serif text-charcoal-deep tracking-tight">
                    {revenueLoading ? (
                      <span className="text-charcoal-deep/30 animate-pulse">
                        Calculating...
                      </span>
                    ) : (
                      formatPrice(revenue.month.revenueMinor)
                    )}
                  </div>
                  <p className="mt-1 text-xs text-charcoal-deep/60">
                    From {revenue.month.ordersCount}{" "}
                    {revenue.month.ordersCount === 1 ? "order" : "orders"} accepted
                    this calendar month
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone/30 flex items-center justify-between text-[11px] text-charcoal-deep/50">
                <span>Month-to-date</span>
                <span className="font-semibold text-forest">Live Calculated</span>
              </div>
            </div>

            {/* 6-Month Retention Info Card */}
            <div className="rounded-3xl border border-stone/50 bg-cream-warm/30 p-5 sm:p-6 card-warm-shadow flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-deep/60">
                    Historical Retention
                  </span>
                  <span className="inline-flex items-center rounded-full bg-stone/50 px-2 py-0.5 text-[10px] font-bold text-charcoal-deep/70 uppercase tracking-wider">
                    6 Months Active
                  </span>
                </div>

                <div className="mt-2.5">
                  <p className="text-xs text-charcoal-deep/75 leading-relaxed">
                    Accepted orders older than 6 months from acceptance are
                    safely removed from database storage to optimize query
                    performance and prevent unbounded storage growth.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone/30 flex items-center justify-between">
                <span className="text-[11px] text-charcoal-deep/50">
                  Active live orders protected
                </span>
                <button
                  type="button"
                  onClick={handleTriggerCleanup}
                  disabled={cleanupRunning}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone/40 bg-white px-2.5 py-1 text-[11px] font-semibold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-50"
                  title="Run retention cleanup"
                >
                  {cleanupRunning ? "Cleaning..." : "Run Cleanup"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* ORDER HISTORY                                                */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif text-charcoal-deep">
                  Order History
                </h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal-deep px-2 text-[10px] font-black text-cream-soft">
                  {pagination.total} {pagination.total === 1 ? "Order" : "Orders"}
                </span>
              </div>
              <p className="text-xs text-charcoal-deep/60 mt-0.5">
                Orders enter history once accepted. Pending / unaccepted orders
                never appear here.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handleStatusFilterChange("")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedStatus === ""
                    ? "bg-charcoal-deep text-cream-soft font-bold"
                    : "bg-white border border-stone/40 text-charcoal-deep/70 hover:bg-cream-warm/40"
                }`}
              >
                All Accepted
              </button>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleStatusFilterChange(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    selectedStatus === key
                      ? "bg-charcoal-deep text-cream-soft font-bold"
                      : "bg-white border border-stone/40 text-charcoal-deep/70 hover:bg-cream-warm/40"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Historical Orders Content */}
          {historyLoading ? (
            <div className="rounded-3xl border border-stone/40 bg-white p-12 text-center text-xs text-charcoal-deep/60 flex flex-col items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone/30 border-t-amber-warm" />
              <span>Loading order history...</span>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone/50 bg-white/60 p-12 text-center text-xs text-charcoal-deep/50 space-y-1">
              <p className="font-bold text-sm text-charcoal-deep/70 font-serif">
                No orders in history
              </p>
              <p>
                {selectedStatus
                  ? `No orders matching status "${selectedStatus}".`
                  : "No accepted orders have been recorded yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-stone/50 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone/30 bg-cream-warm/20 uppercase tracking-wider text-[10px] text-charcoal-deep/60 font-bold">
                    <tr>
                      <th className="px-4 py-3.5 sm:px-6">Order ID</th>
                      <th className="px-4 py-3.5 sm:px-6">Customer / Table</th>
                      <th className="px-4 py-3.5 sm:px-6">Ordered Items</th>
                      <th className="px-4 py-3.5 sm:px-6">Total Amount</th>
                      <th className="px-4 py-3.5 sm:px-6">Accepted At</th>
                      <th className="px-4 py-3.5 sm:px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/20">
                    {historyOrders.map((order) => {
                      const statusConfig =
                        STATUS_CONFIG[order.status] || {
                          label: order.status,
                          badge: "bg-stone/30 text-charcoal-deep/70",
                        };

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-cream-warm/15 transition-colors"
                        >
                          {/* Order ID */}
                          <td className="px-4 py-4 sm:px-6 align-top whitespace-nowrap">
                            <span className="font-mono font-bold text-charcoal-deep text-xs block">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-charcoal-deep/45">
                              Created: {formatDateTime(order.created_at)}
                            </span>
                          </td>

                          {/* Customer / Table */}
                          <td className="px-4 py-4 sm:px-6 align-top">
                            <span className="font-extrabold font-serif text-charcoal-deep text-xs block">
                              {order.table?.name || "Unassigned Table"}
                            </span>
                            {order.table?.locationName ? (
                              <span className="text-[10px] text-charcoal-deep/50 block">
                                {order.table.locationName}
                              </span>
                            ) : null}
                          </td>

                          {/* Items Breakdown */}
                          <td className="px-4 py-4 sm:px-6 align-top">
                            <div className="space-y-1 max-w-xs">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-baseline justify-between gap-3 text-xs"
                                >
                                  <span className="text-charcoal-deep/85 font-medium truncate">
                                    <strong className="text-charcoal-deep font-bold">
                                      {item.quantity}×
                                    </strong>{" "}
                                    {item.item_name_snapshot}
                                  </span>
                                  <span className="text-[11px] text-charcoal-deep/60 shrink-0">
                                    {formatPrice(item.line_total_minor)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="px-4 py-4 sm:px-6 align-top whitespace-nowrap">
                            <span className="text-sm font-extrabold text-charcoal-deep font-serif block">
                              {formatPrice(order.total_amount_minor)}
                            </span>
                          </td>

                          {/* Accepted At */}
                          <td className="px-4 py-4 sm:px-6 align-top whitespace-nowrap text-xs text-charcoal-deep/80">
                            {formatDateTime(order.accepted_at)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 sm:px-6 align-top whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${statusConfig.badge}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="border-t border-stone/30 bg-cream-warm/15 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-xs text-charcoal-deep/60">
                  Showing{" "}
                  <strong>
                    {pagination.total === 0
                      ? 0
                      : (pagination.page - 1) * pagination.limit + 1}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </strong>{" "}
                  of <strong>{pagination.total}</strong> orders
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || historyLoading}
                    className="inline-flex items-center rounded-xl border border-stone/40 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-xs font-semibold text-charcoal-deep px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={
                      pagination.page >= pagination.totalPages || historyLoading
                    }
                    className="inline-flex items-center rounded-xl border border-stone/40 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
