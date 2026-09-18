"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import type { ProductViewModel } from "lib/api/types";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const AUTOPLAY_INTERVAL_MS = 4_500;

export function RelatedProductsCarousel({
  products,
  currentProductId,
}: {
  products: ProductViewModel[];
  currentProductId: number;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [interactionPaused, setInteractionPaused] = useState(false);

  function move(direction: 1 | -1) {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 16;
    const distance = firstCard.getBoundingClientRect().width + gap;
    const atEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - distance / 2;
    const atStart = track.scrollLeft <= distance / 2;

    if (direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction === -1 && atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
    } else {
      track.scrollBy({ left: distance * direction, behavior: "smooth" });
    }
  }

  useEffect(() => {
    if (
      products.length < 2 ||
      interactionPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") move(1);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [interactionPaused, products.length]);

  return (
    <div
      className="group/carousel relative"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setInteractionPaused(false);
        }
      }}
      onTouchStart={() => setInteractionPaused(true)}
      onTouchEnd={() => setInteractionPaused(false)}
      onTouchCancel={() => setInteractionPaused(false)}
    >
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Produtos relacionados"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="aspect-square w-[82%] flex-none snap-start sm:w-[48%] lg:w-[31%] xl:w-[23%]"
          >
            <Link
              href={`/product/${product.id}`}
              prefetch
              aria-current={
                product.id === currentProductId ? "page" : undefined
              }
              className="relative block h-full w-full"
            >
              <GridTileImage
                active={product.id === currentProductId}
                alt={product.name}
                label={{
                  title: product.name,
                  amount: product.displayPrice,
                  currencyCode: product.currencyCode,
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 82vw"
              />
            </Link>
          </li>
        ))}
      </ul>

      {products.length > 1 ? (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Ver produtos anteriores"
            className="rounded-full border border-neutral-300 bg-white p-2.5 transition hover:border-blue-600 hover:text-blue-600 dark:border-neutral-700 dark:bg-black"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Ver próximos produtos"
            className="rounded-full border border-neutral-300 bg-white p-2.5 transition hover:border-blue-600 hover:text-blue-600 dark:border-neutral-700 dark:bg-black"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
