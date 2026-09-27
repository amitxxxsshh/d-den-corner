import { apiRequest } from "./api";

export async function getStaffTables() {
  return apiRequest(
    "/api/staff/tables",
  );
}

export async function openTable(
  tableId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/open`,
    {
      method: "POST",
    },
  );
}

export async function closeTable(
  tableId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/close`,
    {
      method: "POST",
    },
  );
}

export async function generateTableQR(
  tableId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/qr`,
    {
      method: "POST",
    },
  );
}

export async function revokeTableQR(
  tableId,
  qrId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/qr/${encodeURIComponent(
      qrId,
    )}/revoke`,
    {
      method: "POST",
    },
  );
}