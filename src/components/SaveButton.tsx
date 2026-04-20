"use client";

import { useSaved } from "@/hooks/useSaved";

export function SaveButton({ slug }: { slug: string }) {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave(slug);
      }}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 3,
        padding: 12,
        background: "none",
        border: "none",
        cursor: "pointer",
        opacity: saved ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
      className="group-hover:!opacity-100"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ color: "#fff", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
