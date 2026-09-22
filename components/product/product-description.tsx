import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import type { ProductViewModel } from "lib/api/types";
import Link from "next/link";
import type { ReactNode } from "react";

function ProductSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-neutral-200 dark:border-neutral-700">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-xl font-normal">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="pb-5 text-sm text-neutral-600 dark:text-neutral-400">
        {children}
      </div>
    </details>
  );
}

const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 6,
});

function measurement(value: number | null | undefined): string | undefined {
  return value != null && Number.isFinite(value)
    ? numberFormat.format(value)
    : undefined;
}

export function ProductDescription({ product }: { product: ProductViewModel }) {
  const brand = product.brandName?.trim();
  const category = product.categoryName?.trim();
  const description = product.description.trim();
  const shortDescription = product.shortDescription.trim();
  const hasPromotion = product.promotionalPrice != null;
  const weight = measurement(product.weight);
  const dimensions = [
    { label: "C", value: measurement(product.length) },
    { label: "L", value: measurement(product.width) },
    { label: "A", value: measurement(product.height) },
  ].filter((dimension) => dimension.value !== undefined);
  const specifications = [
    { label: "SKU", value: product.sku?.trim() },
    { label: "Marca", value: brand },
    { label: "Categoria", value: category },
    { label: "Peso", value: weight !== undefined ? `${weight} kg` : undefined },
    {
      label: "Dimensões",
      value: dimensions.length
        ? `${dimensions.map(({ value }) => value).join(" × ")} cm (${dimensions.map(({ label }) => label).join(" × ")})`
        : undefined,
    },
  ].filter((specification) => Boolean(specification.value));

  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <div className="mb-6 flex flex-col border-b border-neutral-200 pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-3xl font-medium sm:text-4xl lg:text-5xl">
          {product.name}
        </h1>
        {brand || category ? (
          <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
            {brand ? (
              product.brandId != null ? (
                <Link
                  href={`/search?brandId=${product.brandId}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  {brand}
                </Link>
              ) : (
                <span>{brand}</span>
              )
            ) : null}
            {brand && category ? <span aria-hidden="true">•</span> : null}
            {category ? (
              product.categoryId != null ? (
                <Link
                  href={`/search?categoryId=${product.categoryId}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  {category}
                </Link>
              ) : (
                <span>{category}</span>
              )
            ) : null}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {hasPromotion ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              <span className="sr-only">Preço anterior:</span>
              <Price
                amount={product.price}
                currencyCode={product.currencyCode}
                className="line-through"
              />
            </div>
          ) : null}
          <div className="w-fit rounded-full bg-blue-600 px-3 py-2 text-lg font-medium text-white">
            <span className="sr-only">
              {hasPromotion ? "Preço promocional:" : "Preço:"}
            </span>
            <Price
              amount={product.displayPrice}
              currencyCode={product.currencyCode}
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          {product.availableForSale === true ? (
            <>
              <span aria-hidden="true" className="mr-1">
                ✓
              </span>{" "}
              Em estoque
            </>
          ) : (
            "Produto indisponível"
          )}
        </p>
      </div>
      {shortDescription ? (
        <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {shortDescription}
        </p>
      ) : null}
      <AddToCart product={product} />
      {description || specifications.length ? (
        <div className="mt-8 border-t border-neutral-200 dark:border-neutral-700">
          {description ? (
            <ProductSection title="Descrição">
              <Prose
                className="text-sm leading-relaxed whitespace-pre-line dark:text-white/[60%] [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto"
                html={description}
              />
            </ProductSection>
          ) : null}
          {specifications.length ? (
            <ProductSection title="Especificações">
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3">
                {specifications.map(({ label, value }) => (
                  <div key={label} className="contents">
                    <dt>{label}</dt>
                    <dd className="min-w-0 text-neutral-900 dark:text-neutral-100">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </ProductSection>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
