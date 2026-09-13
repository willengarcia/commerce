import Price from "components/price";
import { CheckoutForm } from "components/checkout/checkout-form";
import { getAddresses } from "lib/api/addresses";
import { getCurrentCart } from "lib/api/cart";
import { getCurrentCustomer } from "lib/api/customers";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  if (!(await getCurrentCustomer())) redirect("/login");
  const [cart, addresses] = await Promise.all([
    getCurrentCart(),
    getAddresses(),
  ]);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2">
      <section>
        <h1 className="mb-6 text-3xl font-semibold">Finalizar pedido</h1>
        {!cart || cart.cartItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
            <p>Seu carrinho está vazio ou indisponível.</p>
            <Link
              href="/search"
              className="mt-3 inline-block text-blue-600 underline"
            >
              Ver produtos
            </Link>
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
            <p>Cadastre um endereço antes de finalizar.</p>
            <Link
              href="/account/addresses/new"
              className="mt-3 inline-block text-blue-600 underline"
            >
              Cadastrar endereço
            </Link>
          </div>
        ) : (
          <CheckoutForm addresses={addresses} />
        )}
      </section>
      <aside className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Resumo do carrinho</h2>
        {cart ? (
          <>
            <ul className="space-y-3">
              {cart.cartItems.map((item) => (
                <li
                  key={item.cartItemId}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span>
                    {item.products.nome} × {item.quantidade}
                  </span>
                  <Price amount={item.subtotal.toString()} currencyCode="BRL" />
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-between border-t border-neutral-200 pt-4 font-semibold dark:border-neutral-700">
              <span>Total</span>
              <Price
                amount={cart.cart.valorTotal.toString()}
                currencyCode="BRL"
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Nenhum item.</p>
        )}
      </aside>
    </div>
  );
}
