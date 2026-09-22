"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { BrandViewModel, CategoryTreeNode } from "lib/api/types";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type CatalogNavigationProps = {
  categories: CategoryTreeNode[];
  brands: BrandViewModel[];
  categoriesError?: boolean;
  brandsError?: boolean;
};

function CategoryItems({
  nodes,
  hrefFor,
}: {
  nodes: CategoryTreeNode[];
  hrefFor: (category: CategoryTreeNode) => string;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            href={hrefFor(node)}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            {node.children.length ? (
              <ChevronRightIcon className="h-3.5 w-3.5 text-neutral-400" />
            ) : (
              <span className="w-3.5" />
            )}
            {node.name}
          </Link>
          {node.children.length ? (
            <div className="ml-4 border-l border-neutral-200 pl-2 dark:border-neutral-800">
              <CategoryItems nodes={node.children} hrefFor={hrefFor} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function MenuMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-3 text-sm text-neutral-500 dark:text-neutral-400">
      {children}
    </p>
  );
}

export function CatalogNavigation({
  categories,
  brands,
  categoriesError,
  brandsError,
}: CatalogNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function categoryHref(category: CategoryTreeNode): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("categoryId");
    const query = params.toString();
    return `${category.path}${query ? `?${query}` : ""}`;
  }

  function brandHref(brandId: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("brandId", String(brandId));
    params.delete("page");
    const targetPath = pathname.startsWith("/search/category/")
      ? pathname
      : "/search";
    return `${targetPath}?${params}`;
  }

  return (
    <div className="hidden border-y border-neutral-200 md:block dark:border-neutral-800">
      <div className="mx-auto flex max-w-(--breakpoint-2xl) items-center gap-7 px-6 py-2 text-sm">
        <Popover className="relative">
          <PopoverButton className="flex items-center gap-1 py-1 font-medium hover:text-blue-600">
            Categorias
            <ChevronDownIcon className="h-4 w-4" />
          </PopoverButton>
          <PopoverPanel
            anchor="bottom start"
            transition
            className="z-40 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 shadow-xl transition duration-150 data-closed:-translate-y-1 data-closed:opacity-0 dark:border-neutral-800 dark:bg-black"
          >
            {categoriesError ? (
              <MenuMessage>
                Não foi possível carregar as categorias.
              </MenuMessage>
            ) : categories.length ? (
              <CategoryItems nodes={categories} hrefFor={categoryHref} />
            ) : (
              <MenuMessage>Nenhuma categoria disponível.</MenuMessage>
            )}
          </PopoverPanel>
        </Popover>

        <Popover className="relative">
          <PopoverButton className="flex items-center gap-1 py-1 font-medium hover:text-blue-600">
            Marcas
            <ChevronDownIcon className="h-4 w-4" />
          </PopoverButton>
          <PopoverPanel
            anchor="bottom start"
            transition
            className="z-40 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl transition duration-150 data-closed:-translate-y-1 data-closed:opacity-0 dark:border-neutral-800 dark:bg-black"
          >
            {brandsError ? (
              <MenuMessage>Não foi possível carregar as marcas.</MenuMessage>
            ) : brands.length ? (
              <ul className="space-y-1">
                {brands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={brandHref(brand.id)}
                      className="block rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <MenuMessage>Nenhuma marca disponível.</MenuMessage>
            )}
          </PopoverPanel>
        </Popover>
      </div>
    </div>
  );
}
