"use client";

/**
 * /checkout - cart review + "Proceed to Stripe" button.
 *
 * Currently uses hosted Stripe Checkout - on click we POST to /api/checkout,
 * get `{ url }` back, and window.location.assign() to it. Hosted Checkout
 * already surfaces Apple Pay, Google Pay, and Link natively; no extra
 * integration needed.
 *
 */

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { getAllPhotos } from "@/lib/photos";
import { formatUsd, priceCents } from "@/lib/pricing";
import type { PaperType, Photo } from "@/lib/types";

type Destination = "US" | "CA" | "EU_UK" | "AU_ROW";

const DESTINATION_OPTIONS: ReadonlyArray<{
  value: Destination;
  label: string;
  summary: string;
}> = [
  { value: "US", label: "United States — free", summary: "$0 (United States)" },
  { value: "CA", label: "Canada — $35", summary: "$35 (Canada)" },
  { value: "EU_UK", label: "United Kingdom & EU — $50", summary: "$50 (United Kingdom & EU)" },
  {
    value: "AU_ROW",
    label: "Australia & rest of world — $65",
    summary: "$65 (Australia & rest of world)",
  },
];

export default function CheckoutPage() {
  const { lines, subtotalCents, itemCount, remove } = useCart();
  const photos = getAllPhotos();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination>("US");

  async function proceed() {
    if (pending || lines.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, destination }),
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
    );
  }

  const processingFeeCents = Math.ceil(subtotalCents * 0.03);

  return (
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
              />
            );
          })}
        </ul>

        <fieldset className="space-y-2">
          <legend className="label-caps mb-2">Ship to</legend>
          <div className="flex flex-col gap-2">
            {DESTINATION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="destination"
                  value={opt.value}
                  checked={destination === opt.value}
                  onChange={() => setDestination(opt.value)}
                  disabled={pending}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

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
            <dt>Processing fee (3%)</dt>
            <dd className="text-ink-strong">{formatUsd(processingFeeCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="text-ink-strong">
              {DESTINATION_OPTIONS.find((o) => o.value === destination)?.summary}
            </dd>
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
            <span className="btn-ink-price">{formatUsd(subtotalCents + processingFeeCents)}</span>
          </button>
          {error ? (
            <p role="alert" className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          ) : null}
          <p className="text-[11px] text-ink-faint">
            Payment is processed securely by Stripe. We never see or store card details.
          </p>
          <p className="text-[11px] text-ink-faint">
            Please double-check your shipping address at checkout — prints ship to the address
            exactly as entered, and reshipping an undeliverable order is at your cost.
          </p>
        </div>

        <div>
          <Link href="/" className="text-sm text-ink-faint underline">
            ← Continue browsing
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function CheckoutLine({
  index,
  photo,
  line,
  disabled,
  onRemove,
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
}) {
  // Unused but explicit: keeps the signature stable if we later need it
  // (e.g. "Line 2 of 4" labels).
  void index;

  const size = photo.sizes.find((s) => s.id === line.sizeId);
  const paper = photo.papers.find((p) => p.id === line.paperId);
  const lineUnit = priceCents(photo, line.sizeId, line.paperId);

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

      <p className="text-[13px] leading-snug text-ink-faint">{size?.label} · Archival pigment</p>

      {/* Row 3 - qty + remove + upsell */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-faint">
        <span>Qty {line.quantity}</span>
        <button type="button" onClick={onRemove} className="underline" disabled={disabled}>
          Remove
        </button>
      </div>
    </li>
  );
}
