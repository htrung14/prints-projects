"use client";

/**
 * /checkout - cart review + "Proceed to Stripe" button.
 *
 * Currently uses hosted Stripe Checkout - on click we POST to /api/checkout,
 * get `{ url }` back, and window.location.assign() to it. Hosted Checkout
 * already surfaces Apple Pay, Google Pay, and Link natively; no extra
 * integration needed.
 *
 * Paper upsell: if a line is on a paper that has a more expensive sibling
 * available in that photo's `papers[]`, show an inline "Upgrade to …" chip
 * that calls `updatePaper(index, paperId)` on the cart context.
 */

import Link from "next/link";
import { useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import { useCart } from "@/lib/cart";
import { getAllPhotos } from "@/lib/photos";
import { formatUsd, priceCents } from "@/lib/pricing";
import type { PaperType, PaperOption, Photo } from "@/lib/types";

export default function CheckoutPage() {
  const { lines, subtotalCents, itemCount, remove, updatePaper } = useCart();
  const photos = getAllPhotos();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function proceed() {
    if (pending || lines.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `Checkout failed (${res.status})`);
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        throw new Error("Checkout response missing redirect URL");
      }
      // Hard redirect - we don't use router.push because Stripe's hosted
      // Checkout is a different origin.
      window.location.assign(data.url);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong. Please retry.");
      setPending(false);
    }
  }

  if (lines.length === 0) {
    return (
      <>
        <DemoBanner />
        <div className="border-t border-ink-line px-6 py-16 md:px-8">
          <div className="mx-auto max-w-xl space-y-5">
            <span className="label-caps">Checkout</span>
            <h1 className="h-display text-3xl">Your cart is empty.</h1>
            <p className="text-sm leading-relaxed text-ink">
              Add a print from the catalog and come back here to check out.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/" className="btn-ghost">
                Back to editions →
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DemoBanner />
      <div className="border-t border-ink-line px-6 py-16 md:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <header className="space-y-2">
            <span className="label-caps">Checkout</span>
            <h1 className="h-display text-3xl">Review your cart and continue to payment.</h1>
          </header>

          <ul className="divide-y divide-ink-line border-y border-ink-line">
            {lines.map((line, i) => {
              const photo = photos.find((p) => p.slug === line.photoSlug);
              if (!photo) return null;
              return (
                <CheckoutLine
                  key={`${line.photoSlug}-${line.sizeId}-${line.paperId}-${i}`}
                  index={i}
                  photo={photo}
                  line={{ ...line }}
                  disabled={pending}
                  onRemove={() => remove(i)}
                  onUpgrade={(paperId) => updatePaper(i, paperId)}
                />
              );
            })}
          </ul>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Items</dt>
              <dd className="text-ink-strong">{itemCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="text-ink-strong">{formatUsd(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd className="text-ink-faint">calculated at checkout</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tax</dt>
              <dd className="text-ink-faint">calculated at checkout</dd>
            </div>
          </dl>

          <div className="space-y-3">
            <button
              type="button"
              className="btn-ink w-full"
              disabled={pending || lines.length === 0}
              onClick={proceed}
            >
              <span>{pending ? "Redirecting…" : "Proceed to checkout"}</span>
              <span className="btn-ink-price">{formatUsd(subtotalCents)}</span>
            </button>
            {error ? (
              <p role="alert" className="text-sm text-ink-strong">
                {error}
              </p>
            ) : null}
            <p className="text-[11px] text-ink-faint">
              Payment is processed securely by Stripe. We never see or store card details.
            </p>
          </div>

          <div>
            <Link href="/" className="text-sm text-ink-faint underline">
              ← Continue browsing
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */

function CheckoutLine({
  index,
  photo,
  line,
  disabled,
  onRemove,
  onUpgrade,
}: {
  index: number;
  photo: Photo;
  line: {
    photoSlug: string;
    sizeId: string;
    paperId: PaperType;
    quantity: number;
  };
  disabled: boolean;
  onRemove: () => void;
  onUpgrade: (paperId: PaperType) => void;
}) {
  // Unused but explicit: keeps the signature stable if we later need it
  // (e.g. "Line 2 of 4" labels).
  void index;

  const size = photo.sizes.find((s) => s.id === line.sizeId);
  const paper = photo.papers.find((p) => p.id === line.paperId);
  const lineUnit = priceCents(photo, line.sizeId, line.paperId);

  // Paper change chips - show both directions when available:
  //   upgrade   → next more-expensive paper (adds cost)
  //   downgrade → next cheaper paper (subtracts cost; lets user undo an
  //               earlier upsell click without hunting through disclosures)
  const currentPaperCents = paper?.surchargeCents ?? 0;
  const upgrade: PaperOption | null =
    photo.papers
      .filter((p) => p.surchargeCents > currentPaperCents)
      .sort((a, b) => a.surchargeCents - b.surchargeCents)[0] ?? null;
  const downgrade: PaperOption | null =
    photo.papers
      .filter((p) => p.surchargeCents < currentPaperCents)
      .sort((a, b) => b.surchargeCents - a.surchargeCents)[0] ?? null;
  const upgradeDeltaPerUnit = upgrade ? upgrade.surchargeCents - currentPaperCents : 0;
  const downgradeDeltaPerUnit = downgrade ? currentPaperCents - downgrade.surchargeCents : 0;

  return (
    <li className="flex flex-col gap-3 py-5">
      {/* Row 1 - thumbnail, title, price */}
      <div className="flex items-start gap-4">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="h-24 w-24 flex-none object-cover"
        />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <span className="text-ink-strong">
            {photo.title}
            {photo.titleItalic ? (
              <>
                {" "}
                <em>{photo.titleItalic}</em>
              </>
            ) : null}
          </span>
          <span
            className="text-ink-strong font-mono"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatUsd(lineUnit * line.quantity)}
          </span>
        </div>
      </div>

      {/* Row 2 - details concatenated on their own dedicated line, full-width
          so the phrase never breaks mid-paper-name on narrow viewports. */}
      <p className="text-[13px] leading-snug text-ink-faint">
        {size?.label} · {paper?.name}
      </p>

      {/* Row 3 - qty + remove + upsell */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-faint">
        <span>Qty {line.quantity}</span>
        <button type="button" onClick={onRemove} className="underline" disabled={disabled}>
          Remove
        </button>
        {upgrade ? (
          <button
            type="button"
            onClick={() => onUpgrade(upgrade.id)}
            disabled={disabled}
            className="upsell-chip"
            title={`Switch this print to ${upgrade.name}`}
          >
            Upgrade to {upgrade.name}
            <span className="upsell-delta">+{formatUsd(upgradeDeltaPerUnit * line.quantity)}</span>
          </button>
        ) : null}
        {downgrade ? (
          <button
            type="button"
            onClick={() => onUpgrade(downgrade.id)}
            disabled={disabled}
            className="upsell-chip upsell-chip--revert"
            title={`Switch this print to ${downgrade.name}`}
          >
            Revert to {downgrade.name}
            <span className="upsell-delta">
              −{formatUsd(downgradeDeltaPerUnit * line.quantity)}
            </span>
          </button>
        ) : null}
      </div>

      <style>{`
        .upsell-chip {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid var(--rule);
          background: var(--bg);
          color: var(--ink);
          font-size: 12px;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background-color 160ms ease, border-color 160ms ease;
        }
        .upsell-chip:hover:not(:disabled) {
          background: rgba(12, 11, 10, 0.04);
          border-color: var(--i3);
        }
        .upsell-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .upsell-delta {
          font-family: var(--font-mono);
          color: var(--i5);
          font-size: 11px;
        }
      `}</style>
    </li>
  );
}
