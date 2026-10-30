export function positiveId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function validatePasswordReset(
  token: string,
  password: string,
  confirmation: string,
): string | undefined {
  if (!token.trim())
    return "Link de recuperação inválido. Solicite um novo link.";
  if (password.length < 8 || password.length > 72)
    return "A senha deve conter entre 8 e 72 caracteres.";
  if (!password.trim()) return "Informe uma senha válida.";
  if (password !== confirmation) return "As senhas devem coincidir.";
}

export function validateReview(
  nota: number,
  comentario: string,
): string | undefined {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5)
    return "Selecione uma nota de 1 a 5.";
  if (comentario.length > 1000)
    return "O comentário deve ter no máximo 1.000 caracteres.";
}

export type CardPaymentData = {
  token: string;
  parcelas: number;
  paymentMethodId: string;
  issuerId: number | null;
};
export function validCardData(value: CardPaymentData): boolean {
  return (
    typeof value.token === "string" &&
    Boolean(value.token.trim()) &&
    Number.isSafeInteger(value.parcelas) &&
    value.parcelas >= 1 &&
    typeof value.paymentMethodId === "string" &&
    Boolean(value.paymentMethodId.trim()) &&
    (value.issuerId === null || positiveId(value.issuerId))
  );
}
