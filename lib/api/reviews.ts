import "server-only";
import { getSessionToken } from "./auth";
import { apiFetch } from "./client";
import { ApiError } from "./errors";
import type { PageResponse } from "./types";

export type Review = {
  id: number;
  productId: number;
  nota: number;
  comentario: string | null;
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
  nomeCliente: string;
  dataCriacao: string;
  dataAtualizacao: string;
};
export type ReviewInput = { nota: number; comentario: string };
async function authHeaders() {
  const token = await getSessionToken();
  if (!token)
    throw new ApiError(401, "Entre na sua conta para continuar.", null);
  return { Authorization: `Bearer ${token}` };
}
const pagination = (page: number) =>
  `page=${page}&size=10&sort=dataCriacao,desc`;
export function getProductReviews(productId: number, page = 0) {
  return apiFetch<PageResponse<Review>>(
    `/products/${productId}/reviews?${pagination(page)}`,
    { cache: "no-store" },
  );
}
export async function getMyReviews(page = 0) {
  return apiFetch<PageResponse<Review>>(`/reviews/me?${pagination(page)}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
}
export async function createReview(productId: number, input: ReviewInput) {
  return apiFetch<Review>(`/products/${productId}/reviews`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
    cache: "no-store",
  });
}
export async function updateReview(id: number, input: ReviewInput) {
  return apiFetch<Review>(`/reviews/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
    cache: "no-store",
  });
}
export async function deleteReview(id: number) {
  await apiFetch(`/reviews/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
    cache: "no-store",
  });
}
