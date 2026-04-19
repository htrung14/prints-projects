"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatUsd } from "@/lib/pricing";
import type { Photo } from "@/lib/types";

type Feed = "recent" | "similar";

export default function RelatedPrints({ current, all }: { current: Photo; all: Photo[] }) {
  const [feed, setFeed] = useState<Feed>("recent");
  const railRef = useRef<HTMLDivElement>(null);

  const { recent, similar } = useMemo(() => {
    const others = all.filter((p) => p.slug !== current.slug);
    const recent = others.slice(0, 6);
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
    const rail = railRef.current;
    if (!rail) return;
    const cell = rail.querySelector<HTMLAnchorElement>("a");
    const dx = (cell?.getBoundingClientRect().width ?? 260) + 28;
    rail.scrollBy({ left: dx * dir, behavior: "smooth" });
  };

  return (
    <section data-related-sentinel aria-label="Related prints" className="related-wrap">
      <header className="related-head">
        <nav role="tablist" className="related-tabs">
          <Tab active={feed === "recent"} onClick={() => setFeed("recent")}>
            Recently viewed
          </Tab>
          <Tab active={feed === "similar"} onClick={() => setFeed("similar")}>
            You may also like
          </Tab>
        </nav>
        <div className="related-arrows" aria-hidden>
          <Arrow label="Scroll left" onClick={() => scroll(-1)}>
            ‹
          </Arrow>
          <Arrow label="Scroll right" onClick={() => scroll(1)}>
            ›
          </Arrow>
        </div>
      </header>

      <div ref={railRef} role="tabpanel" className="related-rail">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/photos/${p.slug}`}
            className="related-cell"
            style={{ color: "inherit" }}
          >
            <div className="related-frame">
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
              From {formatUsd(p.basePriceCents)}
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        .related-wrap {
          padding: 72px 44px 96px;
        }
        .related-head {
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .related-tabs {
          display: flex;
          flex-wrap: nowrap;
          gap: 28px;
        }
        .related-arrows {
          display: flex;
          gap: 6px;
        }
        .related-rail {
          display: flex;
          gap: 28px;
          overflow-x: auto;
          padding-bottom: 8px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          /* Let cells align to the container's visual left edge cleanly - no inner padding on cells, so the first item doesn't render as
             a thin sliver on scroll-reset. */
        }
        .related-rail::-webkit-scrollbar { display: none; }
        .related-cell {
          display: block;
          flex: 0 0 auto;
          width: 280px;
          scroll-snap-align: start;
        }
        .related-frame {
          position: relative;
          overflow: hidden;
          background: #ebe9e4;
          aspect-ratio: 4 / 5;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .related-wrap { padding: 48px 20px 64px; }
          .related-head { flex-direction: column; align-items: flex-start; gap: 16px; }
          .related-arrows { display: none; }
          .related-cell { width: min(72vw, 280px); }
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
