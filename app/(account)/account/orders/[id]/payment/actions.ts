"use server";

import { ApiError } from "lib/api/errors";
import {
  cancelPayment,
  createPixPayment,
  getPayment,
  getPaymentByOrder,
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

async function findPaymentByOrder(
  orderId: number,
): Promise<PaymentResponseDTO | undefined> {
  try {
    return await getPaymentByOrder(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

function mustReusePayment(payment: PaymentResponseDTO): boolean {
  return ["PENDENTE", "APROVADO", "REEMBOLSADO"].includes(
    payment.statusPagamento,
  );
}

export async function createPaymentAction(
  orderId: number,
  _state: PaymentActionState,
): Promise<PaymentActionState> {
  try {
    const existingPayment = await findPaymentByOrder(orderId);
    if (existingPayment && mustReusePayment(existingPayment)) {
      return { payment: existingPayment };
    }

    try {
      return { payment: await createPixPayment(orderId) };
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 409) throw error;

      const concurrentPayment = await findPaymentByOrder(orderId);
      if (concurrentPayment?.statusPagamento === "PENDENTE") {
        return { payment: concurrentPayment };
      }
      throw error;
    }
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
