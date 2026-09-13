import { getAddresses } from "lib/api/addresses";
import { getCurrentCustomer } from "lib/api/customers";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Meus endereços" };

export default async function AddressesPage() {
  if (!(await getCurrentCustomer())) redirect("/login");
  const addresses = await getAddresses();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            href="/account"
            className="text-sm text-neutral-500 hover:underline"
          >
            Minha conta
          </Link>
          <h1 className="text-2xl font-semibold">Meus endereços</h1>
        </div>
        <Link
          href="/account/addresses/new"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Novo endereço
        </Link>
      </div>
      {addresses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          Nenhum endereço cadastrado.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{address.nomeEndereco}</h2>
                {address.enderecoPrincipal ? (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    Principal
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm">{address.nomeDestinatario}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {address.rua}, {address.numero}
                {address.complemento ? ` — ${address.complemento}` : ""}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {address.bairro}, {address.cidade}/{address.estado}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                CEP {address.cep}
              </p>
              <Link
                href={`/account/addresses/${address.id}/edit`}
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
