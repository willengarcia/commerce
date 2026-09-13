import { logoutAction } from "app/(account)/actions";
import { getCurrentCustomer } from "lib/api/customers";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Minha conta</h1>
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-neutral-500">Nome</dt>
          <dd className="font-medium">{customer.nomeCompleto}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">E-mail</dt>
          <dd className="font-medium">{customer.email}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Telefone</dt>
          <dd className="font-medium">{customer.telefone}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Status</dt>
          <dd className="font-medium">{customer.status}</dd>
        </div>
      </dl>
      <Link
        href="/account/addresses"
        className="mt-8 block w-full rounded-full bg-blue-600 p-3 text-center font-medium text-white hover:opacity-90"
      >
        Meus endereços
      </Link>
      <form action={logoutAction} className="mt-8">
        <button className="w-full rounded-full border border-neutral-300 p-3 font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
          Sair
        </button>
      </form>
    </>
  );
}
