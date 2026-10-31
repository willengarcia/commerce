"use server";

import { submitCustomerPaymentAction } from "./customer-actions";
import { positiveId } from "lib/validation/customer-v110";
import { ApiError } from "lib/api/errors";
import {
  cancelPayment,
  getPayment,
  type PaymentResponseDTO,
} from "lib/api/payments";
import { revalidatePath } from "next/cache";

export type PaymentActionState = {
  error?: string;
  payment?: PaymentResponseDTO;
};

function message(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível processar o pagamento. Tente novamente.";
}

function revalidatePaymentOrder(payment: PaymentResponseDTO) {
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${payment.orderId}`);
  revalidatePath(`/account/orders/${payment.orderId}/payment`);
}

export async function createPaymentAction(
  orderId: number,
  _state: PaymentActionState,
): Promise<PaymentActionState> {
  return submitCustomerPaymentAction(orderId, null);
}

export async function refreshPaymentAction(
  paymentId: number,
): Promise<PaymentActionState> {
  if (!positiveId(paymentId)) return { error: "Pagamento inválido." };
  try {
    const payment = await getPayment(paymentId);
    revalidatePaymentOrder(payment);
    return { payment };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function cancelPaymentAction(
  paymentId: number,
): Promise<PaymentActionState> {
  if (!positiveId(paymentId)) return { error: "Pagamento inválido." };
  try {
    const payment = await cancelPayment(paymentId);
    revalidatePaymentOrder(payment);
    return { payment };
  } catch (error) {
    return { error: message(error) };
  }
}
