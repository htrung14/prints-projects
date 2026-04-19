"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { itemCount, openDrawer } = useCart();
  const pathname = usePathname();
  const isLanding = pathname === "/";
  // Landing: hide until scrolled past the hero, then stay sticky.
  // Everywhere else: always visible, sticky (no hide-on-scroll-down).
  // Initial value is derived synchronously from isLanding; the effect below
  // only attaches the scroll listener when we're on the landing page.
  const [landingRevealed, setLandingRevealed] = useState(false);
  const revealed = !isLanding || landingRevealed;

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      // Mobile hero is ~55vh tall; desktop hero is 150vh (sticky-pin) → emerge around 0.80 in.
      const threshold = window.matchMedia("(max-width: 700px)").matches ? vh * 0.55 : vh * 1.2;
      setLandingRevealed(y > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  return (
    <header
      className="sticky top-0 z-50 grid grid-cols-[1fr_auto] items-baseline border-b border-ink-line bg-bg px-5 py-4 transition-opacity duration-300 ease-out md:px-11 md:py-[17px]"
      style={{
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? "auto" : "none",
      }}
      aria-hidden={!revealed}
    >
      <div className="justify-self-start">
        <Link href="/" className="text-[15px] font-normal tracking-[0.04em] text-ink">
          {isLanding ? "Thalia Bassim" : "← Thalia Bassim"}
        </Link>
      </div>

      <nav className="flex items-baseline gap-6 justify-self-end md:gap-7">
        <Link href="/#prints" className="text-[15px] font-normal tracking-[0.04em] text-ink">
          {isLanding ? "View prints" : "All prints"}
        </Link>
        <button
          type="button"
          onClick={openDrawer}
          className="text-[15px] font-normal tracking-[0.04em] text-ink"
        >
          Cart
          <span className="ml-1 text-ink-faint">({itemCount})</span>
        </button>
      </nav>
    </header>
  );
}
