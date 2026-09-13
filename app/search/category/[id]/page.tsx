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
      <h1 className="mb-4 text-2xl font-semibold">{category.name}</h1>
      {result.content.length === 0 ? (
        <p className="py-3 text-lg">Nenhum produto nesta categoria.</p>
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
