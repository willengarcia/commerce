"use client";

import type { AddressResponseDTO } from "lib/api/addresses";
import Link from "next/link";
import { useActionState } from "react";
import type { AddressFormState } from "app/(account)/account/addresses/actions";
import { SubmitButton } from "./submit-button";

type AddressAction = (
  state: AddressFormState,
  formData: FormData,
) => Promise<AddressFormState>;

export function AddressForm({
  action,
  address,
}: {
  action: AddressAction;
  address?: AddressResponseDTO;
}) {
  const [state, formAction] = useActionState(action, {});
  const inputClass =
    "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black";

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Identificação
          <input
            name="nomeEndereco"
            defaultValue={address?.nomeEndereco}
            required
            className={inputClass}
            placeholder="Casa"
          />
        </label>
        <label className="block text-sm font-medium">
          Tipo
          <select
            name="tipoEndereco"
            defaultValue={address?.tipoEndereco ?? "CASA"}
            className={inputClass}
          >
            <option value="CASA">Casa</option>
            <option value="TRABALHO">Trabalho</option>
            <option value="OUTRO">Outro</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Nome do destinatário
        <input
          name="nomeDestinatario"
          defaultValue={address?.nomeDestinatario}
          autoComplete="name"
          required
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          CEP
          <input
            name="cep"
            defaultValue={address?.cep}
            autoComplete="postal-code"
            inputMode="numeric"
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Estado
          <input
            name="estado"
            defaultValue={address?.estado}
            autoComplete="address-level1"
            maxLength={2}
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Rua
        <input
          name="rua"
          defaultValue={address?.rua}
          autoComplete="address-line1"
          required
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Número
          <input
            name="numero"
            defaultValue={address?.numero}
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Complemento
          <input
            name="complemento"
            defaultValue={address?.complemento}
            autoComplete="address-line2"
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Bairro
          <input
            name="bairro"
            defaultValue={address?.bairro}
            required
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Cidade
          <input
            name="cidade"
            defaultValue={address?.cidade}
            autoComplete="address-level2"
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Referência
        <input
          name="referencia"
          defaultValue={address?.referencia}
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="enderecoPrincipal"
          type="checkbox"
          defaultChecked={address?.enderecoPrincipal}
        />
        Definir como endereço principal
      </label>
      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
        <div className="sm:w-1/2">
          <SubmitButton>Salvar endereço</SubmitButton>
        </div>
        <Link
          href="/account/addresses"
          className="mt-2 text-center text-sm underline"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
