/**
 * Shared layout for the printer-facing dispatch routes.
 *
 * The only reason this layout exists is to carry `robots: noindex, nofollow`
 * for every route under `/dispatch/*`. These pages are token-gated, but the
 * URLs include the customer's shipping address in rendered HTML, so a
 * forwarded signed URL that ends up in a crawlable inbox must not be indexed.
 *
 * Layout-level metadata applies to all child segments, so the single-order
 * page (`/dispatch/[orderId]`) and the weekly batch page (`/dispatch/batch`)
 * inherit it without each needing its own export.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
