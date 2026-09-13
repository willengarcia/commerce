"use client";

import {
  cancelPaymentAction,
  createPaymentAction,
  refreshPaymentAction,
} from "app/(account)/account/orders/[id]/payment/actions";
import { CreditCardIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import Price from "components/price";
import type { PaymentResponseDTO } from "lib/api/payments";
import Image from "next/image";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";

const POLLING_INTERVAL_MS = 5_000;
const POLLING_LIMIT_MS = 10 * 60_000;

export function PaymentExperience({ orderId }: { orderId: number }) {
  const [state, action] = useActionState(
    createPaymentAction.bind(null, orderId),
    {},
  );

  if (state.payment) return <PaymentDetails initialPayment={state.payment} />;

  return (
    <section className="mt-6">
      <h2 className="mb-4 text-lg font-semibold">Escolha como pagar</h2>
      {state.error ? <ErrorMessage message={state.error} /> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <form action={action}>
          <PixCard />
        </form>
        <DisabledCard title="Cartão de crédito" />
        <DisabledCard title="Cartão de débito" />
      </div>
    </section>
  );
}

function PixCard() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="flex h-full min-h-36 w-full flex-col items-center justify-center rounded-lg border-2 border-blue-600 p-4 text-center hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-neutral-900"
    >
      <QrCodeIcon className="mb-3 h-9 w-9 text-blue-600" />
      <strong>PIX</strong>
      <span className="mt-1 text-xs text-neutral-500">
        {pending ? "Gerando pagamento..." : "Aprovação rápida"}
      </span>
    </button>
  );
}

function DisabledCard({ title }: { title: string }) {
  return (
    <button
      disabled
      className="flex min-h-36 w-full cursor-not-allowed flex-col items-center justify-center rounded-lg border border-neutral-300 p-4 text-center opacity-50 dark:border-neutral-700"
    >
      <CreditCardIcon className="mb-3 h-9 w-9" />
      <strong>{title}</strong>
      <span className="mt-1 text-xs">Em breve</span>
    </button>
  );
}

function PaymentDetails({
  initialPayment,
}: {
  initialPayment: PaymentResponseDTO;
}) {
  const [payment, setPayment] = useState(initialPayment);
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(
    () => Date.now() >= new Date(initialPayment.dataExpiracao).getTime(),
  );
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [pending, startTransition] = useTransition();
  const pollingStartedAt = useRef(Date.now());
  const requestInFlight = useRef(false);

  const isPending = payment.statusPagamento === "PENDENTE";

  useEffect(() => {
    if (!isPending || isExpired || pollingTimedOut) return;

    async function refreshAutomatically() {
      if (document.visibilityState !== "visible" || requestInFlight.current) {
        return;
      }

      if (Date.now() >= new Date(payment.dataExpiracao).getTime()) {
        setIsExpired(true);
        return;
      }

      if (Date.now() - pollingStartedAt.current >= POLLING_LIMIT_MS) {
        setPollingTimedOut(true);
        return;
      }

      requestInFlight.current = true;
      try {
        const result = await refreshPaymentAction(payment.id);
        setError(result.error);
        if (result.payment) setPayment(result.payment);
      } finally {
        requestInFlight.current = false;
      }
    }

    const interval = window.setInterval(
      refreshAutomatically,
      POLLING_INTERVAL_MS,
    );
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshAutomatically();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [
    isExpired,
    isPending,
    payment.dataExpiracao,
    payment.id,
    pollingTimedOut,
  ]);

  function run(
    action: () => Promise<{ payment?: PaymentResponseDTO; error?: string }>,
  ) {
    startTransition(async () => {
      if (requestInFlight.current) return;
      requestInFlight.current = true;
      try {
        const result = await action();
        setError(result.error);
        if (result.payment) {
          setPayment(result.payment);
          setIsExpired(
            Date.now() >= new Date(result.payment.dataExpiracao).getTime(),
          );
        }
      } finally {
        requestInFlight.current = false;
      }
    });
  }

  async function copyPix() {
    if (!payment.pixCopiaCola) return;
    await navigator.clipboard.writeText(payment.pixCopiaCola);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const canPay = isPending && !isExpired;

  return (
    <section className="mt-6 text-center">
      <p className="text-sm text-neutral-500">Status do pagamento</p>
      <p className="text-lg font-semibold">
        {payment.statusPagamento.replaceAll("_", " ")}
      </p>
      {canPay && payment.qrCodePix ? (
        <Image
          src={`data:image/png;base64,${payment.qrCodePix}`}
          alt="QR Code para pagamento PIX"
          width={320}
          height={320}
          unoptimized
          className="mx-auto my-6 h-auto w-full max-w-80"
        />
      ) : null}
      {canPay && payment.pixCopiaCola ? (
        <div className="text-left">
          <label className="text-sm font-medium">
            PIX copia e cola
            <textarea
              readOnly
              value={payment.pixCopiaCola}
              className="mt-1 h-28 w-full resize-none rounded-md border border-neutral-300 bg-neutral-50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="button"
            onClick={copyPix}
            className="mt-3 w-full rounded-full bg-blue-600 p-3 text-sm font-medium text-white hover:opacity-90"
          >
            {copied ? "Código copiado" : "Copiar código PIX"}
          </button>
        </div>
      ) : null}
      <dl className="mt-6 space-y-2 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Valor</dt>
          <dd>
            <Price amount={payment.valor.toString()} currencyCode="BRL" />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Expiração</dt>
          <dd>{new Date(payment.dataExpiracao).toLocaleString("pt-BR")}</dd>
        </div>
        {payment.dataPagamento ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Pago em</dt>
            <dd>{new Date(payment.dataPagamento).toLocaleString("pt-BR")}</dd>
          </div>
        ) : null}
      </dl>
      {error ? (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      ) : null}
      {isExpired ? (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Este PIX expirou. Você ainda pode atualizar o status manualmente.
        </p>
      ) : null}
      {pollingTimedOut ? (
        <p className="mt-4 rounded-md bg-neutral-100 p-3 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          A atualização automática foi pausada após 10 minutos. Use o botão
          abaixo para consultar novamente.
        </p>
      ) : null}
      {isPending ? (
        <div className="mt-6 space-y-3">
          <button
            disabled={pending}
            onClick={() => run(() => refreshPaymentAction(payment.id))}
            className="w-full rounded-full bg-blue-600 p-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Consultando..." : "Atualizar status"}
          </button>
          <button
            disabled={pending}
            onClick={() => run(() => cancelPaymentAction(payment.id))}
            className="w-full rounded-full border border-red-500 p-3 text-sm font-medium text-red-600 disabled:opacity-60"
          >
            Cancelar pagamento
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700"
      role="alert"
    >
      {message}
    </p>
  );
}
