import type { PaymentResponseDTO } from "./api/payments";
export type PaymentState = {
  payment?: PaymentResponseDTO;
  error?: string;
  verifying?: boolean;
};

export function canRetryPayment(payment: PaymentResponseDTO): boolean {
  return ["RECUSADO", "CANCELADO", "EXPIRADO"].includes(
    payment.statusPagamento,
  );
}

export function mustReusePayment(payment: PaymentResponseDTO): boolean {
  // Unknown states are blocked by default. Only explicit terminal states may
  // start another charge; the backend remains the payment authority.
  return !canRetryPayment(payment);
}
export const paymentStatusLabel: Record<
  PaymentResponseDTO["statusPagamento"],
  string
> = {
  PENDENTE: "Pagamento pendente",
  APROVADO: "Pagamento aprovado",
  RECUSADO: "Pagamento recusado",
  CANCELADO: "Pagamento cancelado",
  EXPIRADO: "Pagamento expirado",
  REEMBOLSADO: "Pagamento reembolsado",
};
