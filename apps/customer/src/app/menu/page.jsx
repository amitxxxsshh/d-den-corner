"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
      <main className="min-h-screen bg-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

            <p className="mt-4 text-sm text-gray-500">
              Loading menu...
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
  const orderingEnabled =
    isAuthenticated;

  function handleAdd(item) {
    if (!orderingEnabled) {
      return;
    }

    addItem(item);
    setSelectedItem(null);
  }

  return (
    <>
      <MenuPageContent
        onItemSelect={
          orderingEnabled
            ? setSelectedItem
            : undefined
        }
      />

      {orderingEnabled &&
      selectedItem ? (
        <MenuItemDetails
          item={selectedItem}
          onClose={() =>
            setSelectedItem(null)
          }
          onAdd={handleAdd}
        />
      ) : null}

      {orderingEnabled ? (
        <>
          <CartBar
            onClick={() =>
              setCartOpen(true)
            }
          />

          <CartDrawer
            open={cartOpen}
            onClose={() =>
              setCartOpen(false)
            }
          />
        </>
      ) : null}
    </>
  );
}

function MenuPageFallback() {
  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

          <p className="mt-4 text-sm text-gray-500">
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