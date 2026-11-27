import { getPaymentByOrder } from "lib/api/payments";
import { ApiError } from "lib/api/errors";
import { paymentMethodDescription } from "lib/payment-installments";
import Link from "next/link";

export async function OrderPaymentSummary({ orderId }: { orderId: number }) {
  try {
    const payment = await getPaymentByOrder(orderId);
    return (
      <section className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-semibold">Pagamento</h2>
        <p className="mt-2 text-sm">{paymentMethodDescription(payment)}</p>
        <Link
          href={`/account/orders/${orderId}/payment`}
          className="mt-2 inline-block text-sm text-blue-600 underline"
        >
          Detalhes do pagamento
        </Link>
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return (
      <p className="mt-4 text-sm">
        Não foi possível consultar os detalhes do pagamento.{" "}
        <Link className="underline" href={`/account/orders/${orderId}/payment`}>
          Tentar novamente
        </Link>
      </p>
    );
  }
}
