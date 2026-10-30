"use server";
import { requestPasswordReset, resetPassword } from "lib/api/password-reset";
import { ApiError } from "lib/api/errors";
import { validatePasswordReset } from "lib/validation/customer-v110";

export type PasswordState = { error?: string; success?: boolean };

export async function forgotPasswordAction(
  _state: PasswordState,
  data: FormData,
): Promise<PasswordState> {
  const email = String(data.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Informe um e-mail válido." };
  try {
    await requestPasswordReset(email);
    return { success: true };
  } catch {
    return {
      error:
        "Não foi possível solicitar a recuperação. Tente novamente mais tarde.",
    };
  }
}

export async function resetPasswordAction(
  _state: PasswordState,
  data: FormData,
): Promise<PasswordState> {
  const token = String(data.get("token") ?? "");
  const password = String(data.get("newPassword") ?? "");
  const error = validatePasswordReset(
    token,
    password,
    String(data.get("confirmation") ?? ""),
  );
  if (error) return { error };
  try {
    await resetPassword(token, password);
    return { success: true };
  } catch (cause) {
    return {
      error:
        cause instanceof ApiError &&
        [400, 401, 403, 404, 410, 422].includes(cause.status)
          ? "Link inválido, utilizado ou expirado. Solicite um novo link de recuperação."
          : "Não foi possível confirmar a alteração. Tente entrar com a nova senha ou solicite outro link.",
    };
  }
}
