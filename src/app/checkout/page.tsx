"use client";

/**
 * /checkout - cart review + "Proceed to Stripe" button.
 *
 * Currently uses hosted Stripe Checkout - on click we POST to /api/checkout,
 * get `{ url }` back, and window.location.assign() to it. Hosted Checkout
 * already surfaces Apple Pay, Google Pay, and Link natively; no extra
 * integration needed.
 *
 * Shipping model: buyer's country is auto-detected from timezone/locale
 * (with manual override). We derive the tier server-side and Stripe's
 * `allowed_countries` is set to the entire tier, so the buyer can adjust
 * to any country in the same shipping bracket.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { useCart } from "@/lib/cart";
import { getAllPhotos } from "@/lib/photos";
import { formatUsd, priceCents } from "@/lib/pricing";
import type { PaperType, Photo } from "@/lib/types";
import { tierForCountryCode } from "@/lib/countries";

const REGION_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "Europe & United Kingdom" },
  { value: "AU", label: "Rest of world" },
] as const;

const TZ_TIER: Record<string, string> = {
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Detroit": "US",
  "America/Boise": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Halifax": "CA",
  "America/Winnipeg": "CA",
  "America/Edmonton": "CA",
  "America/St_Johns": "CA",
  "America/Regina": "CA",
  "Europe/London": "GB",
  "Europe/Dublin": "GB",
  "Europe/Berlin": "GB",
  "Europe/Paris": "GB",
  "Europe/Amsterdam": "GB",
  "Europe/Brussels": "GB",
  "Europe/Luxembourg": "GB",
  "Europe/Rome": "GB",
  "Europe/Madrid": "GB",
  "Europe/Lisbon": "GB",
  "Europe/Vienna": "GB",
  "Europe/Copenhagen": "GB",
  "Europe/Stockholm": "GB",
  "Europe/Helsinki": "GB",
  "Europe/Oslo": "GB",
  "Europe/Zurich": "GB",
  "Atlantic/Reykjavik": "GB",
  "Europe/Warsaw": "GB",
  "Europe/Prague": "GB",
  "Europe/Athens": "GB",
  "Europe/Budapest": "GB",
  "Europe/Bratislava": "GB",
  "Europe/Ljubljana": "GB",
  "Europe/Zagreb": "GB",
  "Europe/Tallinn": "GB",
  "Europe/Riga": "GB",
  "Europe/Vilnius": "GB",
  "Europe/Bucharest": "GB",
  "Europe/Sofia": "GB",
  "Asia/Nicosia": "GB",
  "Europe/Malta": "GB",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Pacific/Auckland": "AU",
  "Asia/Tokyo": "AU",
  "Asia/Singapore": "AU",
  "Asia/Hong_Kong": "AU",
  "Asia/Seoul": "AU",
  "Asia/Taipei": "AU",
  "Asia/Bangkok": "AU",
  "Asia/Kuala_Lumpur": "AU",
  "Asia/Jerusalem": "AU",
  "Asia/Dubai": "AU",
  "Asia/Riyadh": "AU",
  "America/Mexico_City": "AU",
  "America/Monterrey": "AU",
  "America/Sao_Paulo": "AU",
  "America/Argentina/Buenos_Aires": "AU",
  "America/Santiago": "AU",
  "America/Bogota": "AU",
  "Africa/Johannesburg": "AU",
  "Asia/Kolkata": "AU",
  "Asia/Calcutta": "AU",
  "Asia/Manila": "AU",
};

const TIER_TO_VALUE: Record<string, string> = {
  US: "US",
  CA: "CA",
  EU_UK: "GB",
  AU_ROW: "AU",
};

function detectRegion(): string {
  if (typeof window === "undefined") return "US";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const val = TZ_TIER[tz];
    if (val) return val;
  } catch {}
  try {
    const parts = (navigator.language ?? "").split("-");
    if (parts.length >= 2) {
      const region = parts[parts.length - 1].toUpperCase();
      const tier = tierForCountryCode(region);
      if (tier) return TIER_TO_VALUE[tier] ?? "US";
    }
  } catch {}
  return "US";
}

export default function CheckoutPage() {
  const { lines, subtotalCents, itemCount, remove } = useCart();
  const photos = getAllPhotos();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>(detectRegion);

  // Fire one funnel event per checkout-page view, with cart snapshot so
  // the Vercel Analytics funnel can compare "entered checkout" to "paid".
  useEffect(() => {
    if (lines.length === 0) return;
    track("checkout_view", { item_count: lines.length, subtotal_cents: subtotalCents });
    // Empty dep array is intentional: we want one event per visit to the
    // page, not one per cart mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function proceed() {
    if (pending || lines.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, country }),
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
  // Display total excludes shipping — Stripe's hosted checkout adds
  // shipping as its own line after the customer confirms their address.
  // Showing shipping here then having Stripe show it again was confusing.
  const totalCents = subtotalCents + processingFeeCents;

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

        <div className="space-y-2">
          <label htmlFor="ship-to-country" className="label-caps block">
            Ship to
          </label>
          <select
            id="ship-to-country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={pending}
            className="w-full border border-ink-line bg-transparent px-4 py-3 text-base text-ink focus:border-ink focus:outline-none"
          >
            {REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-faint">
            Stripe collects your full address at the next step.
          </p>
        </div>

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
          <div className="flex justify-between text-ink-faint">
            <dt>Shipping</dt>
            <dd>Added at next step</dd>
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
            <span className="btn-ink-price">{formatUsd(totalCents)}</span>
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
