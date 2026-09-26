"use client";

import {
  QRCodeSVG,
} from "qrcode.react";

export default function TableCard({
  table,
  generatedQR,
  busy,
  onOpen,
  onClose,
  onGenerateQR,
  onRevokeQR,
}) {
  const isOpen =
    Boolean(
      table.activeSession,
    );

  const hasQR =
    Boolean(table.qr);

  const qrIsActive =
    Boolean(
      table.qr?.active,
    );

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
          {isOpen
            ? "OPEN"
            : "CLOSED"}
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
              Fixed table QR
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {hasQR
                ? qrIsActive
                  ? "Active and usable"
                  : "Inactive until table is opened"
                : "No QR assigned"}
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
                : "Assign QR first"}
          </button>
        )}
      </div>

      {!hasQR ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onGenerateQR(table.id)
          }
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 disabled:opacity-50"
        >
          Assign fixed QR
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onGenerateQR(table.id)
          }
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-600 disabled:opacity-50"
        >
          Replace physical QR
        </button>
      )}

      {table.qr && !generatedQR ? (
        <div className="mt-3 rounded-2xl bg-zinc-50 p-4">
          <p className="text-center text-xs text-zinc-500">
            This is the fixed QR assigned to this table.
          </p>

          <p className="mt-2 text-center text-xs text-zinc-400">
            Keep the physical QR on this table. Opening and closing the table only changes whether it can be used.
          </p>
        </div>
      ) : null}

      {generatedQR ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-5">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={
                  generatedQR.url
                }
                size={220}
                level="M"
                includeMargin
              />
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-bold text-zinc-900">
            {hasQR
              ? "Replacement QR generated"
              : "Fixed QR assigned"}
          </p>

          <p className="mt-1 text-center text-xs text-zinc-500">
            Print this QR and permanently place it on this table.
          </p>

          <p className="mt-3 break-all text-center text-xs text-zinc-400">
            {generatedQR.url}
          </p>

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
              Open menu
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            The raw QR token is shown only during generation. The database stores its hash.
          </p>
        </div>
      ) : null}
    </article>
  );
}