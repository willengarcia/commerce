# Microsoft Clarity e privacidade — PLATUN

Implementação na `main` local, sem deploy. Documentação consultada em 25/11/2026. A presença do banner não certifica conformidade integral com a LGPD.

## Configuração e condições de ativação

1. Criar o projeto no [Microsoft Clarity](https://clarity.microsoft.com/) e obter o Project ID em **Settings → Overview**. Não usar tokens ou credenciais no frontend.
2. Na Vercel, em **Project → Settings → Environment Variables**, cadastrar `NEXT_PUBLIC_CLARITY_ID` para o ambiente desejado. A variável é pública e incorporada ao bundle no build; alterações exigem novo build.
3. Cadastrar `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTROLLER_CNPJ` e `PRIVACY_CONTACT_EMAIL`. O responsável informou TechSkill e 58.737.575/0001-71; confirmar a identificação jurídica para publicação. O e-mail de privacidade não foi informado. Não foi inventado um contato nem alterado o ambiente de produção.
4. Revisar a política, contratos e requisitos legais abaixo. Somente depois definir `CLARITY_PRIVACY_REVIEWED=true`. Ausência do ID, falta dos dados do controlador ou flag diferente de `true` impedem a inicialização. A interface de preferências continua acessível e informa a indisponibilidade da análise.
5. No painel Clarity, configurar **Settings → Masking → Strict**. Manter também o `data-clarity-mask="true"` no `body`, nas avaliações e nos modais. Não adicionar `data-clarity-unmask`. Mascaramento não protege conteúdo pessoal inserido em CSS, URLs ou títulos; não colocar esse conteúdo nesses locais.
6. Em **Settings → Setup**, desligar a opção que permite cookies por padrão / habilitar Consent Mode para todas as regiões atendidas, inclusive Brasil. Os nomes podem variar no painel. Não ativar integrações publicitárias. O frontend sempre envia `ad_Storage: "denied"`.
7. Validar em uma prévia antes de publicar. Nenhum deploy é feito por estes testes.

Para desabilitar: remover `NEXT_PUBLIC_CLARITY_ID` e gerar novo build, ou definir `CLARITY_PRIVACY_REVIEWED=false` e reimplantar. Uma implantação não elimina scripts em documentos que já estão abertos; esses documentos precisam ser encerrados/recarregados. Para o visitante, a revogação pelo rodapé encerra o documento ativo imediatamente.

## Consentimento

`lib/privacy/consent.ts` centraliza `CONSENT_VERSION`, `CONSENT_DAYS` (180), chave local e validação. O registro contém somente versão, flags de finalidade e datas ISO. Aceitação e recusa são persistidas. A preferência analítica começa desativada. Publicidade é sempre falsa; os campos extras de registros antigos são descartados.

Uma mudança relevante da finalidade/texto deve incrementar `CONSENT_VERSION`, atualizar o texto da política e exigir nova decisão. Dados inválidos, versão anterior, prazo vencido, datas incoerentes e falha de leitura não autorizam coleta. Falha ao gravar uma aceitação não ativa o Clarity. Há sincronização por evento `storage`, conferência ao retornar à janela e prazo de expiração durante a sessão. O armazenamento local pode ser apagado, alterado e não é compartilhado entre dispositivos; **não é uma trilha centralizada de comprovação de consentimento**.

O aviso inicial é um pop-up centralizado e responsivo, com altura limitada à tela e rolagem interna em telas pequenas. Aceitar e recusar usam o mesmo estilo. O X, Escape e clique fora do pop-up salvam a recusa e liberam a navegação. Aceitar salva a autorização e fecha o aviso. Gerenciar preferências troca o pop-up pelo diálogo de configurações, sem sobrepor dois modais. Ambos utilizam Headless UI, com foco controlado e rótulos acessíveis; o checkbox analítico começa desmarcado. O acesso às preferências permanece no rodapé das áreas públicas e privadas.

O módulo oficial `@microsoft/clarity` **1.0.2** é importado dinamicamente somente após autorização válida e aprovação das demais condições. Uma promessa única evita importações/inicializações concorrentes. `init()` e `consentV2({analytics_Storage: "granted", ad_Storage: "denied"})` são executados na mesma tarefa; o SDK enfileira a decisão enquanto o script carrega. Não se utiliza `identify`, tags com identificadores de clientes nem a API de consentimento antiga.

Na revogação, a decisão é gravada antes da API V2 negar ambas as finalidades. Cookies `_clck` e `_clsk` acessíveis são expirados para caminhos e domínios aplicáveis. Cookies de terceiros/HttpOnly não podem ser apagados pela aplicação. O documento é recarregado, pois **a negação de cookies permite modo de coleta sem cookies no Clarity**. Falha de gravação acrescenta `privacy-disabled=1` à URL de recarga, que fica fora da lista de monitoramento. Revogar não apaga automaticamente informações anteriormente recebidas pela Microsoft.

## Isolamento das rotas

O projeto usa Next.js 15.6.0-canary.60, App Router, React 19, Tailwind 4 e Headless UI. O antigo layout global foi extraído para `components/layout/app-shell.tsx`, preservando carrinho, navegação, WhatsApp e Vercel Analytics. Os layouts raiz independentes são:

- `app/(store)/layout.tsx`: vitrine pública elegível.
- `app/(account)/layout.tsx`: conta, login, cadastro, recuperação, endereços, pedidos, pagamento e nova rota `/cart`, sem Clarity.
- `app/(checkout)/layout.tsx`: checkout, sem Clarity.
- `app/[page]/layout.tsx`: conteúdo institucional dinâmico não auditado, sem Clarity.

**Não recriar `app/layout.tsx` por cima desses grupos**: isso eliminaria a separação de documentos. A navegação entre layouts raiz diferentes força carregamento integral, conforme documentação do Next.js. As URLs existentes foram preservadas; `app/page.tsx`, `app/product` e `app/search` foram movidos para `(store)`.

Lista positiva inicial: `/`, `/search`, `/search/category/<ID numérico positivo>`, `/product/<ID numérico positivo>` e `/privacy-policy`. Outras páginas institucionais somente após revisão e inclusão explícita. **Qualquer query string ou fragmento bloqueia o início**, inclusive busca livre, filtros, seleção de imagem e parâmetros de rastreamento. Isso reduz a cobertura analítica deliberadamente.

Também não se inicia Clarity quando o servidor encontra uma sessão autenticada. O navegador recebe apenas esse resultado booleano, nunca o token. Não é uma proteção de autenticação; é uma restrição adicional da análise.

Quando o documento está reservado para Clarity (incluindo importação pendente):

- Links internos são capturados antes dos handlers React e usam navegação integral. Links em nova aba mantêm seu comportamento; o novo documento passa pelas mesmas verificações.
- A busca usa submissão integral antes de a URL receber texto digitado.
- Galeria e variantes verificam o isolamento antes de `router.replace`.
- Abrir carrinho usa `/cart`, com o mesmo componente de carrinho em um documento sem análise. Se o modal já estiver aberto antes do consentimento, o início é bloqueado até ele fechar.
- Voltar/avançar e restauração de documento recarregam/revalidam o estado. `Referrer-Policy: no-referrer` evita que URLs anteriores sensíveis sejam encaminhadas como referenciador.

Ao adicionar uma nova navegação programática na vitrine, chamar `navigateAnalyticsDocument()` **antes** da navegação ou usar um grupo raiz não monitorado. Não depender de um efeito React após a troca de rota, de remover o elemento `<script>` ou só de desmontar componentes. Reexecutar os testes de isolamento após mudanças na arquitetura/Next.js.

## Política e pendências antes da publicação

A página `/privacy-policy` descreve finalidade, consentimento, categorias, cookies, Microsoft, possibilidade de processamento fora do Brasil, retenção referenciada, revogação e direitos. É uma política inicial local: conteúdo institucional dinâmico eventualmente mantido no Shopify deve ser conferido pelo controlador e conciliado antes da publicação.

Pendências obrigatórias:

- Confirmar TechSkill como razão social/identificação jurídica adequada, CNPJ e endereço/canais obrigatórios aplicáveis. Fornecer e configurar o e-mail de privacidade; nenhum e-mail foi deduzido.
- Revisar a descrição completa das operações de cadastro, venda e pagamento, bases legais, contratos, fornecedores e prazos de guarda da loja.
- Confirmar condições Microsoft, responsabilidades, localização/processamento internacional e mecanismo de transferência admissível; não foi presumido um mecanismo jurídico.
- Conferir a retenção aplicável ao projeto. A documentação atual informa 30 dias para reprodução e até 9 meses para cliques, mapas, sessões favoritas/marcadas e determinadas amostras; não se promete exclusão imediata nem prazo de 13 meses baseado em documentação antiga.
- Confirmar Consent Mode global, Strict e ausência de integrações publicitárias no painel. As configurações do painel não foram alteradas por este trabalho.
- Avaliar **Vercel Analytics**, integração já existente e mantida por limite de escopo. O controle implementado aqui é específico para Microsoft Clarity; não foi presumido que Vercel Analytics seja um recurso essencial nem declarado que a recusa controle essa integração anterior. Revisar aviso/base legal ou uma categoria adicional antes da publicação se necessário.
- Definir procedimento para atendimento de direitos e avaliação de comprovação de consentimento, além do armazenamento local.

## Testes e reprodução

Dependências: `@microsoft/clarity@1.0.2` em produção; `@playwright/test@1.65.1` somente desenvolvimento. Sem alterações em backend, banco ou código Mercado Pago. O instalador do pnpm sinalizou scripts de build do `sharp` bloqueados; não foram liberados. O build Next foi executado sem desabilitar verificações.

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:customer
pnpm test:privacy
pnpm exec tsc --noEmit
```

Para o teste de navegador, compilar **localmente** com ID fictício (nunca publicar esse build):

```powershell
$env:NEXT_PUBLIC_CLARITY_ID='privacyfixture'
$env:BACKEND_API_URL='http://127.0.0.1:3198'
$env:SITE_NAME='PLATUN'
pnpm build
pnpm test:privacy:browser
```

O Playwright inicia uma API fictícia em 3198 e o frontend em 3108. Todos os pedidos aos domínios Clarity/Bing são interceptados e respondidos localmente. Exercita o loader oficial; o script remoto é substituído por um gravador simulado que continua emitindo pedidos enquanto seu documento existir. São verificados: zero requisições antes da decisão/recusa, consentimento V2, inicialização única, persistência, revogação e cookies, duas abas, vencimento/versão/corrupção, falha de armazenamento/download, bloqueio de páginas, troca integral para login/carrinho, busca com texto pessoal fictício, conta autenticada, telas de checkout/pagamento, responsividade e teclado.

Os testes unitários também cobrem ID ausente, permissão negada, falha no import e validação da lista positiva. Os testes Customer existentes preservam o contrato de PIX, cartão e prevenção de duplicidade. Não são realizadas cobranças, envio de e-mails nem alterações em dados reais.

Limites da evidência: interceptação prova o bloqueio de carregamento e o isolamento do documento na versão testada em Chromium; não certifica o comportamento interno do script remoto, o conteúdo final das gravações na Microsoft, todas as versões de navegador nem o cumprimento jurídico. Antes de ativar, validar em prévia controlada com projeto de testes, revisar Network sem interceptação após consentimento, conferir as gravações com Strict, voltar/avançar/BFCache, Safari/Firefox e checkout com ambiente de pagamentos de teste. Se essa revisão não confirmar o isolamento, manter `CLARITY_PRIVACY_REVIEWED=false`.

Não há script `lint` no repositório. `pnpm test` corresponde à checagem global de Prettier; não substituir por um linter fictício nem reformatar arquivos alheios para ocultar falhas anteriores.

### Resultados executados

- 19 testes Customer existentes e 7 testes unitários de privacidade: **26 aprovados**.
- 14 testes de navegador com Project ID fictício e interceptação: **14 aprovados**.
- Build separado sem Project ID e teste de navegador com aceitação previamente armazenada: **1 aprovado**, sem requisições Clarity.
- Builds com e sem ID: **aprovados**. Checagem TypeScript: **aprovada**.
- Prettier nos arquivos de código/documentação criados ou editados: **aprovado**. A checagem global existente reportou problemas de formatação em arquivos fora do escopo (incluindo README, código Shopify e configuração). O lockfile preserva a formatação gerada pelo pnpm.
- API, cliente e conteúdo utilizados nos testes são fictícios. `/admin` não é uma rota administrativa implementada neste frontend; cai no roteamento institucional, que falhou ao buscar Shopify não configurado no teste, mas permaneceu sem Clarity. Isso não equivale a testar um painel administrativo externo.
- Nenhuma cobrança ou integração de produção foi executada. Mascaramento visual no painel real e navegadores adicionais continuam na lista de homologação manual.

Para reproduzir o teste sem ID: gerar outro build com `NEXT_PUBLIC_CLARITY_ID=''`, definir `PRIVACY_TEST_NO_ID=1` e executar `pnpm test:privacy:browser`. Remover essa variável para voltar à suíte com ID fictício. O build final deixado localmente foi o **sem ID**.

### Inventário dos arquivos

Criados:

- `lib/privacy/consent.ts`, `lib/analytics/clarity.ts`.
- `components/privacy/consent-provider.tsx`, `components/privacy/privacy-settings.tsx`.
- `app/(store)/layout.tsx`, `app/(store)/privacy-policy/page.tsx`, `app/(checkout)/layout.tsx`, `app/(account)/cart/page.tsx`.
- `tests/privacy.test.cjs`, `tests/fixtures/privacy-api.cjs`, `tests/privacy-browser/consent.spec.ts`, `tests/privacy-browser/no-id.spec.ts`, `playwright.privacy.config.ts`.
- `docs/clarity-privacy.md`.

Movidos, mantendo as URLs:

- `app/layout.tsx` → `components/layout/app-shell.tsx` (também adaptado para consentimento e proteção).
- `app/page.tsx` → `app/(store)/page.tsx`.
- `app/product/[id]/page.tsx` → `app/(store)/product/[id]/page.tsx`.
- `app/search/` → `app/(store)/search/` (página, layout, loading, children-wrapper e categoria).

Modificados:

- `app/(account)/layout.tsx`, `app/[page]/layout.tsx`: raízes isoladas.
- `components/cart/modal.tsx`: entrada no carrinho por documento separado quando houver análise ativa.
- `components/layout/footer.tsx`: links permanentes de privacidade.
- `components/layout/navbar/search.tsx`, `components/product/gallery.tsx`, `components/product/variant-selector.tsx`: isolamento antes de navegação com parâmetros.
- `components/reviews/product-reviews.tsx`: mascaramento explícito.
- `next.config.ts`: política de referenciador.
- `.env.example`, `.gitignore`, `package.json`, `pnpm-lock.yaml`: configuração, exclusão de artefatos locais e dependências/scripts de teste.

Nenhum arquivo de pagamento/Mercado Pago foi alterado nesta demanda. As alterações permanecem na árvore de trabalho da `main`, sem commit, push ou publicação automáticos.

## Fontes oficiais

- [Pacote oficial](https://www.npmjs.com/package/@microsoft/clarity)
- [Consent API V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)
- [Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)
- [Mascaramento](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)
- [Cookies](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-cookies)
- [Retenção](https://learn.microsoft.com/en-us/clarity/data-retention)
- [Gravações e amostras](https://learn.microsoft.com/en-us/clarity/session-recordings/recordings-overview)
- [Next.js 15: layouts raiz e recarga integral](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups)
- [Microsoft: privacidade](https://privacy.microsoft.com/pt-br/privacystatement)
- [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) e [ANPD](https://www.gov.br/anpd/pt-br)
