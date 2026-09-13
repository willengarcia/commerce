import { getCategories } from "lib/api/categories";
import { getAllProducts } from "lib/api/products";
import { getPages } from "lib/shopify";
import { baseUrl } from "lib/utils";
import type { MetadataRoute } from "next";

type Route = { url: string; lastModified?: string };

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: Route[] = [
    { url: baseUrl, lastModified: new Date().toISOString() },
  ];
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  routes.push(
    ...categories.map((category) => ({
      url: `${baseUrl}${category.path}`,
      lastModified: category.updatedAt,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
    })),
  );

  // Pages/CMS remain on Shopify until their own integration stage.
  if (
    process.env.SHOPIFY_STORE_DOMAIN &&
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  ) {
    const pages = await getPages();
    routes.push(
      ...pages.map((page) => ({
        url: `${baseUrl}/${page.handle}`,
        lastModified: page.updatedAt,
      })),
    );
  }

  return routes;
}
