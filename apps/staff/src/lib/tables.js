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

export async function createTable(idOrObj, name, locationId) {
  const payload =
    typeof idOrObj === "object" && idOrObj !== null
      ? idOrObj
      : { id: idOrObj, name, locationId };

  return apiRequest("/api/staff/tables", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

createTable.createTable = createTable;
createTable.getStaffTables = getStaffTables;
createTable.openTable = openTable;
createTable.closeTable = closeTable;

export default createTable;