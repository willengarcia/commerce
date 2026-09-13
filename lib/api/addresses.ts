import "server-only";

import { getSessionToken } from "./auth";
import { apiFetch } from "./client";
import { ApiError } from "./errors";

export type AddressType = "CASA" | "TRABALHO" | "OUTRO";

export type AddressRequestDTO = {
  nomeEndereco: string;
  nomeDestinatario: string;
  cep: string;
  rua: string;
  numero: string;
  cidade: string;
  bairro: string;
  estado: string;
  complemento: string;
  referencia: string;
  tipoEndereco: AddressType;
  enderecoPrincipal: boolean;
};

export type AddressResponseDTO = AddressRequestDTO & {
  id: number;
  dataCriacao: string;
  dataAtualizacao: string;
};

async function authorizationHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  if (!token)
    throw new ApiError(401, "Sua sessão expirou. Entre novamente.", null);
  return { Authorization: `Bearer ${token}` };
}

export async function getAddresses(): Promise<AddressResponseDTO[]> {
  return apiFetch<AddressResponseDTO[]>("/addresses/me", {
    headers: await authorizationHeaders(),
    cache: "no-store",
  });
}

export async function getAddress(id: number): Promise<AddressResponseDTO> {
  return apiFetch<AddressResponseDTO>(`/addresses/${id}`, {
    headers: await authorizationHeaders(),
    cache: "no-store",
  });
}

export async function createAddress(
  address: AddressRequestDTO,
): Promise<unknown> {
  return apiFetch<unknown>("/addresses", {
    method: "POST",
    headers: await authorizationHeaders(),
    body: JSON.stringify(address),
    cache: "no-store",
  });
}

export async function updateAddress(
  id: number,
  address: Partial<AddressRequestDTO>,
): Promise<unknown> {
  return apiFetch<unknown>(`/addresses/${id}`, {
    method: "PATCH",
    headers: await authorizationHeaders(),
    body: JSON.stringify(address),
    cache: "no-store",
  });
}
