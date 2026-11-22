import { PlusIcon } from "@heroicons/react/24/outline";
import { getProducts } from "lib/api/products";
import Link from "next/link";
import { GridTileImage } from "./grid/tile";

export async function Carousel() {
  const { content: products, totalElements } = await getProducts({ size: 10 });

  if (!products?.length) return null;

  const remainingProducts = Math.max(0, totalElements - products.length);

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex gap-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
          >
            <Link
              href={`/product/${product.id}`}
              className="relative h-full w-full"
            >
              <GridTileImage
                alt={product.name}
                label={{
                  title: product.name,
                  amount: product.displayPrice,
                  currencyCode: product.currencyCode,
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            </Link>
          </li>
        ))}
        {remainingProducts > 0 ? (
          <li className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3">
            <Link
              href="/search"
              aria-label={`Ver mais ${remainingProducts} produtos`}
              className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 text-center transition-colors hover:border-blue-600 hover:text-blue-600 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-current">
                <PlusIcon className="h-7 w-7" />
              </span>
              <span className="font-medium">Ver mais produtos</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                +{remainingProducts} disponíveis
              </span>
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
