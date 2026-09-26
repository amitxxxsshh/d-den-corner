import { apiRequest } from "./api";

export async function getStaffTables(
  staffUserId,
) {
  return apiRequest(
    "/api/staff/tables",
    {
      headers: {
        "X-Staff-User-Id":
          staffUserId,
      },
    },
  );
}

export async function openTable(
  tableId,
  staffUserId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/open`,
    {
      method: "POST",
      headers: {
        "X-Staff-User-Id":
          staffUserId,
      },
    },
  );
}

export async function closeTable(
  tableId,
  staffUserId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/close`,
    {
      method: "POST",
      headers: {
        "X-Staff-User-Id":
          staffUserId,
      },
    },
  );
}

export async function generateTableQR(
  tableId,
  staffUserId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/qr`,
    {
      method: "POST",
      headers: {
        "X-Staff-User-Id":
          staffUserId,
      },
    },
  );
}

export async function revokeTableQR(
  tableId,
  qrId,
  staffUserId,
) {
  return apiRequest(
    `/api/staff/tables/${encodeURIComponent(
      tableId,
    )}/qr/${encodeURIComponent(
      qrId,
    )}/revoke`,
    {
      method: "POST",
      headers: {
        "X-Staff-User-Id":
          staffUserId,
      },
    },
  );
}