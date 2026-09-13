"use server";

import { ApiError } from "lib/api/errors";
import { updateOrderAddress } from "lib/api/orders";
import { revalidatePath } from "next/cache";

export type OrderActionState = { error?: string; success?: string };

export async function updateOrderAddressAction(
  orderId: number,
  _state: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const addressId = Number(formData.get("addressId"));
  if (!Number.isSafeInteger(addressId) || addressId <= 0) {
    return { error: "Selecione um endereço." };
  }
  try {
    await updateOrderAddress(orderId, addressId);
    revalidatePath(`/account/orders/${orderId}`);
    return { success: "Endereço atualizado." };
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Não foi possível atualizar o endereço.",
    };
  }
}
