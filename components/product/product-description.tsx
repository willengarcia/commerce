import Price from "components/price";
import Prose from "components/prose";
import type { ProductViewModel } from "lib/api/types";

export function ProductDescription({ product }: { product: ProductViewModel }) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.name}</h1>
        {product.brandName ? (
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {product.brandName}
          </p>
        ) : null}
        <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
          <Price
            amount={product.displayPrice}
            currencyCode={product.currencyCode}
          />
        </div>
      </div>
      {product.description ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.description}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
import { AddToCart } from "components/cart/add-to-cart";
