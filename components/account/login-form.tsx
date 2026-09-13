"use client";

import { loginAction } from "app/(account)/actions";
import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "./submit-button";

export function LoginForm({ registered }: { registered: boolean }) {
  const [state, action] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      {registered ? (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Cadastro realizado. Entre com seus dados.
        </p>
      ) : null}
      {state.error ? (
        <p
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black"
        />
      </label>
      <label className="block text-sm font-medium">
        Senha
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black"
        />
      </label>
      <SubmitButton>Entrar</SubmitButton>
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Ainda não possui conta?{" "}
        <Link href="/register" className="underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
