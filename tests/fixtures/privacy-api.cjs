// Local-only fixture. No connection to the real backend, customers or payments.
const http = require("node:http");
const product = {
  id: 1,
  nome: "Produto demonstrativo",
  descricao: "Produto para validação local",
  preco: 100,
  quantidadeEstoque: 5,
  status: "ATIVO",
  sku: "DEMO",
};
const page = (content) => ({
  content,
  number: 0,
  size: 10,
  totalPages: 1,
  totalElements: content.length,
  first: true,
  last: true,
  empty: !content.length,
});
http
  .createServer((req, res) => {
    const p = new URL(req.url, "http://localhost").pathname.replace(
      "/api/v1",
      "",
    );
    let status = 200,
      data = [];
    if (p === "/products") data = page([product]);
    else if (p === "/products/1") data = product;
    else if (p === "/products/1/reviews") data = page([]);
    else if (p === "/customers/me")
      data = {
        id: 1,
        nomeCompleto: "Cliente fictício",
        email: "customer@example.test",
      };
    else if (p === "/orders/me") data = [];
    else if (p === "/orders/10")
      data = {
        orderId: 10,
        status: "AGUARDANDO_PAGAMENTO",
        valorTotal: 100,
        items: [],
      };
    else if (p.startsWith("/carts") || p.startsWith("/payments")) {
      status = 404;
      data = { message: "Fixture não encontrada" };
    }
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  })
  .listen(3198, "127.0.0.1");
