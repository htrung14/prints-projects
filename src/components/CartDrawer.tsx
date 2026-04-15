"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { getAllPhotos } from "@/lib/photos";
import { formatUsd, priceCents } from "@/lib/pricing";
import type { PaperType } from "@/lib/types";

export default function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, remove, subtotalCents } = useCart();
  const photos = getAllPhotos();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close cart"
        onClick={closeDrawer}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--ink-line)] bg-[var(--bg)] p-6"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b border-[var(--ink-line)] pb-3">
          <span className="text-[var(--ink-strong)]">Cart</span>
          <button onClick={closeDrawer}>Close ✕</button>
        </div>

        {lines.length === 0 ? (
          <p className="mt-6 text-[var(--ink-faint)]">Your cart is empty.</p>
        ) : (
          <ul className="flex-1 divide-y divide-[var(--ink-line)] overflow-y-auto">
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
                  <div className="flex flex-1 flex-col text-xs leading-snug">
                    <span className="text-[var(--ink-strong)]">
                      {photo.title}
                      {photo.titleItalic ? (
                        <>
                          {" "}
                          <em>{photo.titleItalic}</em>
                        </>
                      ) : null}
                    </span>
                    <span className="text-[var(--ink-faint)]">
                      {size?.label} · {paper?.name}
                    </span>
                    <span className="text-[var(--ink-faint)]">Qty {line.quantity}</span>
                    <button
                      onClick={() => remove(i)}
                      className="mt-1 self-start text-[var(--ink-faint)] underline"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="text-[var(--ink-strong)]">
                    {formatUsd(linePrice * line.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 border-t border-[var(--ink-line)] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span>Subtotal</span>
            <span className="text-[var(--ink-strong)]">{formatUsd(subtotalCents)}</span>
          </div>
          <p className="mb-3 text-[11px] text-[var(--ink-faint)]">
            Shipping calculated at checkout. Free US shipping on 2 prints or more.
          </p>
          <Link
            href="/checkout"
            onClick={closeDrawer}
            className={`block border px-4 py-2 text-center ${
              lines.length === 0
                ? "pointer-events-none border-[var(--ink-line)] text-[var(--ink-faint)]"
                : "border-[var(--ink)] text-[var(--ink-strong)]"
            }`}
          >
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
