import CustomerHeader from "../components/customer/CustomerHeader";
import SessionStatus from "../components/customer/SessionStatus";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <CustomerHeader
        title="D Den Corner"
        subtitle="Welcome"
      />

      <section className="px-4 py-6">
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-50 p-5">
            <h2 className="text-lg font-bold">
              Welcome to D Den Corner
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Scan the QR code on your table to start
              ordering.
            </p>
          </div>

          <SessionStatus />
        </div>
      </section>
    </main>
  );
}