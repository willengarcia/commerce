import "server-only";

import type { AddressResponseDTO } from "./addresses";
import { getSessionToken } from "./auth";
import { apiFetch } from "./client";
import { ApiError } from "./errors";

export type OrderItemDTO = {
  nomeProduto: string;
  skuProduto: string;
  quantidade: number;
  precoUnitario: number;
  subTotal: number;
  productId: number;
};

export type OrderResponseDTO = {
  orderId: number;
  valorTotal: number;
  status: string;
  customer: {
    id: number;
    nomeCompleto: string;
    cpf: string;
    email: string;
    telefone: string;
    status: string;
  };
  address: AddressResponseDTO;
  items: OrderItemDTO[];
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  if (!token)
    throw new ApiError(401, "Sua sessão expirou. Entre novamente.", null);
  return { Authorization: `Bearer ${token}` };
}

export async function createOrder(
  cartId: number,
  addressId: number,
): Promise<OrderResponseDTO> {
  return apiFetch<OrderResponseDTO>("/orders", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ cartId, addressId }),
    cache: "no-store",
  });
}

export async function getOrders(): Promise<OrderResponseDTO[]> {
  return apiFetch<OrderResponseDTO[]>("/orders/me", {
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function getOrder(orderId: number): Promise<OrderResponseDTO> {
  return apiFetch<OrderResponseDTO>(`/orders/${orderId}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
}

export async function updateOrderAddress(
  orderId: number,
  addressId: number,
): Promise<OrderResponseDTO> {
  return apiFetch<OrderResponseDTO>(`/orders/${orderId}/address`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({ addressId }),
    cache: "no-store",
  });
}
