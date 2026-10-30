"use client";
import {
  inspectOrderPaymentAction,
  submitCustomerPaymentAction,
} from "app/(account)/account/orders/[id]/payment/customer-actions";
import { PaymentDetails } from "./payment-experience";
import { CreditCardPayment } from "./credit-card-payment";
import {
  mustReusePayment,
  paymentStatusLabel,
  type PaymentState,
} from "lib/payment-state";
import type { CardPaymentData } from "lib/validation/customer-v110";
import { useCallback, useEffect, useRef, useState } from "react";

export function CustomerPayment({
  orderId,
  amount,
  canPay,
  initialState,
}: {
  orderId: number;
  amount: number;
  canPay: boolean;
  initialState: PaymentState;
}) {
  const [state, setState] = useState(initialState);
  const [method, setMethod] = useState<"PIX" | "CARTAO_CREDITO">("PIX");
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await inspectOrderPaymentAction(orderId);
      if (mounted.current)
        setState((previous) => ({
          ...result,
          payment: result.payment ?? previous.payment,
        }));
    } catch {
      if (mounted.current)
        setState((previous) => ({
          ...previous,
          verifying: true,
          error: "Erro de comunicação ao consultar o pagamento.",
        }));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [orderId]);
  const polling = Boolean(
    state.verifying ||
      (state.payment?.metodoPagamento === "CARTAO_CREDITO" &&
        state.payment.statusPagamento === "PENDENTE"),
  );
  useEffect(() => {
    if (!polling) return;
    const started = Date.now();
    setPaused(false);
    const timer = setInterval(() => {
      if (Date.now() - started >= 600000) {
        setPaused(true);
        clearInterval(timer);
        return;
      }
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [polling, refresh]);
  async function submit(card: CardPaymentData | null) {
    if (
      lock.current ||
      state.verifying ||
      (state.payment && mustReusePayment(state.payment))
    )
      return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await submitCustomerPaymentAction(orderId, card);
      if (mounted.current) setState(result);
    } catch {
      if (mounted.current)
        setState((previous) => ({
          ...previous,
          verifying: true,
          error:
            "Verificando confirmação do pagamento. Não faça uma nova tentativa.",
        }));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const reusable = state.payment && mustReusePayment(state.payment);
  return (
    <section className="mt-6 space-y-4">
      {busy ? (
        <p role="status">Processando ou verificando pagamento...</p>
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-md bg-amber-50 p-3 text-sm text-amber-900"
        >
          {state.error}
        </p>
      ) : null}
      {state.verifying ? (
        <>
          <h2 className="font-semibold">
            Verificando confirmação do pagamento
          </h2>
          <p className="text-sm">
            A tentativa ainda não foi confirmada. Uma nova cobrança está
            bloqueada enquanto verificamos o resultado.
          </p>
        </>
      ) : state.payment ? (
        state.payment.metodoPagamento === "PIX" && reusable ? (
          <PaymentDetails
            key={state.payment.id}
            payment={state.payment}
            onPaymentChange={(payment) => setState({ payment })}
          />
        ) : (
          <div role="status" className="rounded-lg border p-4">
            <p className="font-semibold">
              {paymentStatusLabel[state.payment.statusPagamento]}
            </p>
            <p className="mt-2 text-sm">
              {state.payment.statusPagamento === "PENDENTE"
                ? "Aguardando confirmação do Mercado Pago."
                : state.payment.statusPagamento === "APROVADO"
                  ? "Pagamento confirmado. Acompanhe o pedido em Minha Conta."
                  : "Consulte o status antes de iniciar uma nova tentativa."}
            </p>
          </div>
        )
      ) : null}
      {polling || paused ? (
        <>
          <button
            disabled={busy}
            onClick={() => void refresh()}
            className="rounded-full border border-blue-600 px-4 py-2 text-blue-600 disabled:opacity-50"
          >
            Consultar status
          </button>
          {paused ? (
            <p className="text-sm">
              Consulta automática pausada. Você pode consultar manualmente; não
              é necessário pagar novamente.
            </p>
          ) : null}
        </>
      ) : null}
      {!state.verifying && !reusable && canPay ? (
        <>
          <h2 className="text-lg font-semibold">Escolha como pagar</h2>
          <fieldset disabled={busy} className="flex flex-wrap gap-4">
            <legend className="sr-only">Método de pagamento</legend>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-4">
              <input
                type="radio"
                name="paymentMethod"
                checked={method === "PIX"}
                onChange={() => setMethod("PIX")}
              />
              PIX
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-4">
              <input
                type="radio"
                name="paymentMethod"
                checked={method === "CARTAO_CREDITO"}
                onChange={() => setMethod("CARTAO_CREDITO")}
              />
              Cartão de crédito
            </label>
          </fieldset>
          {method === "PIX" ? (
            <button
              disabled={busy}
              onClick={() => void submit(null)}
              className="w-full rounded-full bg-blue-600 p-3 text-white disabled:opacity-50"
            >
              {busy ? "Gerando pagamento..." : "Gerar PIX"}
            </button>
          ) : (
            <CreditCardPayment
              orderId={orderId}
              amount={amount}
              disabled={busy}
              onSubmit={submit}
            />
          )}
        </>
      ) : null}
      {!canPay && !state.payment ? (
        <p>Este pedido não está aguardando pagamento.</p>
      ) : null}
    </section>
  );
}
