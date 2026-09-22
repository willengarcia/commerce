import { apiFetch } from "./client";
import type { CategoryDTO, CategoryTreeNode, CategoryViewModel } from "./types";

function adaptCategory(category: CategoryDTO): CategoryViewModel {
  return {
    id: category.categoryId,
    name: category.name,
    description: category.description,
    active: category.ativo,
    path: `/search/category/${category.categoryId}`,
    updatedAt: category.dataAtualizacao,
    parentCategoryId: category.parentCategoryId ?? null,
  };
}

export function buildCategoryTree(
  categories: CategoryViewModel[],
): CategoryTreeNode[] {
  const nodes = new Map<number, CategoryTreeNode>(
    categories.map((category) => [category.id, { ...category, children: [] }]),
  );
  const roots: CategoryTreeNode[] = [];

  for (const node of nodes.values()) {
    const parent =
      node.parentCategoryId == null
        ? undefined
        : nodes.get(node.parentCategoryId);
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  const sort = (items: CategoryTreeNode[]) => {
    items.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

export function getCategoryTrail(
  categories: CategoryViewModel[],
  categoryId: number,
): CategoryViewModel[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: CategoryViewModel[] = [];
  const visited = new Set<number>();
  let current = byId.get(categoryId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    trail.unshift(current);
    current =
      current.parentCategoryId == null
        ? undefined
        : byId.get(current.parentCategoryId);
  }

  return trail;
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
