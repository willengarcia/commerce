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
  const response = await fetch(`${getBackendUrl()}${API_PATH}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    next: { revalidate: 300, ...init.next },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getApiErrorMessage(response.status, body),
      body,
    );
  }

  return body as T;
}
