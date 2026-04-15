"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { itemCount, openDrawer } = useCart();
  const empty = itemCount === 0;

  return (
    <header
      className="sticky top-0 z-50 grid items-center gap-6 border-b border-[var(--ink-line)] bg-[var(--bg)] px-6 py-4 md:px-8"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      <div className="justify-self-start">
        <Link href="/" className="text-[var(--ink-strong)]">
          Brooklyn Prints
        </Link>
      </div>

      <div className="hidden items-baseline gap-6 justify-self-center md:flex">
        <Link href="/">Catalog</Link>
        <Link href="/about">Info</Link>
      </div>

      <div className="flex items-center gap-4 justify-self-end md:gap-5">
        <button
          type="button"
          onClick={openDrawer}
          className={`inline-flex items-center gap-2 border px-2.5 py-1.5 ${
            empty
              ? "border-[var(--ink-line)] text-[var(--ink-faint)]"
              : "border-[var(--ink)] text-[var(--ink-strong)]"
          }`}
          aria-label={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        >
          <span>Cart</span>
          <span
            className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] ${
              empty ? "bg-[var(--ink-line)] text-[var(--ink)]" : "bg-[var(--ink)] text-white"
            }`}
          >
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}
