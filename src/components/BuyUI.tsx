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
    <section
      className="flex flex-col gap-4 self-start lg:sticky"
      style={{ top: "calc(var(--header-height) + 24px)" }}
    >
      <div className="aspect-[16/9] overflow-hidden bg-[var(--bg-soft)]">
        <img src={photo.imageUrl} alt={photo.imageAlt} className="h-full w-full object-cover" />
      </div>

      <h2 className="h-display">
        {photo.title}
        {photo.titleItalic ? (
          <>
            {" "}
            <em>{photo.titleItalic}</em>
          </>
        ) : null}
      </h2>

      <div className="flex items-center justify-between border-y border-[var(--ink-line)] py-2 text-xs">
        <span className="text-[var(--ink-strong)]">Edition of {photo.editionTotal}</span>
        <span className="text-[var(--ink-faint)]">
          {soldOut ? "Sold out" : `${remaining} remaining`}
        </span>
      </div>
      <p className="-mt-2 text-[11px] text-[var(--ink-faint)]">
        Pooled across all sizes and papers.
      </p>

      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3 border-b border-[var(--ink-line)] pb-2">
          <span>Size</span>
          <select
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            className="bg-transparent text-right text-[var(--ink-strong)]"
            disabled={soldOut}
          >
            {photo.sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between gap-3 border-b border-[var(--ink-line)] pb-2">
          <span>Paper</span>
          <select
            value={paperId}
            onChange={(e) => setPaperId(e.target.value as PaperType)}
            className="bg-transparent text-right text-[var(--ink-strong)]"
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

        <label className="flex items-center justify-between gap-3 border-b border-[var(--ink-line)] pb-2">
          <span>Qty</span>
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="bg-transparent text-right text-[var(--ink-strong)]"
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

      <div className="flex items-baseline justify-between pt-1">
        <span className="text-[var(--ink-strong)]">{formatUsd(unitPrice * qty)}</span>
        <span className="text-[11px] text-[var(--ink-faint)]">
          + shipping. Free US on 2 prints or more.
        </span>
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
        className={`mt-1 border px-4 py-2 text-center ${
          soldOut
            ? "cursor-not-allowed border-[var(--ink-line)] text-[var(--ink-faint)]"
            : "border-[var(--ink)] text-[var(--ink-strong)]"
        }`}
      >
        {soldOut ? "Edition closed" : "Add to cart"}
      </button>

      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--ink-faint)]">More details</summary>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt>Lead time</dt>
          <dd className="text-right text-[var(--ink-strong)]">5 to 8 business days</dd>
          <dt>Shipping</dt>
          <dd className="text-right text-[var(--ink-strong)]">USPS Priority, calc at checkout</dd>
          <dt>Returns</dt>
          <dd className="text-right text-[var(--ink-strong)]">Damage and defect only</dd>
        </dl>
        <p className="mt-3 text-[var(--ink-faint)]">
          Made to order in Brooklyn, NY. We replace prints damaged in transit or with production
          defects within 14 days of delivery.
        </p>
      </details>
    </section>
  );
}
