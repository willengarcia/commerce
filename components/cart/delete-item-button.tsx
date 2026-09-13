"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { removeItem } from "components/cart/actions";
import { useActionState } from "react";

export function DeleteItemButton({ cartItemId }: { cartItemId: number }) {
  const [message, action] = useActionState(
    removeItem.bind(null, cartItemId),
    undefined,
  );
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label="Remover item do carrinho"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-500"
      >
        <XMarkIcon className="h-4 w-4 text-white" />
      </button>
      {message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null}
    </form>
  );
}
