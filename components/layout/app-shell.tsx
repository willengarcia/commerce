import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import WhatsAppButton from "components/whatsapp-button";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import { getCurrentCartResolution } from "lib/api/cart";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "app/globals.css";
import { baseUrl } from "lib/utils";
import { getSessionToken } from "lib/api/auth";
import { ConsentProvider } from "components/privacy/consent-provider";
import { PrivacySettings } from "components/privacy/privacy-settings";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
  publicStore = false,
}: {
  children: ReactNode;
  publicStore?: boolean;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCurrentCartResolution();
  const authenticated = Boolean(await getSessionToken());
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLARITY_ID &&
      process.env.CLARITY_PRIVACY_REVIEWED === "true" &&
      process.env.PRIVACY_CONTROLLER_NAME &&
      process.env.PRIVACY_CONTROLLER_CNPJ &&
      process.env.PRIVACY_CONTACT_EMAIL,
  );

  return (
    <html lang="pt-BR" className={GeistSans.variable}>
      <body
        data-clarity-mask="true"
        className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white"
      >
        <CartProvider cartPromise={cart}>
          <Navbar />
          <main>
            {children}
            <Toaster closeButton />
          </main>
        </CartProvider>
        <WhatsAppButton />
        <Analytics />
        {!publicStore && (
          <footer className="border-t border-neutral-300 p-6 text-center text-sm">
            <PrivacySettings /> ·{" "}
            <a href="/privacy-policy" className="underline">
              Política de Privacidade
            </a>
          </footer>
        )}
        <ConsentProvider
          analyticsAllowed={publicStore && !authenticated}
          configured={configured}
        />
      </body>
    </html>
  );
}
