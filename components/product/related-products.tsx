import { getProductsByCategory } from "lib/api/products";
import { RelatedProductsCarousel } from "./related-products-carousel";

export async function RelatedProducts({
  categoryId,
  currentProductId,
}: {
  categoryId: number;
  currentProductId: number;
}) {
  const products = await getProductsByCategory(categoryId);

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
            Produtos da mesma categoria
          </h2>
        </div>
      </div>
      <RelatedProductsCarousel
        products={products}
        currentProductId={currentProductId}
      />
    </section>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <section className="mx-auto mt-10 max-w-(--breakpoint-2xl) px-4">
      <div className="mb-5 h-8 w-72 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
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
