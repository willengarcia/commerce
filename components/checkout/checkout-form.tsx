"use client";

import { createOrderAction } from "app/(checkout)/checkout/actions";
import type { AddressResponseDTO } from "lib/api/addresses";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export function CheckoutForm({
  addresses,
}: {
  addresses: AddressResponseDTO[];
}) {
  const [state, action] = useActionState(createOrderAction, {});
  const selected =
    addresses.find((address) => address.enderecoPrincipal)?.id ??
    addresses[0]?.id;

  return (
    <form action={action}>
      {state.error ? (
        <p
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <fieldset className="space-y-3">
        <legend className="mb-3 text-lg font-semibold">
          Endereço de entrega
        </legend>
        {addresses.map((address) => (
          <label
            key={address.id}
            className="flex cursor-pointer gap-3 rounded-lg border border-neutral-200 p-4 has-[:checked]:border-blue-600 dark:border-neutral-700"
          >
            <input
              type="radio"
              name="addressId"
              value={address.id}
              defaultChecked={address.id === selected}
            />
            <span className="text-sm">
              <strong className="block">
                {address.nomeEndereco}
                {address.enderecoPrincipal ? " — Principal" : ""}
              </strong>
              <span className="text-neutral-600 dark:text-neutral-400">
                {address.rua}, {address.numero}
                {address.complemento ? ` — ${address.complemento}` : ""}
                <br />
                {address.bairro}, {address.cidade}/{address.estado} — CEP{" "}
                {address.cep}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <ConfirmButton />
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-6 w-full rounded-full bg-blue-600 p-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Criando pedido..." : "Confirmar pedido"}
    </button>
  );
}
