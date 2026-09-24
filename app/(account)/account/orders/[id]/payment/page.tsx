import Price from "components/price";
import { PaymentExperience } from "components/payment/payment-experience";
import { getCurrentCustomer } from "lib/api/customers";
import { ApiError } from "lib/api/errors";
import { getOrder } from "lib/api/orders";
import { getPaymentByOrder } from "lib/api/payments";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Pagamento" };

export default async function PaymentPage(props: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentCustomer())) redirect("/login");
  const orderId = Number((await props.params).id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();

  let order;
  try {
    order = await getOrder(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  let payment;
  try {
    payment = await getPaymentByOrder(orderId);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }

  return (
    <>
      <Link
        href={`/account/orders/${orderId}`}
        className="text-sm text-neutral-500 hover:underline"
      >
        Pedido #{orderId}
      </Link>
      <h1 className="mt-1 text-2xl font-semibold">Pagamento</h1>
      <div className="mt-6 flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <span>
          <span className="block text-sm text-neutral-500">
            Status do pedido
          </span>
          {order.status.replaceAll("_", " ")}
        </span>
        <Price
          amount={order.valorTotal.toString()}
          currencyCode="BRL"
          className="font-semibold"
        />
      </div>
      <PaymentExperience orderId={orderId} initialPayment={payment} />
    </>
  );
}
