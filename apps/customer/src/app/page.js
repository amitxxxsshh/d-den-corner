import Link from "next/link";
import CustomerHeader from "../components/customer/CustomerHeader";
import SessionStatus from "../components/customer/SessionStatus";
import { BotanicalAccent, SunflowerMotif } from "../components/customer/Icons";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep">
      {/* Exactly ONE Navbar */}
      <CustomerHeader
        title="D Den Corner"
        subtitle="ROOFTOP CAFÉ"
      />

      {/* Atmospheric Rooftop Hero (Dark Architecture + Warm Amber Lighting) */}
      <section className="relative overflow-hidden bg-charcoal-deep px-4 py-12 sm:px-6 sm:py-16 text-cream-soft">
        {/* Subtle architectural lighting ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-amber-warm/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-forest-dark/40 blur-2xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Restrained Architectural Arch & Motif */}
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-amber-warm/40" />
            <SunflowerMotif className="w-5 h-5 text-amber-warm" />
            <span className="h-px w-8 bg-amber-warm/40" />
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-amber-light font-medium">
            Rooftop Café &amp; Dining
          </p>

          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-cream-soft font-serif">
            Welcome to D Den Corner
          </h1>

          <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base leading-relaxed text-stone">
            Where dark architectural metal meets warm amber light, open-air breezes, lush greenery, and flavorful artisanal cuisine.
          </p>

          {/* Primary Action Button */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-warm px-6 py-3.5 text-sm font-bold text-charcoal-black transition hover:bg-amber-light shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Explore Our Menu</span>
              <span>→</span>
            </Link>

            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-stone/30 bg-charcoal-green/50 px-5 py-3.5 text-sm font-semibold text-cream-soft transition hover:bg-charcoal-green"
            >
              <span>Running Orders</span>
            </Link>
          </div>
        </div>

        {/* Checker separator along bottom of hero */}
        <div className="absolute inset-x-0 bottom-0 checker-strip-subtle opacity-30" />
      </section>

      {/* Main Content Area: Session Status & Table Experience */}
      <section className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Table Session Card */}
          <SessionStatus />

          {/* D Den Corner Hospitality Highlights */}
          <div className="grid gap-4 sm:grid-cols-3 pt-4">
            <div className="rounded-2xl border border-stone/40 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal-deep text-amber-light mb-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-charcoal-deep font-serif">
                Open-Air Rooftop
              </h3>
              <p className="mt-1 text-xs text-charcoal-deep/70 leading-relaxed">
                Relax under warm hanging lanterns with gentle open skies and garden vibes.
              </p>
            </div>

            <div className="rounded-2xl border border-stone/40 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-dark text-amber-light mb-3">
                <BotanicalAccent className="h-5 w-5 text-amber-light" />
              </div>
              <h3 className="text-sm font-bold text-charcoal-deep font-serif">
                Crafted Dishes
              </h3>
              <p className="mt-1 text-xs text-charcoal-deep/70 leading-relaxed">
                Fresh ingredients, regional specialties, festival creations, and café classics.
              </p>
            </div>

            <div className="rounded-2xl border border-stone/40 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wood-dark text-amber-light mb-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-charcoal-deep font-serif">
                Warm Hospitality
              </h3>
              <p className="mt-1 text-xs text-charcoal-deep/70 leading-relaxed">
                Table-side contactless service directly connected to our kitchen team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Footer Accent */}
      <footer className="mt-12 border-t border-stone/40 bg-charcoal-deep py-6 text-center text-xs text-stone">
        <div className="checker-strip-subtle opacity-20 mb-6" />
        <p className="font-serif text-cream-soft font-semibold">
          D DEN CORNER
        </p>
        <p className="mt-1 text-[11px] text-stone/70">
          Dark Rooftop Café &amp; Warm Hospitality
        </p>
      </footer>
    </main>
  );
}