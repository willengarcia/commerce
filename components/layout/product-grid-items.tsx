import Price from "components/price";
import RevealProduct from "components/layout/reveal-product";
import type { ProductView } from "components/layout/product-view-switcher";
import type { ProductViewModel } from "lib/api/types";
import Image from "next/image";
import Link from "next/link";

export default function ProductGridItems({
  products,
  view = "grid",
}: {
  products: ProductViewModel[];
  view?: ProductView;
}) {
  return (
    <>
      {products.map((product, index) => {
        const isList = view === "list";
        const isCompact = view === "compact";

        return (
          <RevealProduct
            key={product.id}
            className="min-w-0"
            delay={(index % 4) * 70}
          >
            <Link
              className={
                isList
                  ? "flex min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white transition-colors hover:border-blue-600 dark:border-neutral-800 dark:bg-black"
                  : "block min-w-0 overflow-hidden rounded-lg border border-neutral-200 bg-white transition-colors hover:border-blue-600 dark:border-neutral-800 dark:bg-black"
              }
              href={`/product/${product.id}`}
              prefetch
            >
              <ProductImage
                product={product}
                list={isList}
                compact={isCompact}
              />
              <div
                className={
                  isList
                    ? "flex min-w-0 flex-1 flex-col justify-center p-4"
                    : isCompact
                      ? "min-w-0 p-2.5"
                      : "min-w-0 p-4"
                }
              >
                <h2
                  className={
                    isCompact
                      ? "line-clamp-2 min-h-8 break-words text-xs font-medium leading-4"
                      : "line-clamp-2 break-words text-sm font-medium leading-5"
                  }
                >
                  {product.name}
                </h2>
                {isList && product.shortDescription ? (
                  <p className="mt-2 line-clamp-2 break-words text-sm text-neutral-500 dark:text-neutral-400">
                    {product.shortDescription}
                  </p>
                ) : null}
                <Price
                  amount={product.displayPrice}
                  currencyCode={product.currencyCode}
                  currencyCodeClassName={isCompact ? "hidden sm:inline" : ""}
                  className={
                    isCompact
                      ? "mt-2 whitespace-nowrap text-sm font-semibold text-blue-600"
                      : "mt-3 whitespace-nowrap font-semibold text-blue-600"
                  }
                />
              </div>
            </Link>
          </RevealProduct>
        );
      })}
    </>
  );
}

function ProductImage({
  product,
  list,
  compact,
}: {
  product: ProductViewModel;
  list: boolean;
  compact: boolean;
}) {
  const containerClass = list
    ? "relative aspect-square w-32 shrink-0 overflow-hidden bg-neutral-50 sm:w-44 dark:bg-neutral-950"
    : "relative aspect-square w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950";

  return (
    <div className={containerClass}>
      {product.featuredImage?.url ? (
        <Image
          src={product.featuredImage.url}
          alt={product.name}
          fill
          sizes={
            list
              ? "(min-width: 640px) 176px, 128px"
              : compact
                ? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          className="object-contain transition duration-300 ease-in-out hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Sem imagem
        </span>
      )}
    </div>
  );
}
