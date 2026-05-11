"use client";

/**
 * Tracking submission form for the single-order dispatch page.
 *
 * Client component - the whole dispatch page is rendered server-side, but
 * the form itself needs local state (pending, error, success) and uses
 * `fetch` so we can POST to the API route without a full page reload.
 */

import { useState, type FormEvent } from "react";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"] as const;
type Carrier = (typeof CARRIERS)[number];

type Props = {
  orderId: string;
  token: string;
  initialCarrier: string | null;
  initialTrackingNumber: string | null;
  initialNotes: string | null;
  submittedAt: string | null;
  endpoint?: string;
};

export function TrackingForm({
  orderId,
  token,
  initialCarrier,
  initialTrackingNumber,
  initialNotes,
  submittedAt,
  endpoint,
}: Props) {
  const [carrier, setCarrier] = useState<Carrier>(
    isCarrier(initialCarrier) ? initialCarrier : "USPS"
  );
  const [tracking, setTracking] = useState(initialTrackingNumber ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "pending" } | { kind: "ok" } | { kind: "error"; message: string }
  >(submittedAt ? { kind: "ok" } : { kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = tracking.trim();
    if (!trimmed) {
      setStatus({ kind: "error", message: "Tracking number is required." });
      return;
    }
    setStatus({ kind: "pending" });
    try {
      const res = await fetch(endpoint ?? `/api/dispatch/${orderId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          carrier,
          trackingNumber: trimmed,
          notes: notes.trim() ? notes.trim() : undefined,
        }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status}).`;
        try {
          const body: unknown = await res.json();
          if (
            typeof body === "object" &&
            body !== null &&
            typeof (body as { error?: unknown }).error === "string"
          ) {
            msg = (body as { error: string }).error;
          }
        } catch {
          // ignore
        }
        setStatus({ kind: "error", message: msg });
        return;
      }
      setStatus({ kind: "ok" });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    }
  }

  const pending = status.kind === "pending";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" style={{ color: "rgba(0,0,0,0.78)" }}>
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <label className="flex flex-col gap-1">
          <span className="label-caps">Carrier</span>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as Carrier)}
            disabled={pending}
            className="text-sm"
            style={{
              border: "1px solid rgba(0,0,0,0.18)",
              background: "#ffffff",
              padding: "8px 10px",
              fontWeight: 900,
              color: "rgba(0,0,0,0.78)",
            }}
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-caps">Tracking number</span>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            disabled={pending}
            autoComplete="off"
            className="text-sm"
            style={{
              border: "1px solid rgba(0,0,0,0.18)",
              background: "#ffffff",
              padding: "8px 10px",
              fontWeight: 900,
              color: "rgba(0,0,0,0.78)",
            }}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="label-caps">Internal notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending}
          rows={3}
          className="text-sm"
          style={{
            border: "1px solid rgba(0,0,0,0.18)",
            background: "#ffffff",
            padding: "8px 10px",
            fontWeight: 900,
            color: "rgba(0,0,0,0.78)",
            resize: "vertical",
          }}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-ghost"
          style={{ padding: "10px 22px", fontSize: "0.95rem" }}
        >
          {pending ? "Submitting…" : "Submit tracking"}
        </button>
        {status.kind === "ok" ? (
          <span className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            Tracking recorded. Customer has been notified.
          </span>
        ) : null}
        {status.kind === "error" ? (
          <span className="text-sm" role="alert" style={{ color: "rgba(150,0,0,0.85)" }}>
            {status.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function isCarrier(value: string | null): value is Carrier {
  return value !== null && (CARRIERS as readonly string[]).includes(value);
}
