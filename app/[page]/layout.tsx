import Footer from "components/layout/footer";
import AppShell, { metadata as appMetadata } from "components/layout/app-shell";
export const metadata = appMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="w-full">
        <div className="mx-8 max-w-2xl py-20 sm:mx-auto">{children}</div>
      </div>
      <Footer />
    </AppShell>
  );
}
