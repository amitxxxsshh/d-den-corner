"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  calculateCartItemCount,
  calculateCartSubtotal,
  createCartItem,
} from "../../lib/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((menuItem) => {
    setItems((currentItems) => {
      const existing = currentItems.find(
        (item) => item.menuItemId === menuItem.id,
      );

      if (existing) {
        return currentItems.map((item) =>
          item.menuItemId === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentItems,
        createCartItem(menuItem),
      ];
    });
  }, []);

  const increaseItem = useCallback((menuItemId) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.menuItemId === menuItemId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }, []);

  const decreaseItem = useCallback((menuItemId) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.menuItemId !== menuItemId,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => calculateCartItemCount(items),
    [items],
  );

  const subtotalMinor = useMemo(
    () => calculateCartSubtotal(items),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotalMinor,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotalMinor,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider.",
    );
  }

  return context;
}