import Price from "components/price";
import { getCurrentCustomer } from "lib/api/customers";
import { getOrders } from "lib/api/orders";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function OrdersPage() {
  if (!(await getCurrentCustomer())) redirect("/login");
  const orders = await getOrders();
  return (
    <>
      <div className="mb-6">
        <Link
          href="/account"
          className="text-sm text-neutral-500 hover:underline"
        >
          Minha conta
        </Link>
        <h1 className="text-2xl font-semibold">Meus pedidos</h1>
      </div>
      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          Nenhum pedido realizado.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.orderId}>
              <Link
                href={`/account/orders/${order.orderId}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4 hover:border-blue-600 dark:border-neutral-800"
              >
                <span>
                  <strong className="block">Pedido #{order.orderId}</strong>
                  <span className="text-sm text-neutral-500">
                    {order.status.replaceAll("_", " ")}
                  </span>
                </span>
                <Price
                  amount={order.valorTotal.toString()}
                  currencyCode="BRL"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
