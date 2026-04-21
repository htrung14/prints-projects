"use client";

/**
 * Client child of /thank-you. Fires a Vercel Analytics `purchase` event
 * once on mount so the funnel dashboard can close PDP → Cart → Checkout
 * → Purchase. Kept isolated from the server parent so we don't demote it.
 *
 * The event only fires when the page actually renders the success
 * branch — the server determines that upstream and omits this component
 * on the apology / missing-order branches, so no false positives.
 */

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

export default function TrackPurchase({
  orderRef,
  totalCents,
  currency,
}: {
  orderRef: string | null;
  totalCents: number;
  currency: string;
}) {
  // Guard against StrictMode double-invocation in dev.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track("purchase", {
      order_ref: orderRef ?? "unknown",
      total_cents: totalCents,
      currency,
    });
  }, [orderRef, totalCents, currency]);

  return null;
}
