"use client";

import type { CardPaymentData } from "lib/validation/customer-v110";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { loadInstallmentQuoteAction } from "app/(account)/account/orders/[id]/payment/customer-actions";
import {
  getMaxAllowedInstallments,
  type InstallmentQuote,
} from "lib/payment-installments";

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
  refreshKey = 0,
}: {
  amount: number;
  orderId: number;
  onSubmit: (data: CardPaymentData) => Promise<void>;
  disabled: boolean;
  refreshKey?: number;
}) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  const [attempt, setAttempt] = useState(0);
  const epoch = `${orderId}:${amount}:${refreshKey}:${attempt}`;
  const [result, setResult] = useState<{
    epoch: string;
    quote?: InstallmentQuote;
    error?: string;
  }>();
  const request = useRef(0);
  useEffect(() => {
    if (!publicKey) return;
    const id = ++request.current;
    loadInstallmentQuoteAction(orderId)
      .then((value) => {
        if (request.current === id) setResult({ epoch, ...value });
      })
      .catch(() => {
        if (request.current === id)
          setResult({
            epoch,
            error:
              "Não foi possível consultar as condições de parcelamento. Tente novamente.",
          });
      });
    return () => {
      ++request.current;
    };
  }, [epoch, orderId, publicKey]);

  if (!publicKey) {
    return (
      <p role="status" className="mt-4 text-sm text-neutral-500">
        Pagamento com cartão temporariamente indisponível. Você pode utilizar
        PIX.
      </p>
    );
  }

  if (result?.epoch !== epoch)
    return (
      <p role="status" className="mt-4">
        Consultando condições de parcelamento...
      </p>
    );
  if (!result.quote)
    return (
      <div className="mt-4 space-y-3">
        <p role="alert">{result.error}</p>
        <button
          type="button"
          disabled={disabled}
          className="rounded-full border px-4 py-2 disabled:opacity-50"
          onClick={() => setAttempt((v) => v + 1)}
        >
          Tentar novamente
        </button>
      </div>
    );
  const { config, amount: officialAmount } = result.quote;
  const maxInstallments = getMaxAllowedInstallments(officialAmount, config);
  const minimum = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(config.minimumOrderValue);

  return (
    <div className="min-w-0" data-clarity-mask="true">
      <p className="mt-4 text-sm">
        Valor do pedido:{" "}
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(officialAmount)}
        .
      </p>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        {!config.enabled || config.maxInstallments === 1
          ? "Pagamento com cartão disponível somente à vista."
          : maxInstallments === 1
            ? `Parcelamento disponível para compras acima de ${minimum}.`
            : `Até ${maxInstallments}x, conforme as opções disponíveis para seu cartão no Mercado Pago.`}
      </p>
      {config.buyerPaysInterest && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Eventuais juros do parcelamento são de responsabilidade do comprador.
          Confira o valor das parcelas e as condições apresentadas pelo Mercado
          Pago antes de confirmar.
        </p>
      )}
      <button
        type="button"
        disabled={disabled}
        className="mt-3 text-sm underline disabled:opacity-50"
        onClick={() => setAttempt((v) => v + 1)}
      >
        Atualizar condições de parcelamento
      </button>
      <MercadoPagoCardBrick
        key={epoch}
        publicKey={publicKey}
        amount={officialAmount}
        maxInstallments={maxInstallments}
        orderId={orderId}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    </div>
  );
}
