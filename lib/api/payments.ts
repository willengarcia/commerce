import "server-only";

import { getSessionToken } from "./auth";
import { apiFetch } from "./client";
import { ApiError } from "./errors";
import type { CardPaymentData } from "lib/validation/customer-v110";

export type PaymentResponseDTO = {
  id: number;
  orderId: number;
  metodoPagamento: "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO";
  statusPagamento:
    | "PENDENTE"
    | "APROVADO"
    | "CANCELADO"
    | "EXPIRADO"
    | "RECUSADO"
    | "REEMBOLSADO";
  provider: string;
  valor: number;
  externalId: string | null;
  qrCodePix: string | null;
  pixCopiaCola: string | null;
  urlBoleto: string | null;
  codigoBarrasBoleto: string | null;
  dataPagamento: string | null;
  dataExpiracao: string | null;
  dataCriacao: string | null;
  dataAtualizacao: string | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  if (!token)
    throw new ApiError(401, "Sua sessão expirou. Entre novamente.", null);
  return { Authorization: `Bearer ${token}` };
}

export async function createPixPayment(
  orderId: number,
): Promise<PaymentResponseDTO> {
  return apiFetch<PaymentResponseDTO>(`/payments/orders/${orderId}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ metodoPagamento: "PIX" }),
    cache: "no-store",
  });
}

export async function getPaymentByOrder(
  orderId: number,
): Promise<PaymentResponseDTO> {
  return apiFetch<PaymentResponseDTO>(`/payments/orders/${orderId}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function createCardPayment(
  orderId: number,
  card: CardPaymentData,
): Promise<PaymentResponseDTO> {
  // Explicit allowlist: never forward the SDK form or raw card information.
  return apiFetch<PaymentResponseDTO>(`/payments/orders/${orderId}`, {
    method: "POST",
    headers: await authHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      metodoPagamento: "CARTAO_CREDITO",
      cartao: {
        token: card.token,
        parcelas: card.parcelas,
        paymentMethodId: card.paymentMethodId,
        issuerId: card.issuerId,
      },
    }),
  });
}

export async function getPayment(
  paymentId: number,
): Promise<PaymentResponseDTO> {
  return apiFetch<PaymentResponseDTO>(`/payments/${paymentId}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function cancelPayment(
  paymentId: number,
): Promise<PaymentResponseDTO> {
  return apiFetch<PaymentResponseDTO>(`/payments/${paymentId}/cancel`, {
    method: "PATCH",
    headers: await authHeaders(),
    cache: "no-store",
  });
}
