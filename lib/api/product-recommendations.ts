import { getProducts } from "./products";
import type { ProductViewModel } from "./types";

type RecommendationProduct = Pick<
  ProductViewModel,
  "id" | "categoryId" | "brandId"
>;

type RecommendationFilter = { categoryId?: number; brandId?: number };

async function getRelatedCollection(
  filter: RecommendationFilter,
): Promise<ProductViewModel[]> {
  const firstPage = await getProducts({ ...filter, page: 0, size: 24 }).catch(
    () => null,
  );
  if (!firstPage) return [];

  const products = [...firstPage.content];
  for (let page = 1; page < firstPage.totalPages; page++) {
    const result = await getProducts({
      ...filter,
      page,
      size: firstPage.size,
    }).catch(() => null);
    // Keep successful pages if one optional recommendation request fails.
    if (result) products.push(...result.content);
  }
  return products;
}

export async function getProductRecommendations({
  id,
  categoryId,
  brandId,
}: RecommendationProduct): Promise<ProductViewModel[]> {
  // Full category and brand collections already include their intersection.
  const queries: RecommendationFilter[] = [];
  if (categoryId != null) queries.push({ categoryId });
  if (brandId != null) queries.push({ brandId });

  const collections = await Promise.all(queries.map(getRelatedCollection));
  const recommendations = new Map<number, ProductViewModel>();
  for (const products of collections) {
    for (const product of products) {
      if (product.id !== id && !recommendations.has(product.id)) {
        recommendations.set(product.id, product);
      }
    }
  }

  function priority(product: ProductViewModel): number {
    const sameCategory =
      categoryId != null && product.categoryId === categoryId;
    const sameBrand = brandId != null && product.brandId === brandId;
    return sameCategory ? (sameBrand ? 0 : 1) : 2;
  }

  return [...recommendations.values()].sort(
    (left, right) => priority(left) - priority(right),
  );
}
