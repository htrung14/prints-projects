"use client";

/**
 * /checkout — cart review + "Proceed to Stripe" button.
 *
 * Hosted Checkout: we never mount Stripe Elements. On click, POST the cart
 * to `/api/checkout`, receive `{ url }`, then `window.location.assign(url)`.
 *
 * Visual: Cargo aesthetic — Diatype-weight 900, rgba(0,0,0,0.6) ink, no
 * rounded buttons. Reuses the `btn-ghost` utility from globals.css so the
 * button matches the rest of the site.
 */

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { getAllPhotos } from "@/lib/photos";
import { formatUsd, priceCents } from "@/lib/pricing";
import type { PaperType } from "@/lib/types";

export default function CheckoutPage() {
  const { lines, subtotalCents, itemCount, remove } = useCart();
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
      // Hard redirect — we don't use router.push because Stripe's hosted
      // Checkout is a different origin.
      window.location.assign(data.url);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong. Please retry.");
      setPending(false);
    }
  }

  if (lines.length === 0) {
    // Preserve the tone of the old stub's empty state.
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
            const size = photo.sizes.find((s) => s.id === line.sizeId);
            const paper = photo.papers.find((p) => p.id === (line.paperId as PaperType));
            const lineUnit = priceCents(photo, line.sizeId, line.paperId as PaperType);
            return (
              <li
                key={`${line.photoSlug}-${line.sizeId}-${line.paperId}-${i}`}
                className="flex gap-4 py-5"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.imageAlt}
                  className="h-24 w-24 flex-none object-cover"
                />
                <div className="flex flex-1 flex-col text-sm leading-snug">
                  <span className="text-ink-strong">
                    {photo.title}
                    {photo.titleItalic ? (
                      <>
                        {" "}
                        <em>{photo.titleItalic}</em>
                      </>
                    ) : null}
                  </span>
                  <span className="text-ink-faint">
                    {size?.label} · {paper?.name}
                  </span>
                  <span className="text-ink-faint">Qty {line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="mt-1 self-start text-ink-faint underline"
                    disabled={pending}
                  >
                    Remove
                  </button>
                </div>
                <span className="text-ink-strong self-start">
                  {formatUsd(lineUnit * line.quantity)}
                </span>
              </li>
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
            You&rsquo;ll be redirected to Stripe to enter payment and shipping. We never see or
            store card details.
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
