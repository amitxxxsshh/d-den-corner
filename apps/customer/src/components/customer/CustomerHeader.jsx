export default function CustomerHeader({
  title = "D Den Corner",
  subtitle = "",
  rightContent = null,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-1 truncate text-xs text-gray-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        {rightContent ? (
          <div className="shrink-0">
            {rightContent}
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold"
          >
            DD
          </div>
        )}
      </div>
    </header>
  );
}