import "server-only";

import { cookies } from "next/headers";
import { apiFetch } from "./client";

export const SESSION_COOKIE = "ecommerce_session";

export type LoginRequestDTO = { email: string; senha: string };

export type LoginResponseDTO = {
  id: number;
  nome: string;
  email: string;
  status: string;
  token: string;
};

export async function login(
  credentials: LoginRequestDTO,
): Promise<LoginResponseDTO> {
  return apiFetch<LoginResponseDTO>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    cache: "no-store",
  });
}

export async function setSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
