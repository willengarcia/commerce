import type { PaymentResponseDTO } from "./api/payments";
export type PaymentState = {
  payment?: PaymentResponseDTO;
  error?: string;
  verifying?: boolean;
};
export function mustReusePayment(payment: PaymentResponseDTO): boolean {
  return ["PENDENTE", "APROVADO", "REEMBOLSADO"].includes(
    payment.statusPagamento,
  );
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
