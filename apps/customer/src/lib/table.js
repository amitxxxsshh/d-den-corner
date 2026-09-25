export function getTableFromSession(session) {
  if (!session) {
    return null;
  }

  return {
    tableId: session.tableId || null,
    tableName: session.tableName || null,
    locationId: session.locationId || null,
    tableSessionId: session.tableSessionId || null,
  };
}