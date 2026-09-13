"use server";

import { ApiError } from "lib/api/errors";
import {
  cancelPayment,
  createPixPayment,
  getPayment,
  type PaymentResponseDTO,
} from "lib/api/payments";

export type PaymentActionState = {
  error?: string;
  payment?: PaymentResponseDTO;
};

function message(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível processar o pagamento. Tente novamente.";
}

export async function createPaymentAction(
  orderId: number,
  _state: PaymentActionState,
): Promise<PaymentActionState> {
  try {
    return { payment: await createPixPayment(orderId) };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function refreshPaymentAction(
  paymentId: number,
): Promise<PaymentActionState> {
  try {
    return { payment: await getPayment(paymentId) };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function cancelPaymentAction(
  paymentId: number,
): Promise<PaymentActionState> {
  try {
    return { payment: await cancelPayment(paymentId) };
  } catch (error) {
    return { error: message(error) };
  }
}
