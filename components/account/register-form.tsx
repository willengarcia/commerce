"use client";

import { registerAction } from "app/(account)/actions";
import {
  type RegistrationData,
  type RegistrationErrors,
  type RegistrationField,
  validateRegistration,
} from "lib/validation/customer";
import Link from "next/link";
import { type FormEvent, useActionState, useState } from "react";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, {});
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const inputClass =
    "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black";

  function valuesFromForm(form: HTMLFormElement): RegistrationData {
    const formData = new FormData(form);
    return {
      nomeCompleto: String(formData.get("nomeCompleto") ?? ""),
      cpf: String(formData.get("cpf") ?? ""),
      email: String(formData.get("email") ?? ""),
      telefone: String(formData.get("telefone") ?? ""),
      senha: String(formData.get("senha") ?? ""),
    };
  }

  function validateField(field: RegistrationField, form: HTMLFormElement) {
    const fieldError = validateRegistration(valuesFromForm(form))[field];
    setErrors((current) => ({ ...current, [field]: fieldError }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const validationErrors = validateRegistration(
      valuesFromForm(event.currentTarget),
    );
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) event.preventDefault();
  }

  function fieldProps(field: RegistrationField) {
    return {
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
      onBlur: (event: React.FocusEvent<HTMLInputElement>) =>
        validateField(field, event.currentTarget.form!),
    };
  }

  function FieldError({ field }: { field: RegistrationField }) {
    return errors[field] ? (
      <span id={`${field}-error`} className="mt-1 block text-sm text-red-600">
        {errors[field]}
      </span>
    ) : null;
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
    >
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
          {...fieldProps("nomeCompleto")}
          className={inputClass}
        />
        <FieldError field="nomeCompleto" />
      </label>
      <label className="block text-sm font-medium">
        CPF
        <input
          name="cpf"
          inputMode="numeric"
          placeholder="044.483.572-52"
          required
          {...fieldProps("cpf")}
          className={inputClass}
        />
        <FieldError field="cpf" />
      </label>
      <label className="block text-sm font-medium">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          {...fieldProps("email")}
          className={inputClass}
        />
        <FieldError field="email" />
      </label>
      <label className="block text-sm font-medium">
        Telefone
        <input
          name="telefone"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={11}
          placeholder="91991185808"
          required
          {...fieldProps("telefone")}
          onChange={(event) => {
            if (/[^0-9]/.test(event.currentTarget.value) || errors.telefone) {
              validateField("telefone", event.currentTarget.form!);
            }
          }}
          className={inputClass}
        />
        <FieldError field="telefone" />
      </label>
      <label className="block text-sm font-medium">
        Senha
        <input
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          {...fieldProps("senha")}
          className={inputClass}
        />
        <FieldError field="senha" />
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
