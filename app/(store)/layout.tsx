import AppShell, { metadata as appMetadata } from "components/layout/app-shell";
export const metadata = appMetadata;
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell publicStore>{children}</AppShell>;
}
