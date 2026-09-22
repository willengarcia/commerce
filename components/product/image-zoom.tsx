"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  MagnifyingGlassPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRef, useState } from "react";

export function ProductImageZoom({
  src,
  altText,
}: {
  src: string;
  altText: string;
}) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [enlarged, setEnlarged] = useState(true);

  function resetHover() {
    if (imageRef.current) imageRef.current.style.transform = "scale(1)";
  }

  return (
    <>
      <div
        className="absolute inset-0 overflow-hidden [@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-in"
        onPointerMove={(event) => {
          if (
            event.pointerType !== "mouse" ||
            !window.matchMedia("(hover: hover) and (pointer: fine)").matches
          )
            return;
          const image = imageRef.current;
          if (!image) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 100;
          const y = ((event.clientY - bounds.top) / bounds.height) * 100;
          image.style.transformOrigin = `${x}% ${y}%`;
          image.style.transform = "scale(2)";
        }}
        onPointerLeave={resetHover}
        onPointerCancel={resetHover}
      >
        <div ref={imageRef} className="relative h-full w-full">
          <Image
            className="object-contain"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={altText}
            src={src}
            draggable={false}
            priority
          />
        </div>
      </div>
      <button
        type="button"
        aria-label="Ampliar imagem do produto"
        aria-haspopup="dialog"
        onClick={() => {
          resetHover();
          setEnlarged(true);
          setOpen(true);
        }}
        className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-700 hover:border-blue-600 hover:text-blue-600 dark:border-neutral-700 dark:bg-black/90 dark:text-neutral-200"
      >
        <MagnifyingGlassPlusIcon aria-hidden="true" className="h-5 w-5" />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
          <DialogPanel className="flex h-[90dvh] max-h-[1000px] w-full min-w-0 max-w-5xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 p-3 dark:border-neutral-700">
              <DialogTitle className="text-sm font-medium">
                Imagem do produto
              </DialogTitle>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnlarged((value) => !value)}
                  aria-label={enlarged ? "Reduzir imagem" : "Ampliar imagem"}
                  className="min-h-11 rounded-full border border-neutral-200 px-3 text-sm hover:text-blue-600 dark:border-neutral-700"
                >
                  {enlarged ? "Reduzir" : "Ampliar"}
                </button>
                <button
                  type="button"
                  aria-label="Fechar imagem ampliada"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:text-blue-600"
                >
                  <XMarkIcon aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="shrink-0 px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400">
              {enlarged
                ? "Deslize para explorar os detalhes da imagem."
                : "Imagem completa. Toque em Ampliar para ver os detalhes."}
            </p>
            <div
              key={String(enlarged)}
              ref={(region) => {
                if (region && enlarged) {
                  const frame = requestAnimationFrame(() => {
                    region.scrollLeft =
                      (region.scrollWidth - region.clientWidth) / 2;
                    region.scrollTop =
                      (region.scrollHeight - region.clientHeight) / 2;
                  });
                  return () => cancelAnimationFrame(frame);
                }
              }}
              className="min-h-0 flex-1 overflow-auto overscroll-contain"
              tabIndex={0}
              role="region"
              aria-label="Visualização ampliada do produto"
            >
              <div
                className={
                  enlarged
                    ? "relative h-[200%] w-[200%]"
                    : "relative h-full w-full"
                }
              >
                <Image
                  src={src}
                  draggable={false}
                  alt={altText}
                  fill
                  sizes={enlarged ? "200vw" : "100vw"}
                  className="object-contain"
                />
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
