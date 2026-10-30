import { ForgotPasswordForm } from "components/account/password-forms";
export const metadata = {
  title: "Recuperar senha",
  robots: { index: false, follow: false },
};
export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Recuperar senha</h1>
      <ForgotPasswordForm />
    </>
  );
}
