"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const ENTER_DURATION_MS = 280;
const EXIT_DURATION_MS = 220;

/**
 * Bottom-sheet overlay for the photo detail panel.
 *
 * Behavior:
 *   - Mounts off-screen at the bottom, animates up on first paint.
 *   - Backdrop fades in from 0 to a dim value, leaving a ~48px peek
 *     of the catalog at the top.
 *   - Sticky close bar at the top of the sheet with a small shadow so
 *     the dismiss control stays reachable while the content scrolls.
 *   - Dismissal (Esc, backdrop click, Close button): runs the exit
 *     animation, then calls router.back() once it's done so the
 *     transition doesn't cut off when the route changes.
 *   - Body scroll is locked while open.
 */
export default function PhotoModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => {
      router.back();
    }, EXIT_DURATION_MS);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      {/* Backdrop: dim the catalog visible above the sheet. */}
      <button
        type="button"
        aria-label="Close detail"
        onClick={close}
        className="absolute inset-0 bg-black"
        style={{
          opacity: open ? 0.35 : 0,
          transition: `opacity ${open ? ENTER_DURATION_MS : EXIT_DURATION_MS}ms ease-out`,
        }}
      />

      {/* Sheet: rounded top, slides up. Top offset leaves a peek of catalog. */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden bg-bg"
        style={{
          top: "48px",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          boxShadow: "0 -12px 32px -8px rgba(0, 0, 0, 0.18)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${open ? ENTER_DURATION_MS : EXIT_DURATION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      >
        {/* Sticky close bar: always visible while content scrolls. */}
        <div
          className="sticky top-0 z-10 flex items-center justify-end border-b border-ink-line px-6 py-3 md:px-8"
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "saturate(180%) blur(10px)",
            WebkitBackdropFilter: "saturate(180%) blur(10px)",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
          }}
        >
          <button type="button" onClick={close} aria-label="Close" className="text-ink-strong">
            Close ✕
          </button>
        </div>

        {/* Scroll container for the panel content. */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
