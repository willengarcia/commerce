import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { getBrand } from "lib/api/brands";
import { getCategory } from "lib/api/categories";
import { getProducts } from "lib/api/products";
import Link from "next/link";

export const metadata = {
  title: "Busca",
  description: "Busque produtos na loja.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function value(params: SearchParams | undefined, key: string) {
  return typeof params?.[key] === "string" ? params[key] : undefined;
}

function positiveId(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function hrefWith(
  current: URLSearchParams,
  changes: Record<string, string | undefined>,
) {
  const params = new URLSearchParams(current);
  for (const [key, nextValue] of Object.entries(changes)) {
    if (nextValue) params.set(key, nextValue);
    else params.delete(key);
  }
  const query = params.toString();
  return `/search${query ? `?${query}` : ""}`;
}

export default async function SearchPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const searchValue = value(searchParams, "q");
  const categoryId = positiveId(value(searchParams, "categoryId"));
  const brandId = positiveId(value(searchParams, "brandId"));
  const requestedPage = Number(value(searchParams, "page") ?? "1");
  const page = Number.isFinite(requestedPage)
    ? Math.max(0, requestedPage - 1)
    : 0;

  const [result, category, brand] = await Promise.all([
    getProducts({ page, name: searchValue, categoryId, brandId }),
    categoryId ? getCategory(categoryId).catch(() => undefined) : undefined,
    brandId ? getBrand(brandId).catch(() => undefined) : undefined,
  ]);
  const products = result.content;
  const currentParams = new URLSearchParams();
  if (searchValue) currentParams.set("q", searchValue);
  if (categoryId) currentParams.set("categoryId", String(categoryId));
  if (brandId) currentParams.set("brandId", String(brandId));

  const hasFilters = Boolean(searchValue || categoryId || brandId);
  const resultsText = products.length === 1 ? "resultado" : "resultados";

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        {searchValue ? (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Exibindo {products.length} {resultsText} para &quot;{searchValue}
            &quot;
          </p>
        ) : null}
        {hasFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {searchValue ? (
              <FilterChip
                label={`Busca: ${searchValue}`}
                href={hrefWith(currentParams, { q: undefined })}
              />
            ) : null}
            {categoryId ? (
              <FilterChip
                label={`Categoria: ${category?.name ?? `#${categoryId}`}`}
                href={hrefWith(currentParams, { categoryId: undefined })}
              />
            ) : null}
            {brandId ? (
              <FilterChip
                label={`Marca: ${brand?.name ?? `#${brandId}`}`}
                href={hrefWith(currentParams, { brandId: undefined })}
              />
            ) : null}
            <Link
              href="/search"
              className="text-neutral-500 underline hover:text-blue-600"
            >
              Limpar filtros
            </Link>
          </div>
        ) : null}
      </div>

      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <div className="rounded-lg border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="text-lg">Nenhum produto encontrado.</p>
          {hasFilters ? (
            <Link
              href="/search"
              className="mt-3 inline-block text-sm text-blue-600 underline"
            >
              Limpar filtros
            </Link>
          ) : null}
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav className="mt-8 flex justify-center gap-4" aria-label="Paginação">
          {!result.first ? (
            <Link
              href={hrefWith(currentParams, {
                page: String(result.number),
              })}
            >
              Anterior
            </Link>
          ) : null}
          <span>
            Página {result.number + 1} de {result.totalPages}
          </span>
          {!result.last ? (
            <Link
              href={hrefWith(currentParams, {
                page: String(result.number + 2),
              })}
            >
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label={`Remover filtro ${label}`}
      className="rounded-full border border-neutral-300 px-3 py-1 hover:border-blue-600 dark:border-neutral-700"
    >
      {label} <span aria-hidden="true">×</span>
    </Link>
  );
}
