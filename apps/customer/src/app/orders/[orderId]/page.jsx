"use client";

import { useParams } from "next/navigation";

import CustomerHeader from "../../../components/customer/CustomerHeader";
import TableBadge from "../../../components/customer/TableBadge";
import RunningOrder from "../../../components/orders/RunningOrder";

export default function OrderPage() {
  const params = useParams();
  const orderId = params?.orderId;

  return (
    <main className="min-h-screen bg-cream-soft text-charcoal-deep pb-16 flex flex-col">
      {/* Exactly ONE Responsive Navbar */}
      <CustomerHeader
        title="D Den Corner"
        subtitle="ORDER DETAILS"
        rightContent={<TableBadge />}
      />

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <RunningOrder orderId={orderId} />
      </section>
    </main>
  );
}