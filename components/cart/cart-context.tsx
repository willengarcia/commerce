"use client";

import { syncCartCacheAction } from "components/cart/actions";
import type { CurrentCartResolution } from "lib/api/cart";
import { createContext, use, useContext, useEffect } from "react";

const CartContext = createContext<Promise<CurrentCartResolution> | null>(null);

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<CurrentCartResolution>;
}) {
  return (
    <CartContext.Provider value={cartPromise}>
      <CartCacheSync cartPromise={cartPromise} />
      {children}
    </CartContext.Provider>
  );
}

function CartCacheSync({
  cartPromise,
}: {
  cartPromise: Promise<CurrentCartResolution>;
}) {
  const { recoveredCartId, clearCachedCartId } = use(cartPromise);

  useEffect(() => {
    if (recoveredCartId !== undefined) {
      void syncCartCacheAction(recoveredCartId);
    } else if (clearCachedCartId) {
      void syncCartCacheAction();
    }
  }, [clearCachedCartId, recoveredCartId]);

  return null;
}

export function useCart() {
  const cartPromise = useContext(CartContext);
  if (!cartPromise) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return use(cartPromise).cart;
}
