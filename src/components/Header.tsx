"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { itemCount, openDrawer } = useCart();
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isInfo = pathname === "/info";
  const isEssay = pathname === "/essay";
  const isDark = isInfo;

  const bg = isInfo ? "#0072BB" : isEssay ? "#E2E052" : "var(--bg)";
  const fg = isDark ? "#fff" : "var(--ink)";

  return (
    <header
      className="grid grid-cols-[1fr_auto] items-baseline px-5 py-4 md:px-11 md:py-[17px]"
      style={{
        background: bg,
        borderBottom: "none",
      }}
    >
      <div className="justify-self-start">
        <Link
          href="/"
          className="font-serif text-[17px] font-semibold tracking-[0.04em]"
          style={{ color: fg }}
        >
          Thalia Bassim
        </Link>
      </div>

      <nav className="flex items-baseline gap-6 justify-self-end md:gap-7">
        <Link
          href="/#prints"
          className="font-serif text-[17px] font-semibold tracking-[0.04em] hidden md:inline"
          style={{ color: fg }}
        >
          {isLanding ? "View prints" : "All prints"}
        </Link>
        <Link
          href="/info"
          className="font-serif text-[17px] font-semibold tracking-[0.04em]"
          style={{ color: fg }}
        >
          Info
        </Link>
        <button
          type="button"
          onClick={openDrawer}
          className="font-serif tracking-[0.04em]"
          style={{ fontWeight: 600, fontSize: 17, color: fg }}
        >
          Cart
          <span className="ml-1">({itemCount})</span>
        </button>
      </nav>
    </header>
  );
}
