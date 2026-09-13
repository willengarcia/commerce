export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiErrorMessage(status: number, body: unknown): string {
  if (typeof body === "string" && body.trim()) return body;

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["message", "mensagem", "error", "detail"]) {
      if (typeof record[key] === "string" && record[key]) return record[key];
    }
  }

  const messages: Record<number, string> = {
    400: "A requisição enviada é inválida.",
    401: "É necessário autenticar-se para continuar.",
    403: "Você não tem permissão para acessar este recurso.",
    404: "O recurso solicitado não foi encontrado.",
    409: "A operação conflita com o estado atual do recurso.",
    422: "Não foi possível processar os dados enviados.",
    500: "O servidor encontrou um erro inesperado.",
  };

  return messages[status] ?? `A API respondeu com o status ${status}.`;
}
