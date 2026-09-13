"use server";

import { getSessionToken } from "lib/api/auth";
import {
  addCartItem,
  clearCartId,
  createCart,
  deleteCart,
  getCurrentCart,
  removeCartItem,
  setCartId,
} from "lib/api/cart";
import { ApiError } from "lib/api/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function message(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível atualizar o carrinho. Tente novamente.";
}

export async function addItem(
  productId: number,
  _state: string | undefined,
): Promise<string | undefined> {
  if (!(await getSessionToken())) redirect("/login");
  try {
    const current = await getCurrentCart();
    if (current) {
      await addCartItem(current.cart.id, productId);
    } else {
      const cart = await createCart();
      await setCartId(cart.id);
      await addCartItem(cart.id, productId);
    }
    revalidatePath("/", "layout");
  } catch (error) {
    return message(error);
  }
}

export async function removeItem(
  cartItemId: number,
  _state: string | undefined,
): Promise<string | undefined> {
  try {
    const current = await getCurrentCart();
    if (!current) return "Carrinho não encontrado.";
    await removeCartItem(current.cart.id, cartItemId);
    revalidatePath("/", "layout");
  } catch (error) {
    return message(error);
  }
}

export async function clearCartAction(): Promise<void> {
  const current = await getCurrentCart();
  if (current) await deleteCart(current.cart.id);
  await clearCartId();
  revalidatePath("/", "layout");
}
