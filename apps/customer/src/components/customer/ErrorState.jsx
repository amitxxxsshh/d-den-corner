export default function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-terracotta/20 bg-cream-soft p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="mt-4 text-base font-bold text-charcoal-deep font-serif">
          {title}
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-charcoal-deep/70">
          {message}
        </p>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-charcoal-deep px-5 py-2.5 text-xs font-bold text-cream-soft transition hover:bg-charcoal-green shadow-sm"
          >
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  );
}