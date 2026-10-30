"use client";
import {
  forgotPasswordAction,
  resetPasswordAction,
} from "app/(account)/password-actions";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

const inputClass =
  "mt-2 w-full rounded-md border border-neutral-300 bg-transparent p-3 dark:border-neutral-700";
const buttonClass =
  "mt-5 w-full rounded-full bg-blue-600 p-3 font-medium text-white disabled:opacity-50";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});
  return (
    <>
      {state.success ? (
        <p role="status">
          Se o e-mail estiver cadastrado, você receberá instruções para
          recuperar sua senha.
        </p>
      ) : (
        <form action={action}>
          <label className="block text-sm">
            E-mail
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>
          {state.error ? (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          <button disabled={pending} className={buttonClass}>
            {pending ? "Enviando..." : "Enviar instruções"}
          </button>
        </form>
      )}
      <Link
        href="/login"
        className="mt-5 block text-sm text-blue-600 hover:underline"
      >
        Voltar ao login
      </Link>
    </>
  );
}

export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [state, action, pending] = useActionState(resetPasswordAction, {});
  const form = useRef<HTMLFormElement>(null);
  const tokenRead = useRef(false);
  useEffect(() => {
    if (tokenRead.current) return;
    tokenRead.current = true;
    const url = new URL(window.location.href);
    setToken(url.searchParams.get("token") ?? "");
    // Keep the one-time token in memory only, never in browser storage/history.
    url.searchParams.delete("token");
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );
  }, []);
  useEffect(() => {
    if (state.success) {
      setToken("");
      form.current?.reset();
    }
  }, [state.success]);
  if (state.success)
    return (
      <>
        <p role="status">Senha alterada com sucesso.</p>
        <Link href="/login" className={buttonClass + " block text-center"}>
          Entrar
        </Link>
      </>
    );
  if (token === null) return <p role="status">Preparando recuperação...</p>;
  if (!token)
    return (
      <>
        <p role="alert">Link de recuperação ausente ou inválido.</p>
        <Link href="/forgot-password" className="mt-4 block text-blue-600">
          Solicitar novo link
        </Link>
      </>
    );
  return (
    <form ref={form} action={action}>
      <input type="hidden" name="token" value={token} />
      <p className="mb-4 text-sm text-neutral-500">
        O link é válido por 15 minutos e só pode ser utilizado uma vez.
      </p>
      <label className="block text-sm">
        Nova senha
        <input
          name="newPassword"
          type="password"
          minLength={8}
          maxLength={72}
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="mt-4 block text-sm">
        Confirmar senha
        <input
          name="confirmation"
          type="password"
          minLength={8}
          maxLength={72}
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <button disabled={pending} className={buttonClass}>
        {pending ? "Alterando..." : "Redefinir senha"}
      </button>
      <Link
        href="/forgot-password"
        className="mt-4 block text-sm text-blue-600"
      >
        Solicitar outro link
      </Link>
    </form>
  );
}
