"use client";

import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";

import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { BrandViewModel, CategoryTreeNode } from "lib/api/types";
import { Menu } from "lib/shopify/types";
import Search, { SearchSkeleton } from "./search";

export default function MobileMenu({
  menu,
  isAuthenticated,
  categories,
  brands,
  categoriesError,
  brandsError,
}: {
  menu: Menu[];
  isAuthenticated: boolean;
  categories: CategoryTreeNode[];
  brands: BrandViewModel[];
  categoriesError?: boolean;
  brandsError?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors md:hidden dark:border-neutral-700 dark:text-white"
      >
        <Bars3Icon className="h-4" />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeMobileMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <Dialog.Panel className="fixed inset-y-0 left-0 flex h-full w-full max-w-md flex-col bg-white pb-6 shadow-xl dark:bg-black">
              <div className="overflow-y-auto p-4">
                <button
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white"
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  <XMarkIcon className="h-6" />
                </button>

                <div className="mb-4 w-full">
                  <Suspense fallback={<SearchSkeleton />}>
                    <Search />
                  </Suspense>
                </div>
                <MobileCatalogSection title="Categorias" id="mobile-categories">
                  {categoriesError ? (
                    <MobileMessage>
                      Não foi possível carregar as categorias.
                    </MobileMessage>
                  ) : categories.length ? (
                    <CategoryAccordion
                      nodes={categories}
                      closeMenu={closeMobileMenu}
                    />
                  ) : (
                    <MobileMessage>Nenhuma categoria disponível.</MobileMessage>
                  )}
                </MobileCatalogSection>
                <MobileCatalogSection title="Marcas" id="mobile-brands">
                  {brandsError ? (
                    <MobileMessage>
                      Não foi possível carregar as marcas.
                    </MobileMessage>
                  ) : brands.length ? (
                    <ul className="space-y-1 py-1 pl-3">
                      {brands.map((brand) => (
                        <li
                          key={brand.id}
                          className="py-1.5 text-base text-neutral-700 dark:text-neutral-300"
                        >
                          {brand.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <MobileMessage>Nenhuma marca disponível.</MobileMessage>
                  )}
                </MobileCatalogSection>
                {menu.length ? (
                  <ul className="flex w-full flex-col">
                    {menu.map((item: Menu) => (
                      <li
                        className="py-2 text-xl text-black transition-colors hover:text-neutral-500 dark:text-white"
                        key={item.title}
                      >
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={closeMobileMenu}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Link
                  href={isAuthenticated ? "/account" : "/login"}
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="block py-2 text-xl text-black transition-colors hover:text-neutral-500 dark:text-white"
                >
                  {isAuthenticated ? "Minha conta" : "Entrar"}
                </Link>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function MobileCatalogSection({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200 py-1 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between py-3 text-left text-xl"
      >
        {title}
        {open ? (
          <ChevronDownIcon className="h-5 w-5" />
        ) : (
          <ChevronRightIcon className="h-5 w-5" />
        )}
      </button>
      {open ? <div id={id}>{children}</div> : null}
    </div>
  );
}

function CategoryAccordion({
  nodes,
  closeMenu,
  depth = 0,
}: {
  nodes: CategoryTreeNode[];
  closeMenu: () => void;
  depth?: number;
}) {
  return (
    <ul
      className={
        depth
          ? "border-l border-neutral-200 pl-3 dark:border-neutral-800"
          : "pl-2"
      }
    >
      {nodes.map((node) => (
        <CategoryAccordionItem
          key={node.id}
          node={node}
          closeMenu={closeMenu}
          depth={depth}
        />
      ))}
    </ul>
  );
}

function CategoryAccordionItem({
  node,
  closeMenu,
  depth,
}: {
  node: CategoryTreeNode;
  closeMenu: () => void;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const childrenId = `mobile-category-${node.id}`;

  return (
    <li>
      <div className="flex items-center gap-1">
        <Link
          href={node.path}
          prefetch
          onClick={closeMenu}
          className="min-w-0 flex-1 py-2 text-base text-neutral-800 dark:text-neutral-200"
        >
          {node.name}
        </Link>
        {node.children.length ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls={childrenId}
            aria-label={`${open ? "Recolher" : "Expandir"} ${node.name}`}
            className="flex h-10 w-10 items-center justify-center"
          >
            {open ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
      {open && node.children.length ? (
        <div id={childrenId}>
          <CategoryAccordion
            nodes={node.children}
            closeMenu={closeMenu}
            depth={depth + 1}
          />
        </div>
      ) : null}
    </li>
  );
}

function MobileMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-3 pl-3 text-sm text-neutral-500 dark:text-neutral-400">
      {children}
    </p>
  );
}
