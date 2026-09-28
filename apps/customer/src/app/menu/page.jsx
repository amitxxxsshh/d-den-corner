"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import CustomerHeader from "../../components/customer/CustomerHeader";
import MenuPageContent from "../../components/menu/MenuPageContent";
import MenuItemDetails from "../../components/menu/MenuItemDetails";
import MenuJoin from "../../components/menu/MenuJoin";

import CartBar from "../../components/cart/CartBar";
import CartDrawer from "../../components/cart/CartDrawer";

import { useCart } from "../../components/cart/CartContext";
import { useCustomerSession } from "../../components/customer/CustomerSessionContext";

function MenuPageWithSearchParams() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    status,
    isAuthenticated,
  } = useCustomerSession();

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [cartOpen, setCartOpen] =
    useState(false);

  const { addItem } = useCart();

  /*
   * Token is the ONLY entry point into
   * table ordering when there is no session.
   */
  if (token) {
    return <MenuJoin token={token} />;
  }

  /*
   * Wait until the existing customer session
   * provider has finished checking the session.
   */
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-cream-soft flex flex-col">
        <CustomerHeader subtitle="MENU" />
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="text-center">
            <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
              <div className="h-2 w-2 rounded-full bg-amber-warm animate-pulse" />
            </div>
            <p className="mt-4 text-sm font-medium text-charcoal-deep/70 font-serif">
              Preparing D Den Corner Menu...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Any authenticated customer session can order.
   * No session = public view-only menu.
   */
  const orderingEnabled = isAuthenticated;

  function handleAdd(item) {
    if (!orderingEnabled) {
      return;
    }

    addItem(item);
    setSelectedItem(null);
  }

  return (
    <div className="min-h-screen bg-cream-soft text-charcoal-deep flex flex-col">
      {/* Exactly ONE Responsive Navbar */}
      <CustomerHeader subtitle={orderingEnabled ? "TABLE ORDERING" : "EXPLORE MENU"} />

      <MenuPageContent
        onItemSelect={
          orderingEnabled
            ? setSelectedItem
            : undefined
        }
      />

      {orderingEnabled && selectedItem ? (
        <MenuItemDetails
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={handleAdd}
        />
      ) : null}

      {orderingEnabled ? (
        <>
          <CartBar onClick={() => setCartOpen(true)} />

          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}

function MenuPageFallback() {
  return (
    <main className="min-h-screen bg-cream-soft flex flex-col">
      <CustomerHeader subtitle="MENU" />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="text-center">
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-stone/30" />
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-amber-warm" />
            <div className="h-2 w-2 rounded-full bg-amber-warm animate-pulse" />
          </div>
          <p className="mt-4 text-sm font-medium text-charcoal-deep/70">
            Loading menu...
          </p>
        </div>
      </div>
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuPageFallback />}>
      <MenuPageWithSearchParams />
    </Suspense>
  );
}