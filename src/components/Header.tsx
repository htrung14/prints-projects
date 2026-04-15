"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/**
 * Cargo-style header: three plain text groups, edge to edge.
 *   LEFT   artist name
 *   CENTER project mark + Essay
 *   RIGHT  Info, Cart, Contact
 * All the same weight, same ink color, no borders, no badges.
 */
export default function Header() {
  const { itemCount, openDrawer } = useCart();

  return (
    <header
      className="sticky top-0 z-50 grid items-baseline gap-6 bg-[var(--bg)] px-6 py-5 md:px-10"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      <div className="justify-self-start">
        <Link href="/" className="text-[var(--ink-strong)]">
          Brooklyn Prints
        </Link>
      </div>

      <div className="hidden items-baseline gap-6 justify-self-center md:flex">
        <span className="text-[var(--ink-strong)]">Prints</span>
        <Link href="/about">Essay</Link>
      </div>

      <div className="flex items-baseline gap-6 justify-self-end">
        <Link href="/about" className="hidden md:inline">
          Info
        </Link>
        <button type="button" onClick={openDrawer} className="text-[var(--ink-strong)]">
          Cart{itemCount > 0 ? ` (${itemCount})` : ""}
        </button>
        <Link href="mailto:" className="hidden md:inline">
          Contact ↗
        </Link>
      </div>
    </header>
  );
}
