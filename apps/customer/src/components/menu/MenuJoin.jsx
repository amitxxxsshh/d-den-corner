"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CustomerHeader from "../customer/CustomerHeader";
import LoadingState from "../customer/LoadingState";
import ErrorState from "../customer/ErrorState";
import { useCustomerSession } from "../customer/CustomerSessionContext";
import { joinTableWithQRToken } from "../../lib/qr";

export default function MenuJoin({ token }) {
  const router = useRouter();

  const {
    refreshSession,
  } = useCustomerSession();

  const [status, setStatus] =
    useState("joining");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");

      setErrorMessage(
        "No ordering link was provided. Please use the ordering link for your table.",
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

        /*
         * Refresh the existing global customer
         * session so /menu immediately enters
         * ordering mode.
         */
        await refreshSession();

        if (cancelled) {
          return;
        }

        /*
         * Remove the secret token from the
         * visible URL and browser history.
         */
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
            "We could not connect you to this table. Please use the ordering link for your table again.",
        );
      }
    }

    joinTable();

    return () => {
      cancelled = true;
    };
  }, [
    router,
    token,
    refreshSession,
  ]);

  if (status === "joining") {
    return (
      <>
        <CustomerHeader />

        <LoadingState
          message="Connecting you to your table..."
        />
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <CustomerHeader />

        <ErrorState
          title="Unable to connect"
          message={errorMessage}
        />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">
            Your table session is active.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Opening the ordering menu...
          </p>
        </div>
      </div>
    </main>
  );
}