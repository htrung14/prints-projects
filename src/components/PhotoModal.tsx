"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, type ReactNode } from "react";

/**
 * Full-bleed panel over the catalog — matches the Cargo detail-panel
 * pattern. Click the Close control or press Escape to close; closing
 * calls router.back() so browser back also dismisses cleanly.
 */
export default function PhotoModal({ children }: { children: ReactNode }) {
  const router = useRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-[var(--bg)]"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative min-h-full">{children}</div>
    </div>
  );
}
