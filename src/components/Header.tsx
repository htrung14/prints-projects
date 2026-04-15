"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/**
 * Cargo-style header: three plain text groups, edge to edge.
 *   LEFT   artist name
 *   CENTER project mark (Arabic + Latin transliteration) + Essay
 *   RIGHT  Info, Cart
 * Contact lives in the footer, not here.
 * The project mark (Arabic + Latin) and the Essay link all point to /essay.
 */
export default function Header() {
  const { itemCount, openDrawer } = useCart();

  return (
    <header
      className="sticky top-0 z-50 grid items-baseline gap-6 bg-bg px-6 py-5 md:px-10"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      <div className="justify-self-start">
        <Link href="/" className="text-ink-strong">
          Thalia Bassim
        </Link>
      </div>

      <div className="hidden items-baseline gap-6 justify-self-center md:flex">
        <Link href="/essay" className="arabic" dir="rtl" lang="ar">
          التمسّك
        </Link>
        <Link href="/essay" className="text-ink-strong">
          At-Tamassok
        </Link>
        <Link href="/essay">Essay</Link>
      </div>

      <div className="flex items-baseline gap-6 justify-self-end">
        <Link href="/information" className="hidden md:inline">
          Info
        </Link>
        <button type="button" onClick={openDrawer} className="text-ink-strong">
          Cart{itemCount > 0 ? ` (${itemCount})` : ""}
        </button>
      </div>
    </header>
  );
}
