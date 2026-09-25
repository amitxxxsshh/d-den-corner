"use client";

import { useCustomerSession } from "./CustomerSessionContext";

export default function SessionStatus() {
  const {
    session,
    status,
    error,
    refreshSession,
  } = useCustomerSession();

  if (status === "loading") {
    return (
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Checking your table session...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">
          Session unavailable
        </p>

        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={refreshSession}
          className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Scan the QR code on your table to start.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-sm font-semibold">
        Table session active
      </p>

      {session?.tableName ? (
        <p className="mt-1 text-sm text-gray-500">
          {session.tableName}
        </p>
      ) : null}
    </div>
  );
}