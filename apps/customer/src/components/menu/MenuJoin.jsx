"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CustomerHeader from "../customer/CustomerHeader";
import LoadingState from "../customer/LoadingState";
import ErrorState from "../customer/ErrorState";
import { joinTableWithQRToken } from "../../lib/qr";

export default function MenuJoin({ token }) {
  const router = useRouter();

  const [status, setStatus] = useState("joining");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(
        "No QR code token was provided. Please scan the QR code on your table.",
      );
      return;
    }

    let cancelled = false;

    async function joinTable() {
      try {
        setStatus("joining");

        await joinTableWithQRToken(token);

        if (cancelled) {
          return;
        }

        window.history.replaceState(
          {},
          "",
          window.location.pathname,
        );

        router.replace("/menu");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error?.message ||
            "We could not connect you to this table. Please scan the QR code again.",
        );
      }
    }

    joinTable();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  if (status === "joining") {
    return (
      <main className="min-h-screen bg-white">
        <CustomerHeader
          title="D Den Corner"
          subtitle="Connecting to your table"
        />

        <LoadingState message="Joining your table..." />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-white">
        <CustomerHeader
          title="D Den Corner"
          subtitle="Table connection"
        />

        <ErrorState
          title="Unable to join table"
          message={errorMessage}
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <CustomerHeader
        title="D Den Corner"
        subtitle="Welcome to our menu"
      />

      <section className="px-4 py-6">
        <div className="rounded-2xl bg-gray-50 p-5">
          <p className="text-sm font-semibold">
            Menu
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Your table session is active.
          </p>
        </div>
      </section>
    </main>
  );
}