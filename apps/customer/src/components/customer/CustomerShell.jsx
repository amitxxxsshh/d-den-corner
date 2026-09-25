export default function CustomerShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        {children}
      </main>
    </div>
  );
}