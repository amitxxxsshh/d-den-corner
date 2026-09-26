"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "../../components/cart/CartContext";

import CheckoutSummary from "../../components/checkout/CheckoutSummary";

import {
  createOrder,
} from "../../lib/checkout";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items,
    subtotalMinor,
    clearCart,
  } = useCart();

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleBack() {
    router.push("/menu");
  }

  async function handlePlaceOrder() {
    if (
      !items ||
      items.length === 0
    ) {
      setError(
        "Your cart is empty.",
      );

      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        await createOrder(items);

      const orderId =
        response?.order?.id ||
        response?.id;

      if (!orderId) {
        throw new Error(
          "Order was created, but no order ID was returned.",
        );
      }

      clearCart();

      router.push(
        `/order-confirmation?orderId=${encodeURIComponent(
          orderId,
        )}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to place your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CheckoutSummary
      items={items}
      subtotalMinor={subtotalMinor}
      onBack={handleBack}
      onPlaceOrder={
        handlePlaceOrder
      }
      submitting={submitting}
      error={error}
    />
  );
}