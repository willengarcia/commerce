import AppShell, { metadata as appMetadata } from "components/layout/app-shell";
export const metadata = appMetadata;
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
