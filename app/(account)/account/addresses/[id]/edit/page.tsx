import { updateAddressAction } from "app/(account)/account/addresses/actions";
import { AddressForm } from "components/account/address-form";
import { getAddress } from "lib/api/addresses";
import { getCurrentCustomer } from "lib/api/customers";
import { ApiError } from "lib/api/errors";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Editar endereço" };

export default async function EditAddressPage(props: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentCustomer())) redirect("/login");
  const id = Number((await props.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  let address;
  try {
    address = await getAddress(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const action = updateAddressAction.bind(null, id);
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar endereço</h1>
      <AddressForm action={action} address={address} />
    </>
  );
}
