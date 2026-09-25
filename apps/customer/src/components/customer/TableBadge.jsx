"use client";

import { getTableFromSession } from "../../lib/table";
import { useCustomerSession } from "./CustomerSessionContext";

export default function TableBadge() {
  const { session, status } = useCustomerSession();

  if (status !== "authenticated") {
    return null;
  }

  const table = getTableFromSession(session);

  if (!table?.tableName) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-green-500"
      />

      <span className="text-xs font-semibold text-gray-700">
        {table.tableName}
      </span>
    </div>
  );
}