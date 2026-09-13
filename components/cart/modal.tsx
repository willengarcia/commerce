"use client";

import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Price from "components/price";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { clearCartAction } from "./actions";
import { useCart } from "./cart-context";
import { DeleteItemButton } from "./delete-item-button";
import OpenCart from "./open-cart";

export default function CartModal({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const cart = useCart();
  const totalQuantity =
    cart?.cartItems.reduce((total, item) => total + item.quantidade, 0) ?? 0;
  const [isOpen, setIsOpen] = useState(false);
  const quantityRef = useRef(totalQuantity);

  useEffect(() => {
    if (totalQuantity > quantityRef.current) setIsOpen(true);
    quantityRef.current = totalQuantity;
  }, [totalQuantity]);

  return (
    <>
      <button aria-label="Abrir carrinho" onClick={() => setIsOpen(true)}>
        <OpenCart quantity={totalQuantity} />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/90 p-6 text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-700 dark:bg-black/90 dark:text-white">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold">
                  Meu carrinho
                </Dialog.Title>
                <button
                  aria-label="Fechar carrinho"
                  onClick={() => setIsOpen(false)}
                >
                  <CloseCart />
                </button>
              </div>
              {!cart || cart.cartItems.length === 0 ? (
                <div className="mt-20 flex flex-col items-center text-center">
                  <ShoppingCartIcon className="h-16 w-16" />
                  <p className="mt-6 text-2xl font-bold">
                    Seu carrinho está vazio.
                  </p>
                  {!isAuthenticated ? (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="mt-4 text-blue-600 underline"
                    >
                      Entre para comprar
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden">
                  <ul className="grow overflow-auto py-4">
                    {[...cart.cartItems]
                      .sort((a, b) =>
                        a.products.nome.localeCompare(b.products.nome),
                      )
                      .map((item) => (
                        <li
                          key={item.cartItemId}
                          className="border-b border-neutral-300 py-4 dark:border-neutral-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <DeleteItemButton cartItemId={item.cartItemId} />
                            <Link
                              href={`/product/${item.products.id}`}
                              onClick={() => setIsOpen(false)}
                              className="min-w-0 grow"
                            >
                              <p className="font-medium">
                                {item.products.nome}
                              </p>
                              <p className="text-sm text-neutral-500">
                                Quantidade: {item.quantidade}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {item.products.sku}
                              </p>
                            </Link>
                            <Price
                              amount={item.subtotal.toString()}
                              currencyCode="BRL"
                              className="text-sm"
                            />
                          </div>
                        </li>
                      ))}
                  </ul>
                  <div className="border-t border-neutral-200 py-4 dark:border-neutral-700">
                    <div className="mb-4 flex items-center justify-between font-medium">
                      <span>Total</span>
                      <Price
                        amount={cart.cart.valorTotal.toString()}
                        currencyCode="BRL"
                      />
                    </div>
                    <form action={clearCartAction}>
                      <ClearCartButton />
                    </form>
                    <button
                      disabled
                      className="mt-3 w-full cursor-not-allowed rounded-full bg-blue-600 p-3 text-sm font-medium text-white opacity-60"
                    >
                      Checkout disponível na próxima etapa
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function ClearCartButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-full border border-neutral-300 p-3 text-sm font-medium hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900"
    >
      {pending ? "Esvaziando..." : "Esvaziar carrinho"}
    </button>
  );
}

function CloseCart({ className }: { className?: string }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700">
      <XMarkIcon
        className={clsx("h-6 transition-transform hover:scale-110", className)}
      />
    </div>
  );
}
