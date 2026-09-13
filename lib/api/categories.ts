import { apiFetch } from "./client";
import type { CategoryDTO, CategoryViewModel } from "./types";

function adaptCategory(category: CategoryDTO): CategoryViewModel {
  return {
    id: category.categoryId,
    name: category.name,
    description: category.description,
    active: category.ativo,
    path: `/search/category/${category.categoryId}`,
    updatedAt: category.dataAtualizacao,
  };
}

export async function getCategories(name = ""): Promise<CategoryViewModel[]> {
  const params = new URLSearchParams({ name });
  const categories = await apiFetch<CategoryDTO[]>(`/categories?${params}`);
  return categories.filter((category) => category.ativo).map(adaptCategory);
}

export async function getCategory(
  categoryId: number,
): Promise<CategoryViewModel | undefined> {
  const categories = await getCategories();
  return categories.find((category) => category.id === categoryId);
}
