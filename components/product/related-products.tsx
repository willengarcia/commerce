import { getProductRecommendations } from "lib/api/product-recommendations";
import { RelatedProductsCarousel } from "./related-products-carousel";

export async function RelatedProducts({
  categoryId,
  brandId,
  currentProductId,
}: {
  categoryId: number | null;
  brandId: number | null;
  currentProductId: number;
}) {
  const products = await getProductRecommendations({
    id: currentProductId,
    categoryId,
    brandId,
  });

  if (products.length === 0) return null;

  return (
    <section
      className="mx-auto mt-10 max-w-(--breakpoint-2xl) px-4"
      aria-labelledby="related-products-title"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Continue explorando
          </p>
          <h2
            id="related-products-title"
            className="text-xl font-semibold md:text-2xl"
          >
            Produtos relacionados
          </h2>
        </div>
      </div>
      <RelatedProductsCarousel key={currentProductId} products={products} />
    </section>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <section className="mx-auto mt-10 max-w-(--breakpoint-2xl) px-4">
      <div className="mb-5 h-8 w-72 max-w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="aspect-square w-[82%] flex-none animate-pulse rounded-lg bg-neutral-200 sm:w-[48%] lg:w-[31%] xl:w-[23%] dark:bg-neutral-800"
          />
        ))}
      </div>
    </section>
  );
}
