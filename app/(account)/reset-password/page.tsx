import { ResetPasswordForm } from "components/account/password-forms";
export const metadata = {
  title: "Redefinir senha",
  referrer: "no-referrer" as const,
  robots: { index: false, follow: false },
};
export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Redefinir senha</h1>
      <ResetPasswordForm />
    </>
  );
}
