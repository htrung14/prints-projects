"use client";

/**
 * Client-interactive table for the batch dispatch page.
 *
 * Each row gets its own carrier + tracking inputs. Submit-all POSTs every
 * non-empty row to /api/dispatch/batch in one round trip; that route flips
 * every submitted order to `shipped` and fires customer emails.
 *
 * Carrier defaults to USPS per row; Michael can change it if he uses a
 * different carrier on a specific order. There's no "same tracking for all"
 * affordance — each package has its own number.
 */

import { useMemo, useState } from "react";
import type { Address } from "@/lib/types";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"] as const;
type Carrier = (typeof CARRIERS)[number];

export type BatchRowItem = {
  id: string;
  title: string;
  sizeLabel: string;
  editionNumber: number;
  editionTotal: number;
};

type Row = {
  orderId: string;
  shortId: string;
  customerName: string;
  shippingAddress: Address;
  items: BatchRowItem[];
  initialCarrier: string | null;
  initialTrackingNumber: string | null;
  reprintLabel: string | null;
};

type RowState = {
  carrier: Carrier;
  tracking: string;
  /** Per-row submit feedback after the batch POST. */
  result: "idle" | "ok" | "skip" | { error: string };
};

type Props = {
  token: string;
  rows: Row[];
};

function initialRowState(row: Row): RowState {
  return {
    carrier: isCarrier(row.initialCarrier) ? row.initialCarrier : "USPS",
    tracking: row.initialTrackingNumber ?? "",
    // Pre-mark rows that already have tracking persisted as "ok" so they
    // render with the success indicator without re-submitting.
    result: row.initialTrackingNumber ? "ok" : "idle",
  };
}

