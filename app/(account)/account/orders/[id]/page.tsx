import { OrderAddressForm } from "components/account/order-address-form";
import Price from "components/price";
import { getAddresses } from "lib/api/addresses";
import { getCurrentCustomer } from "lib/api/customers";
import { ApiError } from "lib/api/errors";
import { getOrder } from "lib/api/orders";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Detalhes do pedido" };

export default async function OrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentCustomer())) redirect("/login");
  const id = Number((await props.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  let order;
  try {
    order = await getOrder(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const addresses = await getAddresses();

  return (
    <>
      <Link
        href="/account/orders"
        className="text-sm text-neutral-500 hover:underline"
      >
        Meus pedidos
      </Link>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pedido #{order.orderId}</h1>
          <p className="text-sm text-neutral-500">
            {order.status.replaceAll("_", " ")}
          </p>
        </div>
        <Price
          amount={order.valorTotal.toString()}
          currencyCode="BRL"
          className="font-semibold"
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Itens</h2>
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 px-4 dark:divide-neutral-700 dark:border-neutral-800">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="flex justify-between gap-4 py-4 text-sm"
            >
              <span>
                <Link
                  href={`/product/${item.productId}`}
                  className="font-medium hover:underline"
                >
                  {item.nomeProduto}
                </Link>
                <span className="block text-neutral-500">
                  {item.skuProduto} · Quantidade: {item.quantidade}
                </span>
              </span>
              <Price amount={item.subTotal.toString()} currencyCode="BRL" />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-semibold">Endereço de entrega</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {order.address.nomeDestinatario}
          <br />
          {order.address.rua}, {order.address.numero}
          {order.address.complemento ? ` — ${order.address.complemento}` : ""}
          <br />
          {order.address.bairro}, {order.address.cidade}/{order.address.estado}{" "}
          — CEP {order.address.cep}
        </p>
        <OrderAddressForm
          orderId={order.orderId}
          currentAddressId={order.address.id}
          addresses={addresses}
        />
      </section>

      {order.status === "AGUARDANDO_PAGAMENTO" ? (
        <Link
          href={`/account/orders/${order.orderId}/payment`}
          className="mt-8 block w-full rounded-full bg-blue-600 p-3 text-center font-medium text-white hover:opacity-90"
        >
          Ver pagamento PIX
        </Link>
      ) : null}
    </>
  );
}
