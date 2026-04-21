"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const VISIBLE_MS = 2200;
const FADE_MS = 220;

/**
 * Watches cart.addedAt for a tick, then shows a bottom-center pill for
 * ~2.2s announcing the add. Clicking the toast opens the cart drawer.
 */
export default function Toast() {
  const { addedAt, openDrawer } = useCart();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fires when the cart emits an add event. Sync setState below is the
  // point - we're reacting to an external signal to trigger a one-shot
  // enter animation. See CartDrawer for the same pattern.
  useEffect(() => {
    if (!addedAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const enter = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    const hide = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    const unmount = window.setTimeout(() => setMounted(false), VISIBLE_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(hide);
      window.clearTimeout(unmount);
    };
  }, [addedAt]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="fixed left-1/2 z-[65] flex items-center gap-3 border border-ink bg-bg px-4 py-2 text-xs text-ink-strong"
      style={{
        bottom: "24px",
        transform: `translateX(-50%) translateY(${visible ? "0" : "12px"})`,
        opacity: visible ? 1 : 0,
        transition: `transform ${FADE_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${FADE_MS}ms ease-out`,
        boxShadow: "0 8px 20px -6px rgba(0, 0, 0, 0.18)",
      }}
      aria-live="polite"
    >
      <span>Added to cart</span>
      <span className="text-ink-faint">View →</span>
    </button>
  );
}
