"use server";

import { clearSession, login, setSession } from "lib/api/auth";
import { createCustomer } from "lib/api/customers";
import { ApiError } from "lib/api/errors";
import {
  normalizeCpf,
  type RegistrationData,
  validateRegistration,
} from "lib/validation/customer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = { error?: string };

function required(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível concluir a operação. Tente novamente.";
}

export async function loginAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = required(formData, "email");
  const senha = required(formData, "senha");
  if (!email || !senha) return { error: "Informe e-mail e senha." };

  try {
    const response = await login({ email, senha });
    await setSession(response.token);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function registerAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const customer: RegistrationData = {
    nomeCompleto: required(formData, "nomeCompleto"),
    cpf: required(formData, "cpf"),
    email: required(formData, "email"),
    telefone: required(formData, "telefone"),
    senha: required(formData, "senha"),
  };
  if (Object.values(customer).some((value) => !value)) {
    return { error: "Preencha todos os campos." };
  }

  const validationErrors = validateRegistration(customer);
  const firstError = Object.values(validationErrors)[0];
  if (firstError) return { error: firstError };

  customer.nomeCompleto = customer.nomeCompleto.replace(/\s+/g, " ");
  customer.cpf = normalizeCpf(customer.cpf);

  try {
    await createCustomer(customer);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/login?registered=1");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/");
}
