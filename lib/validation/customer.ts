export type RegistrationField =
  | "nomeCompleto"
  | "cpf"
  | "email"
  | "telefone"
  | "senha";

export type RegistrationData = Record<RegistrationField, string>;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

export function normalizeCpf(cpf: string): string {
  return cpf.replace(/[.-]/g, "");
}

export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) return false;

  const digits = normalizeCpf(cpf);
  if (new Set(digits).size === 1) return false;

  const calculateDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index++) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(9) === Number(digits[9]) &&
    calculateDigit(10) === Number(digits[10])
  );
}

export function validateRegistration(
  values: RegistrationData,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const nameWords = values.nomeCompleto.trim().split(/\s+/).filter(Boolean);

  if (nameWords.length < 2) {
    errors.nomeCompleto = "Informe o nome completo com pelo menos 2 palavras.";
  }

  if (!isValidCpf(values.cpf.trim())) {
    errors.cpf = "Informe um CPF válido, como 044.483.572-52 ou 04448357252.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Informe um endereço de e-mail válido.";
  }

  const telephone = values.telefone;
  if (/[^0-9]/.test(telephone)) {
    errors.telefone =
      "Use somente números, sem espaços ou caracteres especiais.";
  } else if (telephone.length > 11) {
    errors.telefone = "O telefone deve ter no máximo 11 números.";
  } else if (!telephone) {
    errors.telefone = "Informe o telefone.";
  }

  if (values.senha.length < 8) {
    errors.senha = "A senha deve ter no mínimo 8 caracteres.";
  }

  return errors;
}
