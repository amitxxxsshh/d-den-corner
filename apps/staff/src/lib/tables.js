import { apiRequest } from "./api";

export async function getStaffTables() {
  const data = await apiRequest("/api/staff/tables");

  const locations = Array.isArray(data?.locations)
    ? data.locations
    : [];

  const tables = locations.flatMap((location) =>
    Array.isArray(location.tables)
      ? location.tables.map((table) => ({
          ...table,
          locationId: location.id,
          locationName: location.name,
        }))
      : [],
  );

  return {
    ...data,
    tables,
  };
}

export async function openTable(tableId) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(tableId)}/open`,
    {
      method: "POST",
    },
  );
}

export async function closeTable(tableId) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(tableId)}/close`,
    {
      method: "POST",
    },
  );
}

export async function generateTableLink(tableId) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(tableId)}/qr`,
    {
      method: "POST",
    },
  );
}

export async function revokeTableLink(tableId, qrId) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(tableId)}/qr/${encodeURIComponent(qrId)}/revoke`,
    {
      method: "POST",
    },
  );
}