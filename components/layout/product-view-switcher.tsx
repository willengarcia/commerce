import {
  ListBulletIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";

export type ProductView = "list" | "grid" | "compact";

export function normalizeProductView(value?: string): ProductView {
  return value === "list" || value === "compact" ? value : "grid";
}

export function productGridClass(view: ProductView): string {
  if (view === "list") return "grid-cols-1";
  if (view === "compact") {
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  }
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

export default function ProductViewSwitcher({
  view,
  links,
}: {
  view: ProductView;
  links: Record<ProductView, string>;
}) {
  const options = [
    { value: "list" as const, label: "Exibir em lista", icon: ListBulletIcon },
    {
      value: "grid" as const,
      label: "Exibir em grade média",
      icon: Squares2X2Icon,
    },
    {
      value: "compact" as const,
      label: "Exibir em grade compacta",
      icon: TableCellsIcon,
    },
  ];

  return (
    <nav
      aria-label="Modo de exibição dos produtos"
      className="flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-700"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = view === option.value;
        return (
          <Link
            key={option.value}
            href={links[option.value]}
            aria-label={option.label}
            title={option.label}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-blue-600 text-white"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white",
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </nav>
  );
}
