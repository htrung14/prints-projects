"use client";

import Link from "next/link";

type Props = {
  href: string;
  target: string;
  className?: string;
  children: React.ReactNode;
};

export function ScrollLink({ href, target, className, children }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    const el = document.getElementById(target);
    if (!el) return;
    e.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    history.replaceState(null, "", href);
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
