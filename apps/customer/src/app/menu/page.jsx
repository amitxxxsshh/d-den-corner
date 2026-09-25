"use client";

import { useState } from "react";

import MenuPageContent from "../../components/menu/MenuPageContent";
import MenuItemDetails from "../../components/menu/MenuItemDetails";

import CartBar from "../../components/cart/CartBar";
import CartDrawer from "../../components/cart/CartDrawer";

import { useCart } from "../../components/cart/CartContext";

export default function MenuPage() {
  const [selectedItem, setSelectedItem] =
    useState(null);

  const [cartOpen, setCartOpen] =
    useState(false);

  const { addItem } = useCart();

  function handleAdd(item) {
    addItem(item);
    setSelectedItem(null);
  }

  return (
    <>
      <MenuPageContent
        onItemSelect={setSelectedItem}
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
        onClick={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
        }}
      />
    </>
  );
}