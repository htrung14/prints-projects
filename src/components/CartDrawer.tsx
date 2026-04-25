"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { getAllPhotos } from "@/lib/photos";
import { useSaved } from "@/hooks/useSaved";
import { formatUsd, priceCents } from "@/lib/pricing";
import type { PaperType } from "@/lib/types";

const ENTER_MS = 260;
const EXIT_MS = 200;

export default function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, remove, add, subtotalCents } = useCart();
  const photos = getAllPhotos();
  const { savedSlugs, toggleSave } = useSaved();

  const cartSlugs = new Set(lines.map((l) => l.photoSlug));
  const savedPhotos = savedSlugs
    .filter((slug) => !cartSlugs.has(slug))
    .map((slug) => photos.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => p != null && p.isPublished !== false);

  // `mounted` controls DOM presence; `visible` controls transform/opacity.
  // When drawerOpen flips false we set visible=false and keep the node
  // mounted for EXIT_MS so the slide-out animation actually runs.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Mount/unmount driver keyed on the external `drawerOpen` signal.
  // Setting local state synchronously here is intentional: we derive
  // `mounted` + `visible` from an external source so we can animate
  // before unmounting. The rule treats all sync setState in effects
  // as an anti-pattern, which doesn't apply to enter/exit animation.
  useEffect(() => {
    if (drawerOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeDrawer}
        className="absolute inset-0 bg-black"
        style={{
          opacity: visible ? 0.3 : 0,
          transition: `opacity ${visible ? ENTER_MS : EXIT_MS}ms ease-out`,
        }}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-ink-line bg-bg p-6"
        aria-label="Cart"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${visible ? ENTER_MS : EXIT_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      >
        <div className="flex items-center justify-between border-b border-ink-line pb-3">
          <span className="text-[13px] tracking-[0.06em] font-normal text-ink-strong uppercase">
            Cart
          </span>
          <button onClick={closeDrawer} className="text-[12px] text-ink-faint tracking-[0.04em]">
            Close ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="mt-6 text-ink-faint">Your cart is empty.</p>
        ) : (
          <ul className="flex-1 divide-y divide-ink-line overflow-y-auto">
            {lines.map((line, i) => {
              const photo = photos.find((p) => p.slug === line.photoSlug);
              if (!photo) return null;
              const size = photo.sizes.find((s) => s.id === line.sizeId);
              const paper = photo.papers.find((p) => p.id === (line.paperId as PaperType));
              const linePrice = priceCents(photo, line.sizeId, line.paperId as PaperType);
              return (
                <li key={i} className="flex gap-3 py-4">
                  <img
                    src={photo.imageUrl}
                    alt={photo.imageAlt}
                    className="h-20 w-20 object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-[3px] leading-snug">
                    <span
                      className="font-serif italic text-ink-strong"
                      style={{ fontSize: 15, fontWeight: 500 }}
                    >
                      {photo.title}
                      {photo.titleItalic ? (
                        <>
                          {", "}
                          <em>{photo.titleItalic}</em>
                        </>
                      ) : null}
                    </span>
                    <span
                      className="tracking-[0.01em] text-ink"
                      style={{ fontSize: 12, fontWeight: 400 }}
                    >
                      {size?.label} · {paper?.name}
                    </span>
                    <span
                      className="tracking-[0.01em] text-ink-faint"
                      style={{ fontSize: 12, fontWeight: 400 }}
                    >
                      Qty {line.quantity}
                    </span>
                    <button
                      onClick={() => remove(i)}
                      className="mt-1 self-start text-ink underline"
                      style={{ fontSize: 12, fontWeight: 400 }}
                    >
                      Remove
                    </button>
                  </div>
                  <span
                    className="font-mono text-ink"
                    style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatUsd(linePrice * line.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {savedPhotos.length > 0 && (
          <div className="border-t border-ink-line pt-4">
            <span className="text-[11px] tracking-[0.08em] uppercase text-ink-faint">Saved</span>
            <ul className="mt-2 flex flex-col gap-2">
              {savedPhotos.map((photo) => (
                <li key={photo.slug} className="flex items-center gap-3">
                  <img
                    src={photo.imageUrl}
                    alt={photo.imageAlt}
                    className="h-12 w-12 object-cover"
                  />
                  <span
                    className="flex-1 font-serif italic text-ink-strong"
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {photo.title}
                  </span>
                  <button
                    onClick={() => {
                      add({
                        photoSlug: photo.slug,
                        sizeId: photo.sizes[0].id,
                        paperId: photo.papers[0].id as PaperType,
                        quantity: 1,
                      });
                      toggleSave(photo.slug);
                    }}
                    className="text-ink underline"
                    style={{ fontSize: 12 }}
                  >
                    Add to cart
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 border-t border-ink-line pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="tracking-[0.04em]"
              style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}
            >
              Subtotal
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatUsd(subtotalCents)}
            </span>
          </div>
          <p
            className="mb-3 text-ink-faint"
            style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.5 }}
          >
            Shipping calculated at checkout.
          </p>
          <Link
            href="/checkout"
            onClick={closeDrawer}
            className={`btn-ink ${lines.length === 0 ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={lines.length === 0}
          >
            <span>Checkout</span>
            <span className="btn-ink-price">{formatUsd(subtotalCents)}</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
