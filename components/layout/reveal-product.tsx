"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export default function RevealProduct({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const elementRef = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.unobserve(entry.target);
      },
      { rootMargin: "0px 0px -40px", threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={elementRef}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={clsx(
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0 will-change-[opacity,transform]",
        className,
      )}
    >
      {children}
    </li>
  );
}
