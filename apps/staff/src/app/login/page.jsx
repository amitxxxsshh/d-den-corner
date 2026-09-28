"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { DDenStaffLogo } from "../../components/StaffIcons";

import {
  getCurrentStaff,
  loginStaff,
} from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        await getCurrentStaff();

        if (mounted) {
          router.replace("/");
        }
      } catch {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setError(
        "Enter your email address.",
      );
      return;
    }

    if (!password) {
      setError(
        "Enter your password.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await loginStaff(
        email,
        password,
      );

      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-charcoal-deep px-4 text-cream-soft">
        <div className="rounded-3xl border border-stone/30 bg-charcoal-green/50 p-8 text-center shadow-xl">
          <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
          </div>
          <p className="mt-4 text-xs font-semibold text-stone">
            Verifying staff authentication...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-charcoal-deep px-4 py-12 text-cream-soft">
      {/* Warm ambient rooftop lantern glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-warm/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-forest-dark/30 blur-2xl" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <DDenStaffLogo className="h-12 w-12" />

          <h1 className="mt-4 text-2xl sm:text-3xl font-bold font-serif text-cream-soft tracking-tight">
            Staff Sign In
          </h1>

          <p className="mt-1 text-xs text-stone max-w-xs">
            Access live kitchen operations, tables, and menu management.
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-amber-warm/30 bg-cream-soft p-6 sm:p-8 text-charcoal-deep shadow-2xl"
        >
          {/* Subtle checker accent */}
          <div className="checker-strip-subtle opacity-30 -mx-8 -mt-8 mb-6 h-1.5" />

          {error ? (
            <div className="mb-5 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-xs text-terracotta font-medium">
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70"
              >
                Staff Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="staff@ddencorner.local"
                disabled={loading}
                className="w-full rounded-xl border border-stone/60 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-charcoal-deep outline-none transition focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20 disabled:bg-stone/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-charcoal-deep/70"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your operational password"
                disabled={loading}
                className="w-full rounded-xl border border-stone/60 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-charcoal-deep outline-none transition focus:border-amber-warm focus:ring-2 focus:ring-amber-warm/20 disabled:bg-stone/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full min-h-[46px] items-center justify-center rounded-2xl bg-amber-warm px-5 py-3 text-xs font-bold text-charcoal-black hover:bg-amber-light transition shadow-md amber-glow disabled:cursor-not-allowed disabled:bg-stone/40"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal-black border-t-transparent" />
                  <span>Verifying credentials...</span>
                </div>
              ) : (
                "Sign In to Operations"
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-stone/60">
          Authorized personnel only · D Den Corner Restaurant Operations
        </p>
      </div>
    </main>
  );
}