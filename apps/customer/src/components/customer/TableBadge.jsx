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
    <div className="inline-flex items-center gap-2 rounded-full bg-charcoal-green/90 border border-amber-warm/30 px-3.5 py-1.5 text-xs shadow-sm backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-muted"></span>
      </span>

      <span className="text-[11px] font-medium tracking-wide uppercase text-stone">
        Table
      </span>

      <span className="font-bold text-cream-soft">
        {table.tableName}
      </span>
    </div>
  );
}