"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  CONSENT_KEY,
  PRIVACY_EVENT,
  makeConsent,
  readConsent,
  saveConsent,
  type Consent,
} from "lib/privacy/consent";
import {
  clarityDocumentActive,
  revokeClarity,
  startClarity,
} from "lib/analytics/clarity";

const button =
  "rounded-full border border-slate-400 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";

export function ConsentProvider({
  analyticsAllowed,
  configured,
}: {
  analyticsAllowed: boolean;
  configured: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => {
      const value = readConsent();
      setConsent(value);
      setLoaded(true);
      if (!value?.analytics) {
        if (clarityDocumentActive()) revokeClarity(true);
      } else if (analyticsAllowed && configured) {
        void startClarity(process.env.NEXT_PUBLIC_CLARITY_ID ?? "", true);
      }
    };
    const settings = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setOpen(true);
    };
    const storage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY || e.key === null) {
        setDismissed(false);
        sync();
      }
    };
    sync();
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", sync);
    window.addEventListener(PRIVACY_EVENT, settings);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", sync);
      window.removeEventListener(PRIVACY_EVENT, settings);
    };
  }, [analyticsAllowed, configured]);

  useEffect(() => {
    if (!consent?.analytics) return;
    let timer: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      const remaining = Date.parse(consent.expiresAt) - Date.now();
      if (remaining <= 0) {
        setConsent(null);
        setDismissed(false);
        if (clarityDocumentActive()) revokeClarity(true);
      } else timer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    };
    checkExpiry();
    return () => clearTimeout(timer);
  }, [consent?.expiresAt, consent?.analytics]);

  function decide(enabled: boolean) {
    const value = makeConsent(enabled);
    const persisted = saveConsent(value);
    setConsent(value);
    setDismissed(true);
    setOpen(false);
    setNotice(
      persisted
        ? "Preferência de privacidade salva."
        : "Não foi possível salvar sua preferência neste navegador. A análise permanece desativada.",
    );
    if (!enabled || !persisted) revokeClarity(persisted);
    else if (analyticsAllowed && configured)
      void startClarity(process.env.NEXT_PUBLIC_CLARITY_ID ?? "", true);
  }

  return (
    <>
      <span className="sr-only" role="status">
        {notice}
      </span>
      <Dialog
        open={loaded && !consent && !dismissed && configured && !open}
        onClose={() => decide(false)}
        className="fixed inset-0 z-[100]"
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
          <DialogPanel
            data-testid="consent-popup"
            data-clarity-mask="true"
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-500 bg-[#080F1F] p-5 text-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-8"
          >
            <button
              type="button"
              aria-label="Fechar e recusar análise"
              onClick={() => decide(false)}
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-200 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:right-3 sm:top-3"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <DialogTitle
              id="privacy-banner-title"
              className="pr-10 text-lg font-semibold sm:text-xl"
            >
              Sua privacidade é importante para nós
            </DialogTitle>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
              <p>
                Utilizamos o Microsoft Clarity, uma ferramenta de análise de
                navegação da Microsoft, para compreender como os visitantes
                interagem com nossa loja e melhorar sua experiência de compra.
              </p>
              <p>
                Com sua autorização, poderemos coletar informações sobre
                cliques, rolagens, páginas visitadas, características do
                dispositivo e interações com o site, incluindo a geração de
                mapas de calor e gravações de sessões.
              </p>
              <p>
                Essas informações possuem finalidade analítica e poderão ser
                processadas pela Microsoft, inclusive fora do Brasil, conforme
                as condições aplicáveis ao serviço.
              </p>
              <p>
                Você pode aceitar ou recusar esse monitoramento sem qualquer
                prejuízo à utilização da loja ou à realização de compras. Sua
                preferência poderá ser alterada a qualquer momento.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button className={button} onClick={() => decide(false)}>
                Recusar opcionais
              </button>
              <button className={button} onClick={() => decide(true)}>
                Aceitar análise
              </button>
              <button
                className={`${button} sm:col-span-2`}
                onClick={() => {
                  setAnalytics(false);
                  setOpen(true);
                }}
              >
                Gerenciar preferências
              </button>
            </div>
            <a
              href="/privacy-policy"
              className="mt-4 inline-block text-sm text-cyan-200 underline"
            >
              Política de Privacidade
            </a>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-[100]"
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <DialogPanel
            data-clarity-mask="true"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-500 bg-[#080F1F] p-6 text-white shadow-xl"
          >
            <DialogTitle className="text-xl font-semibold">
              Preferências de privacidade
            </DialogTitle>
            <p className="mt-3 text-sm text-slate-200">
              Você decide sobre a análise opcional. Sua escolha não interfere
              nas compras.
            </p>
            <section className="mt-5 rounded-lg border border-slate-600 p-4">
              <h3 className="font-semibold">Recursos essenciais</h3>
              <p className="mt-2 text-sm text-slate-200">
                Funcionamento da loja, segurança, carrinho e demais
                funcionalidades indispensáveis.
              </p>
              <p className="mt-2 text-sm">
                Sempre ativos, quando efetivamente necessários.
              </p>
            </section>
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-600 p-4">
              <input
                type="checkbox"
                checked={analytics}
                disabled={!configured}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 h-5 w-5 accent-cyan-300"
              />
              <span>
                <span className="font-semibold">Microsoft Clarity</span>
                <span className="mt-2 block text-sm text-slate-200">
                  Mapas de calor e gravações de sessões, exclusivamente para
                  análise de navegação. Publicidade permanece desativada.
                </span>
              </span>
            </label>
            {!configured && (
              <p className="mt-3 text-sm text-slate-200">
                A análise de navegação está indisponível no momento.
              </p>
            )}
            <p className="mt-4 text-sm text-slate-200">
              Revogar interrompe novas coletas; não exclui automaticamente
              informações já coletadas pela Microsoft.
            </p>
            <a
              href="/privacy-policy"
              className="mt-3 inline-block text-sm text-cyan-200 underline"
            >
              Política de Privacidade
            </a>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={button}
                onClick={() => decide(analytics && configured)}
              >
                Salvar preferências
              </button>
              <button className={button} onClick={() => decide(false)}>
                Recusar opcionais
              </button>
              <button className={button} onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
