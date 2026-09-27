"use client";

export default function TableCard({
  table,
  generatedQR,
  busy,
  onOpen,
  onClose,
  onGenerateQR,
}) {
  const isOpen =
    Boolean(table.activeSession);

  const hasQR =
    Boolean(table.qr);

  const qrIsActive =
    Boolean(table.qr?.active);

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Table
          </p>

          <h2 className="mt-1 text-xl font-bold text-zinc-950">
            {table.name}
          </h2>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            isOpen
              ? "bg-emerald-100 text-emerald-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Table session
        </p>

        <p className="mt-1 text-sm text-zinc-700">
          {isOpen
            ? `Started ${new Date(
                table.activeSession.started_at,
              ).toLocaleString()}`
            : "No active session"}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-zinc-900">
              Ordering link
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {hasQR
                ? qrIsActive
                  ? "Active and usable"
                  : "Inactive until table is opened"
                : "No ordering link assigned"}
            </p>
          </div>

          {hasQR ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                qrIsActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {qrIsActive
                ? "ACTIVE"
                : "INACTIVE"}
            </span>
          ) : null}
        </div>

        {table.qr?.createdAt ? (
          <p className="mt-3 text-xs text-zinc-400">
            Assigned{" "}
            {new Date(
              table.qr.createdAt,
            ).toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        {isOpen ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onClose(table.id)
            }
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50"
          >
            {busy
              ? "Closing table..."
              : "Close table"}
          </button>
        ) : (
          <button
            type="button"
            disabled={
              busy ||
              !hasQR
            }
            onClick={() =>
              onOpen(table.id)
            }
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Opening table..."
              : hasQR
                ? "Open table"
                : "Assign ordering link first"}
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() =>
          onGenerateQR(table.id)
        }
        className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50"
      >
        {hasQR
          ? "Replace ordering link"
          : "Create ordering link"}
      </button>

      {table.qr ? (
        <div className="mt-3 rounded-2xl bg-zinc-50 p-4">
          <p className="text-center text-xs text-zinc-500">
            This ordering link is permanently associated
            with this table until replaced.
          </p>

          <p className="mt-2 text-center text-xs text-zinc-400">
            Create the physical QR code yourself in Canva
            using the ordering link.
          </p>
        </div>
      ) : null}

      {generatedQR ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-5">
          <p className="text-center text-sm font-bold text-zinc-900">
            {hasQR
              ? "Replacement ordering link generated"
              : "Ordering link created"}
          </p>

          <p className="mt-1 text-center text-xs text-zinc-500">
            Copy this link into your Canva QR code.
          </p>

          <div className="mt-4 rounded-xl bg-white p-4">
            <p className="break-all text-center text-xs text-zinc-700">
              {generatedQR.url}
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard?.writeText(
                  generatedQR.url,
                )
              }
              className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm"
            >
              Copy link
            </button>

            <button
              type="button"
              onClick={() =>
                window.open(
                  generatedQR.url,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="flex-1 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Test link
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            The secret token is shown only when the link is
            created or replaced.
          </p>
        </div>
      ) : null}
    </article>
  );
}