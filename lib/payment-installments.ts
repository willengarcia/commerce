export interface PaymentInstallmentConfig {
  enabled: boolean;
  minimumOrderValue: number;
  maxInstallments: number;
  buyerPaysInterest: boolean;
}

/** Decimal amounts from the API are compared as safe integer cents. */
export function moneyCents(value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Valor monetário inválido.");
  const cents = Math.round((value + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents))
    throw new Error("Valor monetário inválido.");
  return cents;
}

export function parseInstallmentConfig(
  value: unknown,
): PaymentInstallmentConfig {
  const c = value as PaymentInstallmentConfig | null;
  if (
    !c ||
    typeof c.enabled !== "boolean" ||
    typeof c.buyerPaysInterest !== "boolean" ||
    typeof c.minimumOrderValue !== "number" ||
    !Number.isSafeInteger(c.maxInstallments) ||
    c.maxInstallments < 1
  )
    throw new Error("Configuração de parcelamento inválida.");
  moneyCents(c.minimumOrderValue);
  return {
    enabled: c.enabled,
    minimumOrderValue: c.minimumOrderValue,
    maxInstallments: c.maxInstallments,
    buyerPaysInterest: c.buyerPaysInterest,
  };
}

export function getMaxAllowedInstallments(
  orderTotal: number,
  config: PaymentInstallmentConfig,
): number {
  const total = moneyCents(orderTotal),
    minimum = moneyCents(config.minimumOrderValue);
  return !config.enabled || config.maxInstallments <= 1 || total <= minimum
    ? 1
    : config.maxInstallments;
}

export type InstallmentQuote = {
  config: PaymentInstallmentConfig;
  amount: number;
};
export type InstallmentQuoteResult =
  | { quote: InstallmentQuote; error?: never }
  | { quote?: never; error: string };

export function paymentMethodDescription(payment: {
  metodoPagamento: string;
  parcelas?: number | null;
}): string {
  if (payment.metodoPagamento === "PIX") return "PIX — À vista";
  const method =
    payment.metodoPagamento === "CARTAO_CREDITO"
      ? "Cartão de crédito"
      : "Cartão de débito";
  if (payment.metodoPagamento === "CARTAO_DEBITO") return `${method} — À vista`;
  const n = payment.parcelas;
  return `${method} — ${n === 1 ? "À vista" : typeof n === "number" && Number.isSafeInteger(n) && n > 1 ? `${n}x` : "Parcelamento não informado"}`;
}
