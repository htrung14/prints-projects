"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const p = usePathname();
  const isInfo = p === "/info";
  const isEssay = p === "/essay";
  const isDark = isInfo;

  const bg = isInfo ? "#0072BB" : isEssay ? "#E2E052" : undefined;
  const fg = isDark ? "#fff" : "var(--i5)";
  const fgCopy = isDark ? "rgba(255,255,255,0.75)" : "var(--i3)";
  const border = isDark
    ? "rgba(255,255,255,0.15)"
    : isEssay
      ? "rgba(0,0,0,0.1)"
      : "var(--ink-line)";

  return (
    <footer
      className="flex flex-col gap-[14px] px-5 py-9 md:px-11 md:pb-10"
      style={{
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.03em",
        color: fg,
        background: bg,
        borderTop: `1px solid ${border}`,
      }}
    >
      <div className="flex flex-wrap items-baseline" style={{ gap: "28px 32px" }}>
        <Link href="mailto:info@thaliabassim.com" style={{ color: fg, transition: "color 180ms" }}>
          Contact
        </Link>
        <Link
          href="https://www.instagram.com/thaliabassim/"
          rel="noreferrer noopener"
          target="_blank"
          style={{ color: fg, transition: "color 180ms" }}
        >
          Instagram ↗
        </Link>
        <Link href="/info" style={{ color: fg, transition: "color 180ms" }}>
          Info
        </Link>
        <Link href="/track" style={{ color: fg, transition: "color 180ms" }}>
          Track order
        </Link>
        <Link href="/terms#shipping" style={{ color: fg, transition: "color 180ms" }}>
          Shipping
        </Link>
        <Link href="/terms" style={{ color: fg, transition: "color 180ms" }}>
          Terms
        </Link>
      </div>
      <span style={{ color: fgCopy }}>© {new Date().getFullYear()} Thalia Bassim</span>
    </footer>
  );
}
