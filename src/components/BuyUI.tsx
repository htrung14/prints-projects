"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useCart } from "@/lib/cart";
import { formatUsd, isSoldOut, priceCents } from "@/lib/pricing";
import type { PaperType, Photo } from "@/lib/types";

type DiscKey = "shipping" | "care";

const FIXED_SIZE_ID = "8x10";
const FIXED_SIZE_LABEL = "8 × 10 in";
const FIXED_PAPER_ID: PaperType = "photo-rag";

export default function BuyUI({ photo }: { photo: Photo }) {
  const { add, drawerOpen } = useCart();
  const paperId = FIXED_PAPER_ID;
  const qty = 1;

  // Post-Lemaire restructure (2026-04-20): two of the previous four accordions
  // (Paper, Description) flattened into always-visible blocks so the page
  // scans at a glance the way lemaire.fr's PDP does. Shipping & Care stay
  // collapsed because that content is reference detail - users who want it
  // will open it, but it shouldn't compete with the photograph for attention.
  const [open, setOpen] = useState<Record<DiscKey, boolean>>({
    shipping: false,
    care: false,
  });

  const ctaRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  // In-place add acknowledgement - flips true for ~1.6s after click so both
  // the main CTA and the mobile sticky bar briefly render as "Added ✓".
  // The bottom Toast still fires via cart.addedAt; this is the direct-contact
  // confirmation for users whose eyes are on the button, not the viewport.
  const [justAdded, setJustAdded] = useState(false);

  // Resolve the locked size - the fixture may not have 16x20 for every
  // photo, so fall back to the first declared size rather than erroring.
  const lockedSize = photo.sizes.find((s) => s.id === FIXED_SIZE_ID) ?? photo.sizes[0];
  const sizeId = lockedSize.id;

  const soldOut = isSoldOut(photo);
  const currentPrice = priceCents(photo, sizeId, paperId);

  const toggleDisc = (key: DiscKey) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  // Sticky bar - show when the main CTA is out of viewport AND the related
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
    track("add_to_cart", {
      slug: photo.slug,
      ref: photo.referenceNumber,
      price_cents: currentPrice,
    });
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
      {/* Title: Arabic above English */}
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
          className="font-serif"
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "var(--i8)",
            lineHeight: 1.15,
            marginBottom: 18,
          }}
        >
          {photo.title}
          {photo.titleItalic ? <>, {photo.titleItalic}</> : null}
        </span>
      </h1>

      {/* Price block - per Lemaire pattern: tiny caps label above, prominent
          numeral below, subtle rule under. Keeps the price legible without
          waiting for the CTA to reveal it. */}
      <div style={{ marginBottom: 20 }}>
        <p
          className="font-sans"
          style={{
            fontSize: 30,
            fontWeight: 400,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          {formatUsd(currentPrice)}
        </p>
      </div>

      {/* Fixed size + edition meta. Archival context now lives with the paper
          picker (below) so this line is tight. */}
      <div
        style={{
          marginBottom: 26,
          paddingBottom: 18,
          borderBottom: "1px solid var(--i1)",
        }}
      >
        <p
          className="font-mono"
          style={{
            fontSize: 13,
            color: "var(--i5)",
            letterSpacing: "0.04em",
          }}
        >
          {FIXED_SIZE_LABEL} · Archival pigment · Ed. of {photo.editionTotal}
        </p>
      </div>

      {/* CTA + micro-meta below. The button keeps the headline price on its
          right edge as a redundancy check right before commit. */}
      <div style={{ marginBottom: 10 }}>
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
        <p
          className="font-mono"
          style={{
            fontSize: 12,
            letterSpacing: "0.04em",
            color: "var(--i5)",
            marginTop: 14,
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          Certificate of authenticity included.
          <br />
          Delivery 2–3 weeks US · 3–5 weeks international.
        </p>
      </div>

      <section
        aria-label="Description"
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--i1)",
        }}
      >
        <h2
          className="font-mono"
          style={{
            fontSize: 13,
            letterSpacing: "0.04em",
            color: "var(--ink)",
            marginBottom: 14,
          }}
        >
          Description
        </h2>
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          {photo.description.map((para, i) => (
            <p key={i} style={{ marginTop: i === 0 ? 0 : 10 }}>
              {para}
            </p>
          ))}
        </div>
      </section>

      <Disclosure
        label="Shipping & Returns"
        value=""
        open={open.shipping}
        onToggle={() => toggleDisc("shipping")}
      >
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          <p style={{ marginBottom: 12 }}>
            A 3% processing fee is added at checkout. Included in the final total.
          </p>
          <p style={{ marginBottom: 12 }}>
            Ships in a flat waterproof package. Total delivery takes 2–3 weeks within the United
            States, and 3–5 weeks internationally.
          </p>
          <p>
            Dispatched worldwide via insured courier. If your print arrives damaged, email a photo
            of the damage within 48 hours of delivery and we will arrange a replacement at no cost.
          </p>
        </div>
      </Disclosure>

      {/* Care - kept collapsed. Post-purchase reference, not a purchase driver. */}
      <Disclosure label="Care" value="" open={open.care} onToggle={() => toggleDisc("care")}>
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          <p>
            Handle by the edges only. Avoid direct sunlight and humidity above 60%. Store flat or in
            the supplied sleeve until framed.
          </p>
        </div>
      </Disclosure>

      {/* Mobile sticky bar - hides when cart drawer is open so it doesn't
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
            {photo.titleItalic ? `, ${photo.titleItalic}` : ""}
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