export function BatchTrackingTable({ token, rows }: Props) {
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(rows.map((r) => [r.orderId, initialRowState(r)]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<
    | { kind: "idle" }
    | { kind: "ok"; count: number; failures: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function updateRow(orderId: string, patch: Partial<RowState>) {
    setState((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], ...patch },
    }));
  }

  async function onSubmitAll() {
    const updates = rows
      .map((r) => {
        const s = state[r.orderId];
        return {
          orderId: r.orderId,
          carrier: s.carrier,
          trackingNumber: s.tracking.trim(),
        };
      })
      .filter((u) => u.trackingNumber.length > 0);

    if (updates.length === 0) {
      setBanner({
        kind: "error",
        message: "Fill at least one tracking number before submitting.",
      });
      return;
    }

    setSubmitting(true);
    setBanner({ kind: "idle" });
    try {
      const res = await fetch("/api/dispatch/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, updates }),
      });
      type ApiBatchResponse = {
        succeeded?: string[];
        failed?: Array<{ orderId: string; error: string }>;
      };
      let payload: ApiBatchResponse = {};
      try {
        payload = (await res.json()) as ApiBatchResponse;
      } catch {
        // ignore
      }
      if (!res.ok) {
        setBanner({
          kind: "error",
          message: `Request failed (${res.status}).`,
        });
        return;
      }
      const succeeded = payload.succeeded ?? [];
      const failed = payload.failed ?? [];

      setState((prev) => {
        const next = { ...prev };
        for (const id of succeeded) {
          if (next[id]) next[id] = { ...next[id], result: "ok" };
        }
        for (const f of failed) {
          if (next[f.orderId])
            next[f.orderId] = {
              ...next[f.orderId],
              result: { error: f.error },
            };
        }
        for (const r of rows) {
          if (!updates.find((u) => u.orderId === r.orderId)) {
            // Rows we didn't submit stay idle (unless previously shipped).
            if (next[r.orderId].result !== "ok") {
              next[r.orderId] = { ...next[r.orderId], result: "skip" };
            }
          }
        }
        return next;
      });
      setBanner({
        kind: "ok",
        count: succeeded.length,
        failures: failed.length,
      });
    } catch (err) {
      setBanner({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = useMemo(
    () => rows.filter((r) => !state[r.orderId].tracking.trim()).length,
    [rows, state]
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-baseline justify-between border-t border-b border-ink-line py-4"
        style={{ color: "rgba(0,0,0,0.78)" }}
      >
        <span className="label-caps">Tracking</span>
        <span style={{ color: "rgba(0,0,0,0.5)", fontSize: 15 }}>
          {pendingCount} without tracking
        </span>
      </div>

      <ul className="flex flex-col gap-10">
        {rows.map((row) => {
          const s = state[row.orderId];
          return (
            <li
              key={row.orderId}
              className="grid gap-6 border-b border-ink-line pb-10 md:grid-cols-[1fr_auto]"
            >
              <div>
                {row.reprintLabel ? (
                  <div
                    className="label-caps mb-1"
                    style={{
                      color: "var(--btn-accent)",
                      letterSpacing: "0.08em",
                      fontSize: 13,
                    }}
                  >
                    {row.reprintLabel}
                  </div>
                ) : null}
                <div
                  style={{
                    color: "rgba(0,0,0,0.5)",
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Order #{row.shortId.toUpperCase()}
                </div>
                <div
                  className="mt-2"
                  style={{ color: "rgba(0,0,0,0.95)", fontSize: 22, lineHeight: 1.2 }}
                >
                  {row.customerName}
                </div>
                <div
                  className="mt-2"
                  style={{ color: "rgba(0,0,0,0.6)", fontSize: 16, lineHeight: 1.5 }}
                >
                  {row.shippingAddress.line1}
                  {row.shippingAddress.line2 ? `, ${row.shippingAddress.line2}` : ""}
                  <br />
                  {row.shippingAddress.city}
                  {row.shippingAddress.state ? `, ${row.shippingAddress.state}` : ""}{" "}
                  {row.shippingAddress.postalCode} · {row.shippingAddress.country}
                </div>
                <ul
                  className="mt-4 flex flex-col gap-2"
                  style={{ color: "rgba(0,0,0,0.78)", fontSize: 17, lineHeight: 1.45 }}
                >
                  {row.items.length === 0 ? (
                    <li style={{ color: "rgba(0,0,0,0.5)" }}>—</li>
                  ) : (
                    row.items.map((item) => (
                      <li key={item.id}>
                        {item.title}{" "}
                        <span style={{ color: "rgba(0,0,0,0.55)", fontSize: 15 }}>
                          · Ed. {item.editionNumber}/{item.editionTotal}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="mt-3 flex flex-wrap gap-4">
                  <a
                    style={{
                      color: "rgba(0,0,0,0.78)",
                      textDecoration: "underline",
                      fontSize: 15,
                    }}
                    href={`/dispatch/${row.orderId}?token=${token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open order · print files →
                  </a>
                  {row.items.length > 0 ? (
                    <a
                      style={{
                        color: "rgba(0,0,0,0.78)",
                        textDecoration: "underline",
                        fontSize: 15,
                      }}
                      href={`/api/coa/${row.orderId}?token=${token}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.items.length > 1 ? "Download COAs" : "Download COA"}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="label-caps">Carrier</span>
                  <select
                    value={s.carrier}
                    onChange={(e) =>
                      updateRow(row.orderId, {
                        carrier: e.target.value as Carrier,
                      })
                    }
                    disabled={submitting}
                    className="text-sm"
                    style={inputStyle}
                  >
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label-caps">Tracking #</span>
                  <input
                    type="text"
                    value={s.tracking}
                    onChange={(e) => updateRow(row.orderId, { tracking: e.target.value })}
                    disabled={submitting}
                    autoComplete="off"
                    className="text-sm"
                    style={{ ...inputStyle, minWidth: 220 }}
                  />
                </label>
                <RowStatus result={s.result} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onSubmitAll}
          disabled={submitting}
          style={{
            background: "var(--btn-accent)",
            color: "#ffffff",
            textDecoration: "none",
            padding: "14px 26px",
            fontSize: 17,
            letterSpacing: "0.03em",
            borderRadius: 2,
            fontWeight: 900,
            border: "none",
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Submitting…" : "Submit all tracking"}
        </button>
        {banner.kind === "ok" ? (
          <span className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            {banner.count} updated
            {banner.failures > 0 ? `, ${banner.failures} failed` : ""}.
          </span>
        ) : null}
        {banner.kind === "error" ? (
          <span className="text-sm" role="alert" style={{ color: "rgba(150,0,0,0.85)" }}>
            {banner.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RowStatus({ result }: { result: RowState["result"] }) {
  if (result === "idle") return null;
  if (result === "ok") {
    return (
      <span className="label-caps" style={{ color: "rgba(0,100,0,0.85)", alignSelf: "center" }}>
        OK
      </span>
    );
  }
  if (result === "skip") {
    return (
      <span className="label-caps" style={{ color: "rgba(0,0,0,0.5)", alignSelf: "center" }}>
        Skipped
      </span>
    );
  }
  return (
    <span
      className="text-sm"
      role="alert"
      style={{
        color: "rgba(150,0,0,0.85)",
        alignSelf: "center",
        maxWidth: 180,
      }}
    >
      {result.error}
    </span>
  );
}

const inputStyle = {
  border: "1px solid rgba(0,0,0,0.18)",
  background: "#ffffff",
  padding: "10px 12px",
  fontSize: 15,
  fontWeight: 900,
  color: "rgba(0,0,0,0.78)",
} as const;

function isCarrier(value: string | null): value is Carrier {
  return value !== null && (CARRIERS as readonly string[]).includes(value);
}
