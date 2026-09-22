import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { getSessionToken } from "./auth";
import { apiFetch } from "./client";
import { ApiError } from "./errors";

export const CART_COOKIE = "cartId";

export type CartProductDTO = {
  id: number;
  nome: string;
  slug: string;
  descricaoCurta: string;
  descricao: string;
  preco: number;
  sku: string;
};

export type CartItemDTO = {
  cartItemId: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  products: CartProductDTO;
};

export type CartDTO = {
  id: number;
  status: string;
  valorTotal: number;
  dataCriacao: string;
  dataAtualizacao: string;
  customerId: number;
};

export type CartDetailsDTO = {
  cartItems: CartItemDTO[];
  cart: CartDTO;
  customer: {
    id: number;
    nomeCompleto: string;
    cpf: string;
    email: string;
    telefone: string;
    status: string;
  };
  address: unknown | null;
};

export type CurrentCartResolution = {
  cart: CartDetailsDTO | undefined;
  recoveredCartId?: number;
  clearCachedCartId?: boolean;
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  if (!token) throw new ApiError(401, "Entre para acessar o carrinho.", null);
  return { Authorization: `Bearer ${token}` };
}

export async function createCart(): Promise<CartDTO> {
  return apiFetch<CartDTO>("/carts", {
    method: "POST",
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function getCartById(id: number): Promise<CartDetailsDTO> {
  return apiFetch<CartDetailsDTO>(`/carts/${id}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function getMyActiveCart(): Promise<CartDTO | undefined> {
  try {
    return await apiFetch<CartDTO>("/carts/me", {
      headers: await authHeaders(),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getCartItems(id: number): Promise<CartItemDTO[]> {
  return apiFetch<CartItemDTO[]>(`/carts/${id}/items`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function addCartItem(
  cartId: number,
  productId: number,
): Promise<CartItemDTO> {
  return apiFetch<CartItemDTO>(`/carts/${cartId}/items`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ productId }),
    cache: "no-store",
  });
}

export async function removeCartItem(
  cartId: number,
  cartItemId: number,
): Promise<void> {
  await apiFetch<null>(`/carts/${cartId}/items/${cartItemId}`, {
    method: "DELETE",
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function deleteCart(id: number): Promise<void> {
  await apiFetch<null>(`/carts/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function getCartId(): Promise<number | undefined> {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  if (!value) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export async function setCartId(id: number): Promise<void> {
  (await cookies()).set(CART_COOKIE, String(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearCartId(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}

async function resolveCurrentCart(): Promise<CurrentCartResolution> {
  const [token, cartId] = await Promise.all([getSessionToken(), getCartId()]);
  if (!token) {
    return { cart: undefined, clearCachedCartId: Boolean(cartId) };
  }

  if (cartId) {
    try {
      const cachedCart = await getCartById(cartId);
      if (cachedCart.cart.status === "ATIVO") return { cart: cachedCart };
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        ![403, 404, 409].includes(error.status)
      ) {
        throw error;
      }
    }
  }

  const activeCart = await getMyActiveCart();
  if (!activeCart) {
    return { cart: undefined, clearCachedCartId: Boolean(cartId) };
  }

  const cart = await getCartById(activeCart.id);
  if (cart.cart.status !== "ATIVO") {
    return { cart: undefined, clearCachedCartId: Boolean(cartId) };
  }

  return {
    cart,
    recoveredCartId: activeCart.id !== cartId ? activeCart.id : undefined,
  };
}

export const getCurrentCartResolution = cache(resolveCurrentCart);

export async function getCurrentCart(): Promise<CartDetailsDTO | undefined> {
  return (await getCurrentCartResolution()).cart;
}
