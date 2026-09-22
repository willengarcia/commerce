import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { getProducts } from "lib/api/products";
import Link from "next/link";

export const metadata = {
  title: "Busca",
  description: "Busque produtos na loja.",
};

function pageHref(page: number, searchValue?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (searchValue) params.set("q", searchValue);
  return `/search?${params}`;
}

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const searchValue =
    typeof searchParams?.q === "string" ? searchParams.q : undefined;
  const requestedPage =
    typeof searchParams?.page === "string" ? Number(searchParams.page) : 1;
  const page = Number.isFinite(requestedPage)
    ? Math.max(0, requestedPage - 1)
    : 0;
  const result = await getProducts({ page, name: searchValue });
  const products = result.content;
  const resultsText = products.length === 1 ? "resultado" : "resultados";

  return (
    <>
      {searchValue ? (
        <div className="mb-5">
          <p>
            {products.length === 0
              ? "Nenhum produto corresponde a "
              : `Exibindo ${products.length} ${resultsText} para `}
            <span className="font-bold">&quot;{searchValue}&quot;</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-neutral-300 px-3 py-1 dark:border-neutral-700">
              Busca: {searchValue}
            </span>
            <Link
              href="/search"
              className="text-neutral-500 underline hover:text-blue-600"
            >
              Limpar filtros
            </Link>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="text-lg">Nenhum produto encontrado.</p>
          <Link
            href="/search"
            className="mt-3 inline-block text-sm text-blue-600 underline"
          >
            Limpar filtros
          </Link>
        </div>
      ) : null}
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : null}
      {result.totalPages > 1 ? (
        <nav className="mt-8 flex justify-center gap-4" aria-label="Paginação">
          {!result.first ? (
            <Link href={pageHref(result.number, searchValue)}>Anterior</Link>
          ) : null}
          <span>
            Página {result.number + 1} de {result.totalPages}
          </span>
          {!result.last ? (
            <Link href={pageHref(result.number + 2, searchValue)}>Próxima</Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
