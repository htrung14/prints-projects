"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialValue: string;
  envFallback: string | null;
};

export default function SettingsForm({ initialValue, envFallback }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialValue);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const isDirty = value.trim() !== initialValue.trim();
  const effective = value.trim() || envFallback || "(not set — no printer email will be sent)";

  async function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ print_shop_email: value.trim() || null }),
      });
      if (!res.ok) {
        const text = await res.text();
        setMsg({ kind: "err", text: text || `Save failed: ${res.status}` });
        return;
      }
      setMsg({ kind: "ok", text: "Saved." });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="label-caps">Printer email</h2>
      <p className="text-sm text-ink-faint">
        Where the weekly batch email goes. Change takes effect immediately for the next &ldquo;Send
        batch to printer&rdquo; action.
      </p>

      <label className="flex flex-col gap-2">
        <span className="text-xs text-ink-faint">Email address</span>
        <input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="rob@brooklynarchival.com"
          disabled={isPending}
          className="border-b border-ink-line bg-transparent py-2 text-ink-strong outline-none focus:border-ink-strong disabled:opacity-50"
        />
      </label>

      <p className="text-xs text-ink-faint">
        Effective: <span className="text-ink">{effective}</span>
        {!value.trim() && envFallback && (
          <>
            <br />
            <span>Using env fallback; save an empty string to force env.</span>
          </>
        )}
      </p>

      <div>
        <button
          type="button"
          disabled={isPending || !isDirty}
          onClick={save}
          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {msg && (
        <p
          className="text-sm"
          style={{ color: msg.kind === "err" ? "rgba(160,0,0,0.85)" : "rgba(0,100,0,0.85)" }}
        >
          {msg.text}
        </p>
      )}
    </section>
  );
}
