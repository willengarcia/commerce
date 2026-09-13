import { createAddressAction } from "app/(account)/account/addresses/actions";
import { AddressForm } from "components/account/address-form";
import { getCurrentCustomer } from "lib/api/customers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Novo endereço" };

export default async function NewAddressPage() {
  if (!(await getCurrentCustomer())) redirect("/login");
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Novo endereço</h1>
      <AddressForm action={createAddressAction} />
    </>
  );
}
