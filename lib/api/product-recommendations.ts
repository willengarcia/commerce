import { getProducts } from "./products";
import type { ProductViewModel } from "./types";

const RECOMMENDATION_LIMIT = 6;

type RecommendationProduct = Pick<
  ProductViewModel,
  "id" | "categoryId" | "brandId"
>;

export async function getProductRecommendations({
  id,
  categoryId,
  brandId,
}: RecommendationProduct): Promise<ProductViewModel[]> {
  const queries: { categoryId?: number; brandId?: number }[] = [];
  if (categoryId != null && brandId != null) {
    queries.push({ categoryId, brandId });
  }
  if (categoryId != null) queries.push({ categoryId });
  if (brandId != null) queries.push({ brandId });

  const recommendations = new Map<number, ProductViewModel>();

  for (const query of queries) {
    if (recommendations.size >= RECOMMENDATION_LIMIT) break;

    // One extra item allows the current product to be excluded without paging.
    const page = await getProducts({
      ...query,
      page: 0,
      size: RECOMMENDATION_LIMIT + 1,
    }).catch(() => null);

    // Recommendations are optional: keep successful sources if another fails.
    for (const product of page?.content ?? []) {
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

  return [...recommendations.values()]
    .sort((left, right) => priority(left) - priority(right))
    .slice(0, RECOMMENDATION_LIMIT);
}
