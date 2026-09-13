"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "components/cart/actions";
import type { ProductViewModel } from "lib/api/types";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function AddButton({ available }: { available: boolean }) {
  const { pending } = useFormStatus();
  const disabled = !available || pending;
  return (
    <button
      disabled={disabled}
      className={clsx(
        "relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white",
        disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90",
      )}
    >
      <PlusIcon className="absolute left-4 h-5 w-5" />
      {!available
        ? "Produto indisponível"
        : pending
          ? "Adicionando..."
          : "Adicionar ao carrinho"}
    </button>
  );
}

export function AddToCart({ product }: { product: ProductViewModel }) {
  const [message, action] = useActionState(
    addItem.bind(null, product.id),
    undefined,
  );
  return (
    <form action={action}>
      <AddButton available={product.availableForSale === true} />
      {message ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
