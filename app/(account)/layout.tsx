import AppShell, { metadata as appMetadata } from "components/layout/app-shell";
export const metadata = appMetadata;

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
