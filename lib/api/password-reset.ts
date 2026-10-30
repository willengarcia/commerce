import "server-only";
import { apiFetch } from "./client";

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
    cache: "no-store",
  });
}
