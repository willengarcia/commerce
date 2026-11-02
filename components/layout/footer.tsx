import {
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import LogoSquare from "components/logo-square";
import Link from "next/link";

const {
  COMPANY_NAME,
  SITE_NAME,
  FOOTER_DESCRIPTION,
  FOOTER_PAYMENT_TITLE,
  FOOTER_PAYMENT_DESCRIPTION,
  FOOTER_PAYMENT_PROVIDER,
  FOOTER_PAYMENT_METHODS,
  FOOTER_CONTACT_TITLE,
  CONTACT_PHONE,
  CONTACT_WHATSAPP,
  CONTACT_EMAIL,
  CONTACT_ADDRESS,
  CONTACT_HOURS,
  FOOTER_COPYRIGHT_TEXT,
} = process.env;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const brandName = COMPANY_NAME || SITE_NAME || "Platun";
  const paymentMethods = (FOOTER_PAYMENT_METHODS || "PIX,Cartão de crédito")
    .split(",")
    .map((method) => method.trim())
    .filter(Boolean);
  const phoneHref = CONTACT_PHONE
    ? `tel:+${digitsOnly(CONTACT_PHONE)}`
    : undefined;
  const whatsappHref = CONTACT_WHATSAPP
    ? `https://wa.me/${digitsOnly(CONTACT_WHATSAPP)}`
    : undefined;

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-sm text-neutral-300">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-3 md:px-4 min-[1320px]:px-0">
        <section aria-labelledby="footer-brand-title">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <LogoSquare size="sm" />
            <span
              id="footer-brand-title"
              className="text-base font-semibold uppercase tracking-wider"
            >
              {SITE_NAME || brandName}
            </span>
          </Link>
          <p className="mt-4 max-w-sm leading-6 text-neutral-400">
            {FOOTER_DESCRIPTION ||
              "Compra segura, atendimento próximo e uma experiência simples do pedido ao pagamento."}
          </p>
        </section>

        <section aria-labelledby="footer-payment-title">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
            <h2 id="footer-payment-title" className="font-semibold">
              {FOOTER_PAYMENT_TITLE || "Pagamento seguro"}
            </h2>
          </div>
          <p className="mt-4 leading-6 text-neutral-400">
            {FOOTER_PAYMENT_DESCRIPTION ||
              "Pagamento integrado ao Mercado Pago, com processamento seguro via PIX e cartão de crédito."}
          </p>
          {FOOTER_PAYMENT_PROVIDER ? (
            <p className="mt-3 text-xs uppercase tracking-wider text-neutral-500">
              Integração: {FOOTER_PAYMENT_PROVIDER}
            </p>
          ) : null}
          <ul
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Meios de pagamento"
          >
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200"
              >
                {method}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title" className="font-semibold text-white">
            {FOOTER_CONTACT_TITLE || "Entre em contato"}
          </h2>
          <ul className="mt-4 space-y-3 text-neutral-400">
            {CONTACT_PHONE ? (
              <li className="flex items-start gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a className="hover:text-white" href={phoneHref}>
                  {CONTACT_PHONE}
                </a>
              </li>
            ) : null}
            {CONTACT_WHATSAPP ? (
              <li className="flex items-start gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  className="hover:text-white"
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp: {CONTACT_WHATSAPP}
                </a>
              </li>
            ) : null}
            {CONTACT_EMAIL ? (
              <li className="flex items-start gap-3">
                <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  className="break-all hover:text-white"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            ) : null}
            {CONTACT_ADDRESS ? (
              <li className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CONTACT_ADDRESS}</span>
              </li>
            ) : null}
            {CONTACT_HOURS ? (
              <li className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CONTACT_HOURS}</span>
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="border-t border-neutral-800 py-5 text-xs text-neutral-500">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-4 min-[1320px]:px-0">
          &copy; {currentYear} {brandName}.{" "}
          {FOOTER_COPYRIGHT_TEXT || "Todos os direitos reservados."}
        </div>
      </div>
    </footer>
  );
}
