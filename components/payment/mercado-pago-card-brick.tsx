"use client";

import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import type { CardPaymentData } from "lib/validation/customer-v110";
import { useCallback, useEffect, useRef, useState } from "react";

export function MercadoPagoCardBrick({
  publicKey,
  amount,
  orderId,
  onSubmit,
  disabled,
}: {
  publicKey: string;
  amount: number;
  orderId: number;
  onSubmit: (data: CardPaymentData) => Promise<void>;
  disabled: boolean;
}) {
  const [initialized, setInitialized] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const busy = useRef(false);

  useEffect(() => {
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setInitialized(true);
  }, [publicKey]);

  const submitCard = useCallback(
    async (
      data: {
        token: string;
        installments: number;
        payment_method_id: string;
        issuer_id: string;
      },
      additional?: { paymentTypeId?: string },
    ) => {
      if (busy.current || disabled) return;

      if (
        additional?.paymentTypeId &&
        additional.paymentTypeId !== "credit_card"
      ) {
        setError("Utilize um cartão de crédito válido.");
        return;
      }

      const issuerId = data.issuer_id ? Number(data.issuer_id) : null;
      const card: CardPaymentData = {
        token: data.token,
        parcelas: data.installments,
        paymentMethodId: data.payment_method_id,
        issuerId,
      };

      if (
        !card.token.trim() ||
        !card.paymentMethodId.trim() ||
        !Number.isSafeInteger(card.parcelas) ||
        card.parcelas < 1 ||
        (card.issuerId !== null &&
          (!Number.isSafeInteger(card.issuerId) || card.issuerId <= 0))
      ) {
        setError("Confira o cartão e a opção de parcelas selecionada.");
        return;
      }

      busy.current = true;
      setError(undefined);
      try {
        await onSubmit(card);
      } finally {
        busy.current = false;
      }
    },
    [disabled, onSubmit],
  );

  if (!initialized) {
    return <p role="status">Inicializando pagamento seguro...</p>;
  }

  return (
    <div
      className={`mt-5 min-w-0 ${disabled ? "pointer-events-none opacity-60" : ""}`}
      aria-busy={disabled}
    >
      {!ready && !error ? (
        <p role="status">Carregando formulário seguro...</p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <CardPayment
        id={`credit-card-${orderId}`}
        initialization={{ amount }}
        customization={{
          paymentMethods: {
            types: { excluded: ["debit_card", "prepaid_card"] },
          },
        }}
        onReady={() => setReady(true)}
        onError={() =>
          setError(
            "Não foi possível carregar ou validar o cartão. Confira os campos e tente novamente.",
          )
        }
        onSubmit={submitCard}
      />
      <p className="mt-3 text-xs text-neutral-500">
        Os dados do cartão são protegidos e tokenizados pelo Mercado Pago. O
        frontend não armazena número do cartão ou código de segurança.
      </p>
    </div>
  );
}
