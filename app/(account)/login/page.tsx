import { LoginForm } from "components/account/login-form";
import { getCurrentCustomer } from "lib/api/customers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage(props: {
  searchParams?: Promise<{ registered?: string }>;
}) {
  if (await getCurrentCustomer()) redirect("/account");
  const searchParams = await props.searchParams;
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
      <LoginForm registered={searchParams?.registered === "1"} />
    </>
  );
}
