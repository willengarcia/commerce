import { ApiError, getApiErrorMessage } from "./errors";

const API_PATH = "/api/v1";

function getBackendUrl(): string {
  const value = process.env.BACKEND_API_URL;
  if (!value) throw new Error("BACKEND_API_URL não está configurada.");
  return value.replace(/\/$/, "");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } = {},
): Promise<T> {
  const { next, ...requestInit } = init;
  const response = await fetch(`${getBackendUrl()}${API_PATH}${path}`, {
    ...requestInit,
    headers: {
      Accept: "application/json",
      ...(requestInit.body ? { "Content-Type": "application/json" } : {}),
      ...requestInit.headers,
    },
    ...(requestInit.cache === "no-store"
      ? {}
      : { next: { revalidate: 300, ...next } }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  const body: unknown =
    contentType.includes("application/json") && rawBody
      ? JSON.parse(rawBody)
      : rawBody || null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getApiErrorMessage(response.status, body),
      body,
    );
  }

  return body as T;
}
