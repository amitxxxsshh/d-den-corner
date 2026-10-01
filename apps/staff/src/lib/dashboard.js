import { apiRequest } from "./api";

export async function getStaffDashboardRevenue(timeZone) {
  const query = timeZone ? `?timeZone=${encodeURIComponent(timeZone)}` : "";
  return apiRequest(`/api/staff/dashboard/revenue${query}`);
}

export async function getStaffOrderHistory({
  page = 1,
  limit = 10,
  status = "",
} = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (status) params.set("status", String(status));

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/api/staff/dashboard/history${query}`);
}

export async function runOrderHistoryCleanup() {
  return apiRequest("/api/staff/dashboard/cleanup", {
    method: "POST",
  });
}
