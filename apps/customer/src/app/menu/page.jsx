"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import MenuPageContent from "../../components/menu/MenuPageContent";
import MenuItemDetails from "../../components/menu/MenuItemDetails";
import MenuJoin from "../../components/menu/MenuJoin";

import CartBar from "../../components/cart/CartBar";
import CartDrawer from "../../components/cart/CartDrawer";

import { useCart } from "../../components/cart/CartContext";

function MenuPageWithSearchParams() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [cartOpen, setCartOpen] =
    useState(false);

  const { addItem } = useCart();

  if (token) {
    return (
      <MenuJoin
        token={token}
      />
    );
  }

  function handleAdd(item) {
    addItem(item);
    setSelectedItem(null);
  }

  return (
    <>
      <MenuPageContent
        onItemSelect={
          setSelectedItem
        }
      />

      {selectedItem ? (
        <MenuItemDetails
          item={selectedItem}
          onClose={() =>
            setSelectedItem(null)
          }
          onAdd={handleAdd}
        />
      ) : null}

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
    <Suspense
      fallback={
        <MenuPageFallback />
      }
    >
      <MenuPageWithSearchParams />
    </Suspense>
  );
}