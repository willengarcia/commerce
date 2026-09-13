import { RegisterForm } from "components/account/register-form";
import { getCurrentCustomer } from "lib/api/customers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  if (await getCurrentCustomer()) redirect("/account");
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>
      <RegisterForm />
    </>
  );
}
