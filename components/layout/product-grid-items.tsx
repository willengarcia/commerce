import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import type { ProductViewModel } from "lib/api/types";
import Link from "next/link";

export default function ProductGridItems({
  products,
}: {
  products: ProductViewModel[];
}) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.id} className="animate-fadeIn">
          <Link
            className="relative inline-block h-full w-full"
            href={`/product/${product.id}`}
            prefetch={true}
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
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Link>
        </Grid.Item>
      ))}
    </>
  );
}
