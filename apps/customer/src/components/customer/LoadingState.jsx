export default function LoadingState({
  message = "Loading...",
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
          <div className="h-2 w-2 rounded-full bg-amber-warm animate-pulse" />
        </div>

        <p className="mt-4 text-sm font-medium text-charcoal-deep/70">
          {message}
        </p>
      </div>
    </div>
  );
}