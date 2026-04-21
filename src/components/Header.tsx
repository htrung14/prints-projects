"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { itemCount, openDrawer } = useCart();
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isInfo = pathname === "/info";
  const isEssay = pathname === "/essay";

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) return;
    function onScroll() {
      setScrolled(window.scrollY > window.innerHeight * 0.6);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  const landingTransparent = isLanding && !scrolled;
  const isDark = isInfo || landingTransparent;

  const bg = landingTransparent
    ? "transparent"
    : isInfo
      ? "#0072BB"
      : isEssay
        ? "#E2E052"
        : "var(--bg)";
  const fg = isDark ? "#fff" : "var(--ink)";

  return (
    <header
      className="sticky top-0 z-50 grid grid-cols-[1fr_auto] items-baseline px-5 py-4 md:px-11 md:py-[17px]"
      style={{
        background: bg,
        borderBottom: "none",
        transition: "background 300ms ease",
      }}
    >
      <div className="justify-self-start">
        <Link
          href="/"
          className="font-serif text-[17px] font-semibold tracking-[0.04em]"
          style={{ color: fg, transition: "color 300ms ease" }}
        >
          Thalia Bassim
        </Link>
      </div>

      <nav className="flex items-baseline gap-6 justify-self-end md:gap-7">
        <Link
          href="/#prints"
          className="font-serif text-[17px] font-semibold tracking-[0.04em] hidden md:inline"
          style={{ color: fg, transition: "color 300ms ease" }}
        >
          {isLanding ? "View prints" : "All prints"}
        </Link>
        <Link
          href="/info"
          className="font-serif text-[17px] font-semibold tracking-[0.04em]"
          style={{ color: fg, transition: "color 300ms ease" }}
        >
          Info
        </Link>
        <button
          type="button"
          onClick={openDrawer}
          className="font-serif tracking-[0.04em]"
          style={{ fontWeight: 600, fontSize: 17, color: fg, transition: "color 300ms ease" }}
        >
          Cart
          <span className="ml-1">({itemCount})</span>
        </button>
      </nav>
    </header>
  );
}
