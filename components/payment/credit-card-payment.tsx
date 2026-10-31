"use client";

import type { CardPaymentData } from "lib/validation/customer-v110";
import dynamic from "next/dynamic";

const MercadoPagoCardBrick = dynamic(
  () =>
    import("./mercado-pago-card-brick").then(
      (module) => module.MercadoPagoCardBrick,
    ),
  {
    ssr: false,
    loading: () => <p role="status">Carregando formulário seguro...</p>,
  },
);

export function CreditCardPayment({
  amount,
  orderId,
  onSubmit,
  disabled,
}: {
  amount: number;
  orderId: number;
  onSubmit: (data: CardPaymentData) => Promise<void>;
  disabled: boolean;
}) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  if (!publicKey) {
    return (
      <p role="status" className="mt-4 text-sm text-neutral-500">
        Pagamento com cartão temporariamente indisponível. Você pode utilizar
        PIX.
      </p>
    );
  }

  return (
    <MercadoPagoCardBrick
      publicKey={publicKey}
      amount={amount}
      orderId={orderId}
      onSubmit={onSubmit}
      disabled={disabled}
    />
  );
}
