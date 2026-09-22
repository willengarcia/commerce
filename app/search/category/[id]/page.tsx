import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { getCategory } from "lib/api/categories";
import { getProducts } from "lib/api/products";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return id;
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const category = await getCategory(parseId(id));
  if (!category) return notFound();
  return { title: category.name, description: category.description };
}

export default async function CategoryPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const [{ id }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const categoryId = parseId(id);
  const category = await getCategory(categoryId);
  if (!category) notFound();
  const requestedPage = Number(searchParams?.page ?? "1");
  const page = Number.isFinite(requestedPage)
    ? Math.max(0, requestedPage - 1)
    : 0;
  const result = await getProducts({ categoryId, page });

  return (
    <section>
      <h1 className="text-2xl font-semibold">Produtos</h1>
      <div className="mb-5 mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-neutral-300 px-3 py-1 dark:border-neutral-700">
          Categoria: {category.name}
        </span>
        <Link
          href="/search"
          className="text-neutral-500 underline hover:text-blue-600"
        >
          Limpar filtros
        </Link>
      </div>
      {result.content.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="text-lg">Nenhum produto encontrado.</p>
          <Link
            href="/search"
            className="mt-3 inline-block text-sm text-blue-600 underline"
          >
            Limpar filtros
          </Link>
        </div>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={result.content} />
        </Grid>
      )}
      {result.totalPages > 1 ? (
        <nav className="mt-8 flex justify-center gap-4" aria-label="Paginação">
          {!result.first ? (
            <Link href={`${category.path}?page=${result.number}`}>
              Anterior
            </Link>
          ) : null}
          <span>
            Página {result.number + 1} de {result.totalPages}
          </span>
          {!result.last ? (
            <Link href={`${category.path}?page=${result.number + 2}`}>
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
