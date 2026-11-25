import Footer from "components/layout/footer";
import { PrivacySettings } from "components/privacy/privacy-settings";
export const metadata = { title: "Política de Privacidade" };

export default function PrivacyPolicy() {
  const name = process.env.PRIVACY_CONTROLLER_NAME;
  const cnpj = process.env.PRIVACY_CONTROLLER_CNPJ;
  const email = process.env.PRIVACY_CONTACT_EMAIL;
  const pending =
    !name || !cnpj || !email || process.env.CLARITY_PRIVACY_REVIEWED !== "true";
  return (
    <>
      <article className="mx-auto max-w-3xl space-y-6 px-5 py-12 text-sm leading-7">
        <h1 className="text-3xl font-semibold">Política de Privacidade</h1>
        <p>
          PLATUN — informações sobre privacidade na loja e análise opcional de
          navegação. Termo de análise, versão 1.0.0, de 25 de novembro de 2026.
        </p>
        {pending && (
          <p
            role="status"
            className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-amber-950"
          >
            A análise Microsoft Clarity permanece desativada até a conclusão da
            revisão desta política e da identificação e do canal de atendimento
            do controlador.
          </p>
        )}
        <section>
          <h2 className="text-xl font-semibold">Responsável e atendimento</h2>
          <p>
            Controlador:{" "}
            {name || "identificação jurídica pendente de confirmação"}. CNPJ:{" "}
            {cnpj || "pendente de confirmação"}.
          </p>
          <p>
            Canal de privacidade:{" "}
            {email ? (
              <a className="underline" href={`mailto:${email}`}>
                {email}
              </a>
            ) : (
              "pendente de confirmação pelo responsável pela loja antes da ativação da análise"
            )}
            .
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Funcionamento da loja</h2>
          <p>
            Cadastro, conta, carrinho, pedidos e pagamentos utilizam os dados
            necessários às respectivas funcionalidades. O pagamento é processado
            por integração com o Mercado Pago. Esses fluxos não dependem da
            autorização para o Microsoft Clarity.
          </p>
          <p>
            A descrição completa das bases legais, dos fornecedores, dos prazos
            de guarda e dos canais relativos às operações da loja deve ser
            revisada pelo controlador. O site também possui Vercel Analytics,
            integração anterior e independente, cujas condições e necessidade
            devem ser avaliadas nessa revisão.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">
            Microsoft Clarity: finalidade e consentimento
          </h2>
          <p>
            Com sua autorização prévia, utilizamos o Microsoft Clarity para
            compreender a navegação, detectar dificuldades de uso e melhorar a
            experiência de compra por meio de mapas de calor, cliques, rolagens
            e gravações de sessões. A base legal adotada para essa análise
            opcional é o consentimento. Esta integração não tem finalidade
            publicitária, de remarketing ou de personalização de anúncios; a
            autorização de publicidade permanece negada.
          </p>
          <p>
            As informações podem abranger páginas públicas visitadas, interações
            e características técnicas do navegador e do dispositivo. Cookies
            analíticos e tecnologias semelhantes podem ser usados somente após a
            autorização. A identificação técnica da sessão pode constituir dado
            pessoal; não afirmamos que todas as informações sejam anônimas.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">
            Minimização e páginas excluídas
          </h2>
          <p>
            A análise é restrita à página inicial, ao catálogo, às categorias,
            aos produtos públicos e a esta política, sem parâmetros de consulta
            ou fragmentos na URL. Conta autenticada, login, cadastro,
            recuperação de senha, carrinho, checkout, endereços, pedidos,
            pagamentos, administração e rotas não autorizadas ficam excluídos.
          </p>
          <p>
            O conteúdo é mascarado. Não enviamos intencionalmente nome, CPF,
            e-mail, telefone, endereço, senha, tokens, informações privadas de
            pedidos, cartão ou códigos de pagamento, nem associamos a sessão
            analítica ao cadastro do cliente por identificação personalizada.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">
            Microsoft e transferência internacional
          </h2>
          <p>
            As informações autorizadas são processadas pela Microsoft e podem
            ser tratadas fora do Brasil. O controlador deve confirmar as
            condições contratuais, as responsabilidades das partes e o mecanismo
            de transferência internacional aplicável antes de ativar o serviço.
          </p>
          <p>
            Consulte a{" "}
            <a
              className="underline"
              href="https://privacy.microsoft.com/pt-br/privacystatement"
              rel="noreferrer"
            >
              Declaração de Privacidade da Microsoft
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Retenção</h2>
          <p>
            Segundo a documentação consultada em 25/11/2026, os dados de
            reprodução são normalmente retidos por 30 dias; mapas de calor,
            dados de cliques e sessões marcadas ou favoritas podem permanecer
            por 9 meses. A documentação de gravações também descreve a
            preservação de uma amostra por até 9 meses. O responsável deve
            conferir as condições efetivamente aplicáveis ao projeto e
            reavaliá-las quando forem atualizadas.
          </p>
          <p>
            Fontes:{" "}
            <a
              className="underline"
              href="https://learn.microsoft.com/en-us/clarity/data-retention"
              rel="noreferrer"
            >
              retenção de dados
            </a>{" "}
            e{" "}
            <a
              className="underline"
              href="https://learn.microsoft.com/en-us/clarity/session-recordings/recordings-overview"
              rel="noreferrer"
            >
              gravações de sessões
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Sua escolha e revogação</h2>
          <p>
            Aceitar ou recusar a análise não impede compras. A preferência fica
            no armazenamento local do navegador por até 180 dias, com versão do
            termo e datas da decisão e do vencimento. Ela não inclui nome,
            e-mail, CPF ou outros identificadores pessoais adicionais. Uma
            mudança relevante do termo ou o vencimento solicita nova escolha.
            Esse registro local não constitui, isoladamente, uma trilha
            centralizada de comprovação de consentimento.
          </p>
          <p>
            Você pode alterar sua escolha em <PrivacySettings />. A revogação
            impede novas coletas e pode recarregar a página para encerrar o
            script. Ela não elimina automaticamente dados já recebidos pela
            Microsoft. Os cookies acessíveis da ferramenta são removidos;
            cookies de terceiros não podem ser apagados pela loja.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Direitos dos titulares</h2>
          <p>
            Nos termos aplicáveis da LGPD, você pode solicitar confirmação e
            acesso ao tratamento, correção, informações sobre compartilhamento,
            anonimização, bloqueio ou eliminação de dados desnecessários ou
            tratados irregularmente, portabilidade conforme regulamentação,
            eliminação de dados tratados com consentimento, informações sobre a
            possibilidade de recusa e suas consequências, e revogação do
            consentimento. Obrigações legais podem limitar a eliminação de
            determinados registros.
          </p>
          <p>
            Utilize o canal de privacidade indicado acima. Também é possível
            apresentar petição à{" "}
            <a
              className="underline"
              href="https://www.gov.br/anpd/pt-br"
              rel="noreferrer"
            >
              ANPD
            </a>
            . Referência:{" "}
            <a
              className="underline"
              href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"
              rel="noreferrer"
            >
              Lei nº 13.709/2018
            </a>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
