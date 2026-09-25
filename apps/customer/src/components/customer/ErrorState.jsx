export default function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
}) {
  return (
    <div className="flex min-h-[240px] items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          !
        </div>

        <h2 className="mt-4 text-base font-semibold">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {message}
        </p>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}