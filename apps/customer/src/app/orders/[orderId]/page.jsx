"use client";

import { useParams } from "next/navigation";

import CustomerHeader from "../../../components/customer/CustomerHeader";
import TableBadge from "../../../components/customer/TableBadge";
import RunningOrder from "../../../components/orders/RunningOrder";

export default function OrderPage() {
  const params = useParams();

  const orderId =
    params?.orderId;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <CustomerHeader
        title="D Den Corner"
        subtitle="Your order"
        rightContent={
          <TableBadge />
        }
      />

      <section className="px-4 py-5">
        <RunningOrder
          orderId={orderId}
        />
      </section>
    </main>
  );
}