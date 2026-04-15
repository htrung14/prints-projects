"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { editionRemaining, formatUsd, isSoldOut, priceCents } from "@/lib/pricing";
import type { PaperType, Photo } from "@/lib/types";

export default function BuyUI({ photo }: { photo: Photo }) {
  const { add } = useCart();
  const [sizeId, setSizeId] = useState(photo.sizes[0].id);
  const [paperId, setPaperId] = useState<PaperType>(photo.papers[0].id);
  const [qty, setQty] = useState(1);

  const remaining = editionRemaining(photo);
  const soldOut = isSoldOut(photo);
  const unitPrice = priceCents(photo, sizeId, paperId);

  return (
    <section className="flex flex-col gap-10 self-start">
      {/* BLOCK 1: Photo on soft gray surface */}
      <div className="flex items-center justify-center bg-bg-soft p-6">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="w-full object-contain"
          style={{ maxHeight: "42vh" }}
        />
      </div>

      {/* BLOCK 2: Title block */}
      <header className="flex flex-col gap-3">
        <div className="label-caps text-ink-faint">{photo.referenceNumber}</div>
        <h2
          className="text-ink-strong"
          style={{
            fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          {photo.title}
          {photo.titleItalic ? (
            <>
              {" "}
              <em>{photo.titleItalic}</em>
            </>
          ) : null}
        </h2>
      </header>

      {/* BLOCK 3: Edition state */}
      <div className="flex items-center justify-between border border-ink bg-bg-soft px-5 py-4">
        <div>
          <div className="label-caps mb-1 text-ink-faint">Edition</div>
          <div className="text-ink-strong" style={{ fontSize: "1.1rem" }}>
            of {photo.editionTotal}
          </div>
        </div>
        <div className="text-right">
          <div className="label-caps mb-1 text-ink-faint">Status</div>
          <div className="text-ink-strong" style={{ fontSize: "1.1rem" }}>
            {soldOut ? "Sold out" : `${remaining} remaining`}
          </div>
        </div>
      </div>

      {/* BLOCK 4: Controls */}
      <div className="border-2 border-ink-strong">
        <label className="grid grid-cols-[auto_1fr] items-center gap-6 border-b border-ink-line px-5 py-4">
          <span className="text-ink-strong" style={{ fontSize: "1rem" }}>
            Size
          </span>
          <select
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            className="bg-transparent text-right text-ink-strong"
            style={{ fontSize: "1rem" }}
            disabled={soldOut}
          >
            {photo.sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid grid-cols-[auto_1fr] items-center gap-6 border-b border-ink-line px-5 py-4">
          <span className="text-ink-strong" style={{ fontSize: "1rem" }}>
            Paper
          </span>
          <select
            value={paperId}
            onChange={(e) => setPaperId(e.target.value as PaperType)}
            className="bg-transparent text-right text-ink-strong"
            style={{ fontSize: "1rem" }}
            disabled={soldOut}
          >
            {photo.papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.surchargeCents ? ` +${formatUsd(p.surchargeCents)}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid grid-cols-[auto_1fr] items-center gap-6 px-5 py-4">
          <span className="text-ink-strong" style={{ fontSize: "1rem" }}>
            Qty
          </span>
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="bg-transparent text-right text-ink-strong"
            style={{ fontSize: "1rem" }}
            disabled={soldOut}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* BLOCK 5: Price + CTA */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span
            className="text-ink-strong"
            style={{ fontSize: "2.5rem", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            {formatUsd(unitPrice * qty)}
          </span>
          <span className="text-xs text-ink-faint">+ shipping. Free US on 2 prints or more.</span>
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={() =>
            add({
              photoSlug: photo.slug,
              sizeId,
              paperId,
              quantity: qty,
            })
          }
          className={`add-to-cart-btn w-full py-4 text-center ${
            soldOut
              ? "cursor-not-allowed border-2 border-ink-line text-ink-faint"
              : "bg-ink-strong text-bg hover:opacity-90"
          }`}
          style={{
            fontSize: "1.25rem",
            letterSpacing: "0.01em",
          }}
        >
          {soldOut ? "Edition closed" : "Add to cart →"}
        </button>
      </div>

      {/* BLOCK 6: Shipping & returns (collapsed) */}
      <details className="border-t border-ink-line pt-5 text-sm">
        <summary className="cursor-pointer text-ink-faint">Shipping & returns</summary>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
          <dt className="text-ink-faint">Lead time</dt>
          <dd className="text-right text-ink-strong">5 to 8 business days</dd>
          <dt className="text-ink-faint">Shipping</dt>
          <dd className="text-right text-ink-strong">USPS Priority, calc at checkout</dd>
          <dt className="text-ink-faint">Returns</dt>
          <dd className="text-right text-ink-strong">Damage and defect only</dd>
        </dl>
        <p className="mt-5 text-ink-faint" style={{ fontSize: "0.875rem" }}>
          Made to order in Brooklyn, NY. We replace prints damaged in transit or with production
          defects within 14 days of delivery.
        </p>
      </details>
    </section>
  );
}
