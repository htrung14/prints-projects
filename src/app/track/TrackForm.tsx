"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REF_PATTERN } from "@/lib/orderRef";

export default function TrackForm({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    // If the input matches an 8-char hex order reference, submit as ?ref=,
    // otherwise treat it as an email lookup. The server validates both.
    if (REF_PATTERN.test(trimmed)) {
      router.push(`/track?ref=${encodeURIComponent(trimmed.toUpperCase())}`);
    } else {
      router.push(`/track?email=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        name="lookup"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="you@example.com or order ref (e.g. A1B2C3D4)"
        aria-label="Email or order reference"
        required
        autoComplete="off"
        className="flex-1 border border-ink-line bg-transparent px-4 py-3.5 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        className="whitespace-nowrap px-8 py-3.5 text-sm font-medium tracking-wider"
        style={{ background: "var(--btn-accent)", color: "#ffffff", letterSpacing: "0.04em" }}
      >
        Look up
      </button>
    </form>
  );
}
