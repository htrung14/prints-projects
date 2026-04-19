"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatUsd } from "@/lib/pricing";
import type { Photo } from "@/lib/types";

type Feed = "recent" | "similar";

export default function RelatedPrints({ current, all }: { current: Photo; all: Photo[] }) {
  const [feed, setFeed] = useState<Feed>("recent");
  const gridRef = useRef<HTMLDivElement>(null);

  const { recent, similar } = useMemo(() => {
    const others = all.filter((p) => p.slug !== current.slug);
    // Recent: first 6 in catalog order excluding current.
    const recent = others.slice(0, 6);
    // Similar: next 6 by edition-total proximity, same basePriceCents tier.
    const similar = [...others]
      .sort(
        (a, b) =>
          Math.abs(a.basePriceCents - current.basePriceCents) -
          Math.abs(b.basePriceCents - current.basePriceCents)
      )
      .slice(0, 6);
    return { recent, similar };
  }, [all, current.slug, current.basePriceCents]);

  const items = feed === "recent" ? recent : similar;

  const scroll = (dir: 1 | -1) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cell = grid.querySelector<HTMLAnchorElement>("a");
    const dx = (cell?.getBoundingClientRect().width ?? 260) + 28;
    grid.scrollBy({ left: dx * dir, behavior: "smooth" });
  };

  return (
    <section
      data-related-sentinel
      aria-label="Related prints"
      className="px-5 md:px-11"
      style={{ padding: "72px 44px 96px" }}
    >
      <header className="mb-8 flex items-center justify-between md:flex-row">
        <nav role="tablist" className="flex flex-nowrap" style={{ gap: 28 }}>
          <Tab active={feed === "recent"} onClick={() => setFeed("recent")}>
            Recently viewed
          </Tab>
          <Tab active={feed === "similar"} onClick={() => setFeed("similar")}>
            You may also like
          </Tab>
        </nav>
        <div className="hidden md:flex" style={{ gap: 6 }}>
          <Arrow label="Scroll left" onClick={() => scroll(-1)}>
            ‹
          </Arrow>
          <Arrow label="Scroll right" onClick={() => scroll(1)}>
            ›
          </Arrow>
        </div>
      </header>

      <div
        ref={gridRef}
        role="tabpanel"
        className="flex overflow-x-auto scroll-snap-x"
        style={{
          gap: 28,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          paddingBottom: 8,
          margin: "0 -8px",
        }}
      >
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/photos/${p.slug}`}
            className="block flex-none"
            style={{
              width: 260,
              scrollSnapAlign: "start",
              color: "inherit",
              padding: "0 8px",
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                background: "#ebe9e4",
                aspectRatio: "4 / 5",
                marginBottom: 14,
              }}
            >
              <img
                src={p.imageUrl}
                alt={p.imageAlt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[640ms] hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <span
              className="block font-serif italic"
              style={{ fontSize: 19, color: "var(--ink)", marginBottom: 4 }}
            >
              {p.title}
              {p.titleItalic ? ` ${p.titleItalic}` : ""}
            </span>
            <span
              className="block font-mono"
              style={{ fontSize: 13, color: "var(--i5)", letterSpacing: "0.02em" }}
            >
              From {formatUsd(p.basePriceCents)} · Edition of {p.editionTotal}
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        [data-related-sentinel] > div::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) {
          [data-related-sentinel] { padding: 48px 20px !important; }
          [data-related-sentinel] header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </section>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="relative"
      style={{
        background: "transparent",
        border: 0,
        padding: "4px 0",
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: active ? "var(--ink)" : "var(--i5)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 200ms",
      }}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -2,
            height: 1,
            background: "var(--ink)",
          }}
        />
      ) : null}
    </button>
  );
}

function Arrow({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        background: "transparent",
        border: 0,
        width: 32,
        height: 32,
        fontFamily: "var(--font-serif)",
        fontSize: 24,
        lineHeight: 1,
        color: "var(--i5)",
        cursor: "pointer",
        transition: "color 180ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--i5)")}
    >
      {children}
    </button>
  );
}
