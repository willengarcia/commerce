import "server-only";

import { getSessionToken } from "./auth";
import { apiFetch } from "./client";
import { ApiError } from "./errors";

export type PaymentResponseDTO = {
  id: number;
  orderId: number;
  metodoPagamento: "PIX";
  statusPagamento: string;
  provider: string;
  valor: number;
  externalId: string;
  qrCodePix: string | null;
  pixCopiaCola: string | null;
  urlBoleto: string | null;
  codigoBarrasBoleto: string | null;
  dataPagamento: string | null;
  dataExpiracao: string;
  dataCriacao: string;
  dataAtualizacao: string;
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
