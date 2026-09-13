"use server";

import {
  createAddress,
  type AddressRequestDTO,
  type AddressType,
  updateAddress,
} from "lib/api/addresses";
import { ApiError } from "lib/api/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AddressFormState = { error?: string };

function value(formData: FormData, name: string): string {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

function addressFrom(formData: FormData): AddressRequestDTO {
  return {
    nomeEndereco: value(formData, "nomeEndereco"),
    nomeDestinatario: value(formData, "nomeDestinatario"),
    cep: value(formData, "cep"),
    rua: value(formData, "rua"),
    numero: value(formData, "numero"),
    cidade: value(formData, "cidade"),
    bairro: value(formData, "bairro"),
    estado: value(formData, "estado").toUpperCase(),
    complemento: value(formData, "complemento"),
    referencia: value(formData, "referencia"),
    tipoEndereco: value(formData, "tipoEndereco") as AddressType,
    enderecoPrincipal: formData.get("enderecoPrincipal") === "on",
  };
}

function validate(address: AddressRequestDTO): string | undefined {
  const required = [
    address.nomeEndereco,
    address.nomeDestinatario,
    address.cep,
    address.rua,
    address.numero,
    address.cidade,
    address.bairro,
    address.estado,
    address.tipoEndereco,
  ];
  if (required.some((field) => !field))
    return "Preencha os campos obrigatórios.";
}

function message(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível salvar o endereço. Tente novamente.";
}

export async function createAddressAction(
  _state: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const address = addressFrom(formData);
  const validationError = validate(address);
  if (validationError) return { error: validationError };
  try {
    await createAddress(address);
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function updateAddressAction(
  id: number,
  _state: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const address = addressFrom(formData);
  const validationError = validate(address);
  if (validationError) return { error: validationError };
  try {
    await updateAddress(id, address);
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}
