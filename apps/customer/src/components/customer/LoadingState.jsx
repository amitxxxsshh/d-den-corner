export default function LoadingState({
  message = "Loading...",
}) {
  return (
    <div className="flex min-h-[240px] items-center justify-center px-6">
      <div className="text-center">
        <div
          aria-hidden="true"
          className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
        />

        <p className="mt-4 text-sm text-gray-500">
          {message}
        </p>
      </div>
    </div>
  );
}