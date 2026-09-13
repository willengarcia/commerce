"use client";

import { registerAction } from "app/(account)/actions";
import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, {});
  const inputClass =
    "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black";

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Nome completo
        <input
          name="nomeCompleto"
          autoComplete="name"
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        CPF
        <input name="cpf" inputMode="numeric" required className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Telefone
        <input
          name="telefone"
          type="tel"
          autoComplete="tel"
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Senha
        <input
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </label>
      <SubmitButton>Criar conta</SubmitButton>
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Já possui conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
