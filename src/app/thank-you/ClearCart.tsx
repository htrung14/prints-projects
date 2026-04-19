"use client";

/**
 * Client child of /thank-you. Clears the cart once on mount.
 *
 * The thank-you page is a server component (so it can be linked directly
 * from Stripe's success_url and render without client JS), and cart state
 * lives in localStorage via `useCart()`. We isolate the cart-clear into its
 * own small client component so the parent can stay RSC.
 */

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";

export default function ClearCart() {
  const { clear, lines } = useCart();
  // Guard against StrictMode double-invocation in dev and against the effect
  // re-running when `clear` changes identity. We only want to clear once per
  // landing on the page - subsequent adds (unlikely here) are fine.
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    if (lines.length === 0) {
      cleared.current = true;
      return;
    }
    clear();
    cleared.current = true;
  }, [clear, lines.length]);

  return null;
}
