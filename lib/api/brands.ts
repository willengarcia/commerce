import { apiFetch } from "./client";
import type { BrandDTO, BrandViewModel } from "./types";

function adaptBrand(brand: BrandDTO): BrandViewModel {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    active: brand.ativo,
    createdAt: brand.dataCriacao,
    updatedAt: brand.dataAtualizacao,
  };
}

export async function getBrands(): Promise<BrandViewModel[]> {
  const brands = await apiFetch<BrandDTO[]>("/brands");
  return brands
    .filter((brand) => brand.ativo)
    .map(adaptBrand)
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

export async function getBrand(brandId: number): Promise<BrandViewModel> {
  return adaptBrand(await apiFetch<BrandDTO>(`/brands/${brandId}`));
}
