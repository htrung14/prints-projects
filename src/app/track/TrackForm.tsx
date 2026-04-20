"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    router.push(`/track?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
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
