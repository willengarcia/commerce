import Footer from "components/layout/footer";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { ApiError } from "lib/api/errors";
import { getProduct } from "lib/api/products";
import type { Metadata } from "next";
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
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
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
          <div className="basis-full lg:basis-2/6">
            <ProductDescription product={product} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
