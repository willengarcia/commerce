"use server";
import { cookies } from "next/headers";
import { ApiError } from "lib/api/errors";
import {
  createCardPayment,
  createPixPayment,
  getPaymentByOrder,
} from "lib/api/payments";
import { getSessionToken } from "lib/api/auth";
import { mustReusePayment, type PaymentState } from "lib/payment-state";
import {
  positiveId,
  validCardData,
  type CardPaymentData,
} from "lib/validation/customer-v110";

const guardName = (id: number) => `payment_attempt_${id}`;
async function findPayment(id: number) {
  try {
    return await getPaymentByOrder(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
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
    return { payment };
  } catch {
    const result = await inspectOrderPaymentAction(orderId);
    if (result.payment && result.payment.id !== existing.payment?.id) {
      jar.set(guardName(orderId), "", {
        path: `/account/orders/${orderId}/payment`,
        maxAge: 0,
      });
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
