"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatUsd, isSoldOut, priceCents } from "@/lib/pricing";
import type { PaperType, Photo } from "@/lib/types";

type DiscKey = "paper" | "description" | "shipping" | "care";

// Placeholder: each print is a single size. Stakeholder to confirm.
// Falls back to the first fixture size if the expected id is absent so
// cart/Stripe flow keeps working while the size is finalized.
const FIXED_SIZE_ID = "16x20";
const FIXED_SIZE_LABEL = "16 × 20 in";

export default function BuyUI({ photo }: { photo: Photo }) {
  const { add, drawerOpen } = useCart();
  const [paperId, setPaperId] = useState<PaperType>(photo.papers[0].id);
  const [qty] = useState(1);
  const [open, setOpen] = useState<Record<DiscKey, boolean>>({
    paper: false,
    description: false,
    shipping: false,
    care: false,
  });

  const ctaRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  // In-place add acknowledgement — flips true for ~1.6s after click so both
  // the main CTA and the mobile sticky bar briefly render as "Added ✓".
  // The bottom Toast still fires via cart.addedAt; this is the direct-contact
  // confirmation for users whose eyes are on the button, not the viewport.
  const [justAdded, setJustAdded] = useState(false);

  // Resolve the locked size — the fixture may not have 16x20 for every
  // photo, so fall back to the first declared size rather than erroring.
  const lockedSize = photo.sizes.find((s) => s.id === FIXED_SIZE_ID) ?? photo.sizes[0];
  const sizeId = lockedSize.id;

  const soldOut = isSoldOut(photo);
  const currentPrice = priceCents(photo, sizeId, paperId);
  const currentPaper = photo.papers.find((p) => p.id === paperId);

  const toggleDisc = (key: DiscKey) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const closeDisc = (key: DiscKey) => setOpen((o) => ({ ...o, [key]: false }));

  // Sticky bar — show when the main CTA is out of viewport AND the related
  // section is NOT yet in viewport. Same dual IntersectionObserver as prototype.
  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta || !("IntersectionObserver" in window)) return;

    let ctaOut = false;
    let nearBottom = false;
    const sync = () => setShowSticky(ctaOut && !nearBottom);

    const ctaObs = new IntersectionObserver(
      ([e]) => {
        ctaOut = !e.isIntersecting;
        sync();
      },
      { rootMargin: "-8px 0px 0px 0px", threshold: 0 }
    );
    ctaObs.observe(cta);

    const related = document.querySelector("[data-related-sentinel]");
    const relObs = related
      ? new IntersectionObserver(
          ([e]) => {
            nearBottom = e.isIntersecting;
            sync();
          },
          { rootMargin: "0px 0px 0px 0px", threshold: 0 }
        )
      : null;
    if (related && relObs) relObs.observe(related);

    return () => {
      ctaObs.disconnect();
      relObs?.disconnect();
    };
  }, []);

  const handleAdd = () => {
    if (soldOut) return;
    add({ photoSlug: photo.slug, sizeId, paperId, quantity: qty });
    setJustAdded(true);
  };

  // Clear the "Added ✓" state after a short delay so the CTA returns to its
  // normal label. Keyed on justAdded so repeated clicks restart the timer.
  useEffect(() => {
    if (!justAdded) return;
    const t = window.setTimeout(() => setJustAdded(false), 1600);
    return () => window.clearTimeout(t);
  }, [justAdded]);

  return (
    <section className="flex flex-col self-start">
      {/* Breadcrumb */}
      <p
        className="font-mono mb-7"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          color: "var(--i5)",
          textTransform: "uppercase",
        }}
      >
        <Link href="/#prints" className="text-[color:var(--i5)] hover:text-ink">
          Prints
        </Link>
        <span className="mx-2 opacity-55">/</span>
        <span>
          {photo.title}
          {photo.titleItalic ? ` ${photo.titleItalic}` : ""}
        </span>
      </p>

      {/* Title: Arabic above English italic */}
      <h1 className="flex flex-col">
        <span
          className="font-serif"
          lang="ar"
          style={{
            fontWeight: 700,
            fontSize: 42,
            color: "var(--ink)",
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            marginBottom: 8,
          }}
        >
          التمسّك
        </span>
        <span
          className="font-serif italic"
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--i8)",
            lineHeight: 1.15,
            marginBottom: 24,
          }}
        >
          {photo.title}
          {photo.titleItalic ? <> {photo.titleItalic}</> : null}
        </span>
      </h1>

      {/* Static size meta — placeholder, one size per print (TBD) */}
      <p
        className="font-mono"
        style={{
          fontSize: 12,
          color: "var(--i5)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Size · {FIXED_SIZE_LABEL}
      </p>

      <p
        style={{
          fontSize: 17,
          color: "var(--ink)",
          letterSpacing: "0.02em",
          marginBottom: 40,
        }}
      >
        {formatUsd(currentPrice)} USD
      </p>

      {/* Paper disclosure — price meta on each option mirrors the size-list pattern */}
      <Disclosure
        label="Paper"
        value={currentPaper?.name ?? "Select"}
        open={open.paper}
        onToggle={() => toggleDisc("paper")}
      >
        {photo.papers.map((p) => {
          const perPaperPrice = priceCents(photo, sizeId, p.id);
          return (
            <button
              key={p.id}
              type="button"
              className="disc-opt"
              aria-pressed={paperId === p.id}
              onClick={() => {
                setPaperId(p.id);
                closeDisc("paper");
              }}
            >
              {p.name}
              <span className="opt-meta">{formatUsd(perPaperPrice)}</span>
            </button>
          );
        })}
      </Disclosure>

      {/* CTA — the shipping/edition copy lives in the Shipping & returns
          disclosure below, so we don't duplicate it as a caps-mono preamble
          above the button. */}
      <div className="mt-7 mb-3.5">
        <button
          ref={ctaRef}
          type="button"
          className="btn-ink"
          data-added={justAdded ? "true" : "false"}
          disabled={soldOut}
          onClick={handleAdd}
          aria-live="polite"
        >
          <span>{soldOut ? "Edition closed" : justAdded ? "Added to cart ✓" : "Add to cart"}</span>
          <span className="btn-ink-price">{justAdded ? "" : formatUsd(currentPrice)}</span>
        </button>
      </div>

      {/* Description */}
      <Disclosure
        label="Description"
        value=""
        open={open.description}
        onToggle={() => toggleDisc("description")}
      >
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          {photo.description.map((para, i) => (
            <p key={i} style={{ marginTop: i === 0 ? 0 : 10 }}>
              {para}
            </p>
          ))}
        </div>
      </Disclosure>

      {/* Shipping & returns */}
      <Disclosure
        label="Shipping & returns"
        value=""
        open={open.shipping}
        onToggle={() => toggleDisc("shipping")}
      >
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          <p>
            Ships flat in an archival tube within 7 working days via insured courier, worldwide. No
            returns — a replacement can be arranged if the package arrives damaged or unsealed.
          </p>
        </div>
      </Disclosure>

      {/* Care */}
      <Disclosure label="Care" value="" open={open.care} onToggle={() => toggleDisc("care")}>
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          <p>
            Handle by the edges only. Avoid direct sunlight and humidity above 60%. Store flat or in
            the supplied sleeve until framed.
          </p>
        </div>
      </Disclosure>

      {/* Mobile sticky bar — hides when cart drawer is open so it doesn't
          sit on top of the drawer's primary CTA. */}
      <div
        className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-[1fr_auto] items-center gap-[18px] border-t border-ink-line bg-bg lg:hidden"
        style={{
          padding: "14px 24px calc(14px + env(safe-area-inset-bottom, 0px))",
          transform: showSticky && !drawerOpen ? "translateY(0)" : "translateY(110%)",
          transition: "transform 380ms cubic-bezier(.2,.6,.2,1)",
          boxShadow: showSticky && !drawerOpen ? "0 -10px 32px rgba(12,11,10,.06)" : "none",
          pointerEvents: showSticky && !drawerOpen ? "auto" : "none",
          willChange: "transform",
        }}
        role="region"
        aria-label="Buy bar"
        aria-hidden={!showSticky || drawerOpen}
      >
        <div className="min-w-0">
          <span
            className="block font-serif italic overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 17, color: "var(--ink)", lineHeight: 1, marginBottom: 5 }}
          >
            {photo.title}
            {photo.titleItalic ? ` ${photo.titleItalic}` : ""}
          </span>
          <span className="block font-mono" style={{ fontSize: 13, color: "var(--ink)" }}>
            {formatUsd(currentPrice)}
          </span>
        </div>
        <button
          type="button"
          className="btn-ink"
          style={{ width: "auto", padding: "16px 22px", gridTemplateColumns: "auto" }}
          data-added={justAdded ? "true" : "false"}
          disabled={soldOut}
          onClick={handleAdd}
          aria-live="polite"
        >
          {soldOut ? "Sold out" : justAdded ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </section>
  );
}

function Disclosure({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="disc" data-open={open ? "true" : "false"}>
      <button type="button" className="disc-trigger" aria-expanded={open} onClick={onToggle}>
        <span>{label}</span>
        <span className="d-val">{value}</span>
        <span className="d-chev" aria-hidden="true" />
      </button>
      <div className="d-body">
        <div className="d-inner">
          <div className="d-inner-pad">{children}</div>
        </div>
      </div>
    </div>
  );
}
