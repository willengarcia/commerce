"use client";

import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { normalizeDeviceSessionId } from "lib/payment-device";
import type { CardPaymentData } from "lib/validation/customer-v110";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export function MercadoPagoCardBrick({
  publicKey,
  amount,
  orderId,
  onSubmit,
  disabled,
  maxInstallments,
}: {
  publicKey: string;
  amount: number;
  orderId: number;
  onSubmit: (data: CardPaymentData) => Promise<void>;
  disabled: boolean;
  maxInstallments: number;
}) {
  const [initialized, setInitialized] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const alive = useRef(true);
  const latest = useRef({ disabled, maxInstallments, amount, onSubmit });
  latest.current = { disabled, maxInstallments, amount, onSubmit };
  const initialization = useMemo(() => ({ amount }), [amount]);
  const customization = useMemo(
    () => ({
      paymentMethods: {
        minInstallments: 1,
        maxInstallments,
        types: {
          excluded: ["debit_card", "prepaid_card"] as (
            | "debit_card"
            | "prepaid_card"
          )[],
        },
      },
    }),
    [maxInstallments],
  );
  const handleReady = useCallback(() => {
    if (alive.current) setReady(true);
  }, []);
  const handleError = useCallback(() => {
    if (alive.current)
      setError(
        "Não foi possível carregar ou validar o cartão e as parcelas. Confira os campos ou atualize as condições de parcelamento.",
      );
  }, []);

  useEffect(() => {
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setInitialized(true);
    alive.current = true;
    return () => {
      alive.current = false;
    };
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
      if (!alive.current || busy.current || latest.current.disabled) return;

      if (
        additional?.paymentTypeId &&
        additional.paymentTypeId !== "credit_card"
      ) {
        setError("Utilize um cartão de crédito válido.");
        return;
      }

      const issuerId = data.issuer_id ? Number(data.issuer_id) : null;
      const card: CardPaymentData = {
        orderTotal: latest.current.amount,
        token: data.token,
        deviceSessionId: normalizeDeviceSessionId(
          (window as Window & { MP_DEVICE_SESSION_ID?: unknown })
            .MP_DEVICE_SESSION_ID,
        ),
        parcelas: data.installments,
        paymentMethodId: data.payment_method_id,
        issuerId,
      };

      if (
        !card.token.trim() ||
        !card.paymentMethodId.trim() ||
        !Number.isSafeInteger(card.parcelas) ||
        card.parcelas < 1 ||
        card.parcelas > latest.current.maxInstallments ||
        (card.issuerId !== null &&
          (!Number.isSafeInteger(card.issuerId) || card.issuerId <= 0))
      ) {
        setError("Confira o cartão e a opção de parcelas selecionada.");
        return;
      }

      busy.current = true;
      setError(undefined);
      try {
        await latest.current.onSubmit(card);
      } finally {
        busy.current = false;
      }
    },
    [],
  );

  if (!initialized) {
    return <p role="status">Inicializando pagamento seguro...</p>;
  }

  return (
    <div
      className={`mt-5 min-w-0 ${disabled ? "pointer-events-none opacity-60" : ""}`}
      aria-busy={disabled}
      inert={disabled}
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
        id={`credit-card-${orderId}-${instanceId}`}
        initialization={initialization}
        customization={customization}
        onReady={handleReady}
        onError={handleError}
        onSubmit={submitCard}
      />
      <p className="mt-3 text-xs text-neutral-500">
        Os dados do cartão são protegidos e tokenizados pelo Mercado Pago. O
        frontend não armazena número do cartão ou código de segurança.
      </p>
    </div>
  );
}
