"use server";
import { cookies } from "next/headers";
import { ApiError } from "lib/api/errors";
import {
  createCardPayment,
  createPixPayment,
  getPaymentByOrder,
  getPaymentInstallmentConfig,
  type PaymentResponseDTO,
} from "lib/api/payments";
import { getSessionToken } from "lib/api/auth";
import { mustReusePayment, type PaymentState } from "lib/payment-state";
import {
  positiveId,
  validCardData,
  type CardPaymentData,
} from "lib/validation/customer-v110";
import { revalidatePath } from "next/cache";
import { getOrder } from "lib/api/orders";
import {
  getMaxAllowedInstallments,
  moneyCents,
  type InstallmentQuoteResult,
} from "lib/payment-installments";

export async function loadInstallmentQuoteAction(
  orderId: number,
): Promise<InstallmentQuoteResult> {
  if (!positiveId(orderId)) return { error: "Pedido inválido." };
  try {
    const [config, order] = await Promise.all([
      getPaymentInstallmentConfig(),
      getOrder(orderId),
    ]);
    if (
      order.status !== "AGUARDANDO_PAGAMENTO" ||
      moneyCents(order.valorTotal) <= 0
    )
      return {
        error:
          "Este pedido não está disponível para um novo pagamento. Atualize a página.",
      };
    return { quote: { config, amount: order.valorTotal } };
  } catch {
    return {
      error:
        "Não foi possível consultar as condições de parcelamento. Tente novamente.",
    };
  }
}

const guardName = (id: number) => `payment_attempt_${id}`;
async function findPayment(id: number) {
  try {
    return await getPaymentByOrder(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

function revalidatePaymentOrder(payment: PaymentResponseDTO) {
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${payment.orderId}`);
  revalidatePath(`/account/orders/${payment.orderId}/payment`);
}

export async function inspectOrderPaymentAction(
  orderId: number,
): Promise<PaymentState> {
  if (!positiveId(orderId))
    return { error: "Pedido inválido.", verifying: true };
  try {
    const payment = await findPayment(orderId);
    const guard = (await cookies()).get(guardName(orderId));
    // An old terminal payment must not resolve an uncertain newer attempt.
    const verifying = Boolean(
      guard && (!payment || payment.id === Number(guard.value)),
    );
    return { payment, verifying };
  } catch {
    return {
      verifying: true,
      error:
        "Erro de comunicação. Estamos verificando a confirmação do pagamento. Não faça outra tentativa.",
    };
  }
}

export async function submitCustomerPaymentAction(
  orderId: number,
  card: CardPaymentData | null,
): Promise<PaymentState> {
  if (
    !positiveId(orderId) ||
    (card !== null && (!card || !validCardData(card)))
  )
    return { error: "Dados de pagamento inválidos." };
  if (!(await getSessionToken()))
    return { error: "Sua sessão expirou. Entre novamente." };
  const existing = await inspectOrderPaymentAction(orderId);
  if (
    existing.verifying ||
    (existing.payment && mustReusePayment(existing.payment))
  )
    return existing;
  if (card) {
    const current = await loadInstallmentQuoteAction(orderId);
    if (!current.quote)
      return { error: current.error, refreshInstallments: true };
    const { amount, config } = current.quote;
    if (
      card.orderTotal !== undefined &&
      (!Number.isFinite(card.orderTotal) ||
        card.orderTotal < 0 ||
        moneyCents(card.orderTotal) !== moneyCents(amount))
    )
      return {
        error:
          "O valor do pedido mudou. Confira as condições atualizadas e selecione novamente as parcelas.",
        refreshInstallments: true,
      };
    if (card.parcelas > getMaxAllowedInstallments(amount, config))
      return {
        error:
          "As condições de parcelamento mudaram. Selecione uma opção disponível.",
        refreshInstallments: true,
      };
  }
  const jar = await cookies();
  // Server-only marker contains only the previous payment ID, never card data.
  // It survives reloads; the backend remains the authority for idempotency.
  jar.set(guardName(orderId), String(existing.payment?.id ?? 0), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/account/orders/${orderId}/payment`,
  });
  try {
    const payment =
      card === null
        ? await createPixPayment(orderId)
        : await createCardPayment(orderId, card);
    jar.set(guardName(orderId), "", {
      path: `/account/orders/${orderId}/payment`,
      maxAge: 0,
    });
    revalidatePaymentOrder(payment);
    return { payment };
  } catch (cause) {
    // Only a definite installment validation failure may release this attempt.
    // Reconcile first; a transport error must never enable a duplicate charge.
    if (
      card &&
      cause instanceof ApiError &&
      cause.status === 422 &&
      /parcela/i.test(cause.message)
    ) {
      try {
        const confirmed = await findPayment(orderId);
        if (confirmed && confirmed.id !== existing.payment?.id) {
          jar.set(guardName(orderId), "", {
            path: `/account/orders/${orderId}/payment`,
            maxAge: 0,
          });
          revalidatePaymentOrder(confirmed);
          return { payment: confirmed };
        }
        jar.set(guardName(orderId), "", {
          path: `/account/orders/${orderId}/payment`,
          maxAge: 0,
        });
        return {
          payment: confirmed,
          error: cause.message,
          refreshInstallments: true,
        };
      } catch {
        /* Uncertain reconciliation keeps the existing guard. */
      }
    }
    const result = await inspectOrderPaymentAction(orderId);
    if (result.payment && result.payment.id !== existing.payment?.id) {
      jar.set(guardName(orderId), "", {
        path: `/account/orders/${orderId}/payment`,
        maxAge: 0,
      });
      revalidatePaymentOrder(result.payment);
      return { payment: result.payment };
    }
    return {
      payment: existing.payment,
      verifying: true,
      error:
        "Não foi possível confirmar o resultado. Consulte o status; não envie outro pagamento enquanto a tentativa estiver em verificação.",
    };
  }
}
