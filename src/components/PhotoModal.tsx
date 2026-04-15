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
 *   - Dismissal (Esc, backdrop click, Close button): runs the exit
 *     animation, then calls router.back() once it's done so the
 *     transition doesn't cut off when the route changes.
 *   - Body scroll is locked while open.
 */
export default function PhotoModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Enter: flip to open on next animation frame so the initial styles commit.
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Body scroll lock.
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

  // Esc to close.
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
        className="absolute inset-x-0 bottom-0 overflow-y-auto overscroll-contain bg-[var(--bg)]"
        style={{
          top: "48px",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          boxShadow: "0 -12px 32px -8px rgba(0, 0, 0, 0.18)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${open ? ENTER_DURATION_MS : EXIT_DURATION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
