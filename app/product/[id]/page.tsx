import Footer from "components/layout/footer";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import {
  RelatedProducts,
  RelatedProductsSkeleton,
} from "components/product/related-products";
import { ApiError } from "lib/api/errors";
import { getCategories, getCategoryTrail } from "lib/api/categories";
import { getProduct } from "lib/api/products";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return id;
}

async function getProductOrNotFound(id: string) {
  try {
    return await getProduct(parseId(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProductOrNotFound(id);
  const image = product.featuredImage;

  return {
    title: product.name,
    description: product.shortDescription || product.description,
    openGraph: image
      ? { images: [{ url: image.url, alt: image.altText }] }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const product = await getProductOrNotFound(id);
  const categories = product.categoryId
    ? await getCategories().catch(() => [])
    : [];
  const categoryTrail = product.categoryId
    ? getCategoryTrail(categories, product.categoryId)
    : [];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.featuredImage ? { image: product.featuredImage.url } : {}),
    offers: {
      "@type": "Offer",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.currencyCode,
      price: product.displayPrice,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
        {categoryTrail.length ? (
          <nav
            aria-label="Navegação estrutural"
            className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
          >
            <Link href="/" className="hover:text-blue-600 hover:underline">
              Início
            </Link>
            {categoryTrail.map((category) => (
              <span key={category.id} className="flex items-center gap-2">
                <span aria-hidden="true">›</span>
                <Link
                  href={category.path}
                  className="hover:text-blue-600 hover:underline"
                >
                  {category.name}
                </Link>
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-col gap-8 rounded-lg border border-neutral-200 bg-white p-4 sm:p-8 md:p-12 lg:flex-row dark:border-neutral-800 dark:bg-black">
          <div className="h-full min-w-0 w-full basis-full lg:basis-4/6">
            {product.images.length > 0 ? (
              <Suspense
                fallback={
                  <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
                }
              >
                <Gallery
                  images={product.images.slice(0, 5).map((image) => ({
                    src: image.url,
                    altText: image.altText,
                  }))}
                />
              </Suspense>
            ) : (
              <div className="flex aspect-square max-h-[550px] items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                Produto sem imagem cadastrada
              </div>
            )}
          </div>
          <div className="min-w-0 basis-full lg:basis-2/6">
            <ProductDescription product={product} />
          </div>
        </div>
      </div>
      {product.categoryId != null || product.brandId != null ? (
        <Suspense key={product.id} fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts
            categoryId={product.categoryId}
            brandId={product.brandId}
            currentProductId={product.id}
          />
        </Suspense>
      ) : null}
      <Footer />
    </>
  );
}
