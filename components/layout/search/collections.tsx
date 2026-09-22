import clsx from "clsx";
import { Suspense } from "react";

import { buildCategoryTree, getCategories } from "lib/api/categories";
import type { CategoryTreeNode } from "lib/api/types";
import FilterList from "./filter";

async function CollectionList() {
  let categories;
  try {
    categories = buildCategoryTree(await getCategories());
  } catch {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        <p className="mb-2 font-medium">Categorias</p>
        <p>Não foi possível carregá-las.</p>
      </div>
    );
  }
  const flatten = (
    nodes: CategoryTreeNode[],
    depth = 0,
  ): { title: string; path: string }[] =>
    nodes.flatMap((category) => [
      { title: `${"— ".repeat(depth)}${category.name}`, path: category.path },
      ...flatten(category.children, depth + 1),
    ]);
  const items = [{ title: "Todos", path: "/search" }, ...flatten(categories)];
  return <FilterList list={items} title="Categorias" />;
}

const skeleton = "mb-3 h-4 w-5/6 animate-pulse rounded-sm";
const activeAndTitles = "bg-neutral-800 dark:bg-neutral-300";
const items = "bg-neutral-400 dark:bg-neutral-700";

export default function Collections() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CollectionList />
    </Suspense>
  );
}
