import "server-only";

import { ApiError } from "./errors";
import { apiFetch } from "./client";
import { getSessionToken } from "./auth";
import type { AddressResponseDTO } from "./addresses";

export type CreateCustomerRequestDTO = {
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
};

export type CustomerResponseDTO = {
  id: number;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  status: string;
  addresses: AddressResponseDTO[];
  dataCriacao: string;
  dataAtualizacao: string;
};

export async function createCustomer(
  customer: CreateCustomerRequestDTO,
): Promise<unknown> {
  return apiFetch<unknown>("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
    cache: "no-store",
  });
}

export async function getCurrentCustomer(): Promise<CustomerResponseDTO | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await apiFetch<CustomerResponseDTO>("/customers/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      return null;
    }
    throw error;
  }
}
