// In-memory local test API. Never contacts a bank or the real backend.
const http = require("node:http");
let state;
const reset = (values) =>
  (state = {
    amount: 150,
    config: {
      enabled: true,
      minimumOrderValue: 100,
      maxInstallments: 5,
      buyerPaysInterest: true,
    },
    unavailable: false,
    rejectOnce: false,
    posts: [],
    payment: null,
    ...values,
  });
reset({});
http
  .createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const path = new URL(req.url, "http://localhost").pathname;
    const send = (code, data) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };
    if (path === "/__test" && req.method === "POST") {
      reset(body);
      return send(200, {});
    }
    if (path === "/__test") return send(200, state);
    const p = path.replace("/api/v1", "");
    if (p === "/products")
      return send(200, {
        content: [],
        number: 0,
        size: 10,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true,
        empty: true,
      });
    if (p === "/payments/installments/config")
      return state.unavailable
        ? send(503, { message: "Indisponível" })
        : send(200, state.config);
    if (p === "/orders/10")
      return send(200, {
        orderId: 10,
        status: "AGUARDANDO_PAGAMENTO",
        valorTotal: state.amount,
        items: [],
        address: {
          id: 1,
          nomeDestinatario: "Fixture",
          rua: "Teste",
          numero: "1",
          bairro: "Teste",
          cidade: "Teste",
          estado: "SP",
          cep: "00000000",
        },
      });
    if (p === "/customers/me")
      return send(200, {
        id: 1,
        nomeCompleto: "Cliente fictício",
        email: "customer@example.test",
      });
    if (p === "/payments/orders/10") {
      if (req.method === "POST") {
        state.posts.push({ body, device: req.headers["x-meli-session-id"] });
        if (state.rejectOnce) {
          state.rejectOnce = false;
          state.config.maxInstallments = 3;
          return send(422, {
            message: "O número máximo de parcelas permitido é 3",
          });
        }
        state.payment = {
          id: 20,
          orderId: 10,
          metodoPagamento: body.metodoPagamento,
          statusPagamento: "APROVADO",
          valor: state.amount,
          parcelas: body.cartao?.parcelas ?? null,
        };
        return send(200, state.payment);
      }
      return state.payment
        ? send(200, state.payment)
        : send(404, { message: "Sem pagamento" });
    }
    if (p.startsWith("/carts")) return send(404, { message: "Sem carrinho" });
    return send(200, []);
  })
  .listen(3197, "127.0.0.1");
