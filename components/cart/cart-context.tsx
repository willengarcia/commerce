"use client";

import type { CartDetailsDTO } from "lib/api/cart";
import { createContext, use, useContext } from "react";

const CartContext = createContext<Promise<CartDetailsDTO | undefined> | null>(
  null,
);

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<CartDetailsDTO | undefined>;
}) {
  return (
    <CartContext.Provider value={cartPromise}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const cartPromise = useContext(CartContext);
  if (!cartPromise) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return use(cartPromise);
}
