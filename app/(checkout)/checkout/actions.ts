"use server";

import { clearCartId, getCurrentCart } from "lib/api/cart";
import { ApiError } from "lib/api/errors";
import { createOrder } from "lib/api/orders";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CheckoutState = { error?: string };

export async function createOrderAction(
  _state: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const addressId = Number(formData.get("addressId"));
  if (!Number.isSafeInteger(addressId) || addressId <= 0) {
    return { error: "Selecione um endereço de entrega." };
  }

  const cart = await getCurrentCart();
  if (!cart) return { error: "Seu carrinho não está mais disponível." };

  let order;
  try {
    order = await createOrder(cart.cart.id, addressId);
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Não foi possível criar o pedido. Tente novamente.",
    };
  }

  await clearCartId();
  revalidatePath("/", "layout");
  revalidatePath("/account/orders");
  redirect(`/account/orders/${order.orderId}`);
}
