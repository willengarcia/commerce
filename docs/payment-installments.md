# Parcelamento do cartão

Implementação no storefront, na branch main local. Não altera backend, configurações de produção ou deploy. Não inclui painel administrativo, inexistente neste projeto.

## Fluxo

1. Ao selecionar cartão, uma Server Action consulta o pedido e `GET /payments/installments/config`, com autenticação e sem cache. Usa `valorTotal` oficial, incluindo os ajustes já calculados pelo backend.
2. Compara valores em centavos. Parcelamento desabilitado, máximo igual a 1 ou total menor/igual ao mínimo permitem somente 1x. Acima do mínimo, aplica o máximo recebido. Não há valores comerciais de fallback.
3. O Card Payment Brick oficial recebe o total original e `minInstallments: 1` / `maxInstallments`. O próprio Mercado Pago consulta emissor/BIN/cartão e apresenta somente as condições disponíveis. O frontend não calcula juros nem divide o total para inventar parcelas. `buyerPaysInterest` controla apenas a informação ao comprador.
4. Atualizar condições ou alterar o valor remonta o formulário e elimina a seleção anterior. Respostas antigas e callbacks de formulários desmontados são ignorados. Antes do POST, o servidor confere novamente o valor e o limite comercial.
5. O POST mantém somente `metodoPagamento` e `cartao: { token, parcelas, paymentMethodId, issuerId }`. O total usado para detectar mudanças fica restrito à comunicação interna com a Server Action. Device ID continua no header `X-meli-session-id`. PIX mantém seu contrato e não depende da configuração de parcelas.
6. Um 422 com mensagem referente a parcelas é reconciliado com o pagamento existente. Sem cobrança nova confirmada, mostra a mensagem do backend, atualiza configuração/formulário e permite nova escolha, sem POST automático. Falha de comunicação na reconciliação mantém o bloqueio contra duplicação.
7. Detalhes e confirmação mostram a quantidade persistida. Cartões antigos sem `parcelas` exibem “Parcelamento não informado”. Não são inferidos juros, valores líquidos ou valores individuais.

## Arquivos

Criados:

- `lib/payment-installments.ts`: validação da configuração, regra monetária e descrição do pagamento.
- `components/payment/order-payment-summary.tsx`: resumo nos detalhes do pedido.
- `tests/fixtures/installments-api.cjs`: API local fictícia.
- `tests/installments-browser/installments.spec.ts`: cenários de navegação com provedor simulado.
- `playwright.installments.config.ts`: execução local isolada.
- `docs/payment-installments.md`: entrega e homologação.

Modificados:

- `lib/api/payments.ts`: consulta autenticada da configuração e DTO de parcelas.
- `lib/validation/customer-v110.ts`: total da cotação interna, sem alteração do payload do backend.
- `lib/payment-state.ts`: sinal de atualização de parcelas.
- `app/(account)/account/orders/[id]/payment/customer-actions.ts`: cotação, revalidação e tratamento de 422.
- `components/payment/credit-card-payment.tsx`: consulta, mensagens, erro/retry e atualização.
- `components/payment/mercado-pago-card-brick.tsx`: limites oficiais, callbacks estáveis e descarte de instâncias antigas.
- `components/payment/customer-payment.tsx`: atualização e confirmação.
- `app/(account)/account/orders/[id]/page.tsx`: resumo de pagamento.
- `tests/customer-v110.test.cjs`: testes de regras, contrato e concorrência.
- `package.json`: comando `test:installments:browser`.

## Validação automatizada

- `node --test tests/customer-v110.test.cjs tests/privacy.test.cjs`: 33 testes aprovados (26 de cliente/pagamento e 7 de privacidade).
- `node node_modules/typescript/bin/tsc --noEmit`: aprovado.
- `node node_modules/next/dist/bin/next build`: aprovado, com chave pública fictícia destinada somente aos testes locais.
- `pnpm test:installments:browser`: 7 cenários aprovados em Chromium com API e SDK simulados. Nenhuma cobrança ou acesso ao Mercado Pago real.
- Não existe script de lint no projeto. O comando `test` executa Prettier; a verificação global encontrou problemas de formatação em arquivos preexistentes. Os arquivos desta alteração são verificados separadamente; não foi feita reformatação global.

Cobertura: limites 99,99 / 100 / 100,01 / 150 com configuração fictícia mínimo 100 e máximo 5; máximo 3; desabilitado; provedor oferecendo somente 2x; mudança de valor; configuração indisponível e retry; 422 sem reenvio; resposta fora de ordem; callback antigo; pagamentos legados; payload PIX; Device ID; bloqueio após resultado incerto.

Para repetir o navegador, faça um build local com `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-fixture`, `NEXT_PUBLIC_CLARITY_ID` vazio e `BACKEND_API_URL=http://127.0.0.1:3197`. Depois execute `pnpm test:installments:browser`. Portas 3117 e 3197 devem estar livres. Não publique esse build de testes; produção precisa de seu próprio build com as variáveis corretas.

## Limitações e homologação necessária

O Brick fornece o seletor oficial; seu callback de submissão não disponibiliza uma lista `payer_costs` completa para construir um resumo financeiro externo. Por isso os valores e condições permanecem no seletor do Mercado Pago. Não foi criado um seletor paralelo com taxas simuladas. Referências: [configuração oficial de parcelas](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/card-payment-brick/advanced-features/configure-installments) e [contrato do Card Payment Brick](https://github.com/mercadopago/sdk-js/blob/main/docs/bricks/card-payment.md).

O backend continua responsável por validar o limite no momento da cobrança e garantir idempotência entre abas/dispositivos. A detecção específica de 422 usa a palavra “parcela” na mensagem; se o backend fornecer um código de erro estável, ele deve substituir esse reconhecimento textual. Mudanças comerciais são consultadas ao abrir/atualizar e antes de enviar, sem polling de configuração.

Homologar com credenciais e cartões de teste oficiais compatíveis com a conta:

1. Confirmar o endpoint autenticado e os quatro campos esperados; repetir os limites com o valor final do pedido, incluindo frete/descontos.
2. Trocar cartão/BIN e emissor no formulário real e confirmar que o SDK atualiza opções e invalida escolhas incompatíveis. Repetir em celular e desktop.
3. Conferir valor individual, total e presença/ausência de juros no seletor oficial antes de confirmar. Verificar a configuração comercial da conta quando `buyerPaysInterest` mudar; o booleano não configura taxas no Mercado Pago.
4. Aprovar e rejeitar uma compra de teste; conferir parcelas persistidas, método, total original e Device ID, sem registrar token/dados do cartão.
5. Alterar total/limite entre a escolha e a submissão; confirmar nova seleção. Forçar 422 e indisponibilidade, sem reenvio automático.
6. Conferir detalhes de pagamentos novos e legados, além de geração/consulta PIX.

Esses passos dependem do backend e do Mercado Pago reais e não foram substituídos pelos testes simulados. Não foi realizada venda real.
