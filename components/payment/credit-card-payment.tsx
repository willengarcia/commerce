"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  validCardData,
  type CardPaymentData,
} from "lib/validation/customer-v110";

type BrickData = {
  token: string;
  payment_method_id: string;
  issuer_id?: string | number | null;
  installments: number;
};
type BrickController = { unmount: () => void };
type BrickSettings = {
  initialization: { amount: number };
  customization: { paymentMethods: { types: { included: string[] } } };
  callbacks: {
    onReady: () => void;
    onError: () => void;
    onSubmit: (
      data: BrickData,
      additional: { paymentTypeId?: string },
    ) => Promise<void>;
  };
};
declare global {
  interface Window {
    MercadoPago?: new (
      key: string,
      options: { locale: string },
    ) => {
      bricks: () => {
        create: (
          name: "cardPayment",
          target: string,
          settings: BrickSettings,
        ) => Promise<BrickController>;
      };
    };
  }
}

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
  const key = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const submitRef = useRef(onSubmit);
  const busy = useRef(false);
  const disabledRef = useRef(disabled);
  submitRef.current = onSubmit;
  disabledRef.current = disabled;
  const target = `credit-card-${orderId}`;
  useEffect(() => {
    if (!loaded || !key || !window.MercadoPago) return;
    let disposed = false;
    let controller: BrickController | undefined;
    const sdk = new window.MercadoPago(key, { locale: "pt-BR" });
    sdk
      .bricks()
      .create("cardPayment", target, {
        initialization: { amount },
        customization: {
          paymentMethods: { types: { included: ["credit_card"] } },
        },
        callbacks: {
          onReady: () => {
            if (!disposed) setReady(true);
          },
          onError: () => {
            if (!disposed)
              setError(
                "Não foi possível validar ou carregar os dados do cartão. Confira os campos e tente novamente.",
              );
          },
          onSubmit: async (data, additional) => {
            if (disposed || busy.current || disabledRef.current) return;
            const card: CardPaymentData = {
              token: data.token,
              parcelas: data.installments,
              paymentMethodId: data.payment_method_id,
              issuerId:
                data.issuer_id == null || data.issuer_id === ""
                  ? null
                  : Number(data.issuer_id),
            };
            if (
              !validCardData(card) ||
              additional?.paymentTypeId !== "credit_card"
            ) {
              setError(
                "Selecione um cartão de crédito e uma opção de parcelas válida.",
              );
              return;
            }
            busy.current = true;
            setError(undefined);
            try {
              await submitRef.current(card);
            } finally {
              busy.current = false;
            }
          },
        },
      })
      .then((value) => {
        if (disposed) value.unmount();
        else controller = value;
      })
      .catch(() => {
        if (!disposed)
          setError("Não foi possível abrir o formulário seguro de cartão.");
      });
    return () => {
      disposed = true;
      controller?.unmount();
    };
  }, [loaded, key, amount, target]);
  if (!key)
    return (
      <p role="status" className="mt-4 text-sm text-neutral-500">
        Pagamento com cartão temporariamente indisponível. Você pode utilizar
        PIX.
      </p>
    );
  return (
    <div className="mt-5 min-w-0">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onReady={() => setLoaded(true)}
        onError={() =>
          setError(
            "Não foi possível carregar o formulário seguro. Verifique sua conexão.",
          )
        }
      />
      {!ready && !error ? (
        <p role="status">Carregando formulário seguro...</p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div
        inert={disabled}
        aria-busy={disabled}
        id={target}
        className={disabled ? "pointer-events-none opacity-60" : undefined}
      />
      <p className="mt-3 text-xs text-neutral-500">
        Os dados do cartão são protegidos pelo Mercado Pago. As opções de
        parcelamento são fornecidas pelo gateway.
      </p>
    </div>
  );
}
