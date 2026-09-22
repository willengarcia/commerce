"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { BrandViewModel, CategoryTreeNode } from "lib/api/types";
import Link from "next/link";

type CatalogNavigationProps = {
  categories: CategoryTreeNode[];
  brands: BrandViewModel[];
  categoriesError?: boolean;
  brandsError?: boolean;
};

function CategoryItems({ nodes }: { nodes: CategoryTreeNode[] }) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            href={node.path}
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
              <CategoryItems nodes={node.children} />
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
              <CategoryItems nodes={categories} />
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
                  <li
                    key={brand.id}
                    className="rounded-md px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    {brand.name}
                  </li>
                ))}
              </ul>
            ) : (
              <MenuMessage>Nenhuma marca disponível.</MenuMessage>
            )}
            {brands.length ? (
              <p className="mt-2 border-t border-neutral-200 px-2 pt-2 text-xs text-neutral-500 dark:border-neutral-800">
                O filtro por marca será ativado quando estiver disponível na API
                pública.
              </p>
            ) : null}
          </PopoverPanel>
        </Popover>
      </div>
    </div>
  );
}
