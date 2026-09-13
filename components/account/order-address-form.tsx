"use client";

import { updateOrderAddressAction } from "app/(account)/account/orders/actions";
import type { AddressResponseDTO } from "lib/api/addresses";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export function OrderAddressForm({
  orderId,
  currentAddressId,
  addresses,
}: {
  orderId: number;
  currentAddressId: number;
  addresses: AddressResponseDTO[];
}) {
  const [state, action] = useActionState(
    updateOrderAddressAction.bind(null, orderId),
    {},
  );
  return (
    <form action={action} className="mt-4">
      <label className="block text-sm font-medium">
        Alterar endereço
        <select
          name="addressId"
          defaultValue={currentAddressId}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black"
        >
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.nomeEndereco} — {address.rua}, {address.numero}
            </option>
          ))}
        </select>
      </label>
      {state.error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-2 text-sm text-green-700" role="status">
          {state.success}
        </p>
      ) : null}
      <UpdateButton />
    </form>
  );
}

function UpdateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-3 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900"
    >
      {pending ? "Atualizando..." : "Atualizar endereço"}
    </button>
  );
}
