"use client";

/**
 * Client-interactive table for the batch dispatch page.
 *
 * Lets the printer fill per-row tracking, optionally apply a single carrier/tracking
 * across all empty rows, and submit every row in one round-trip to
 * /api/dispatch/batch.
 */

import { useMemo, useState } from "react";
import type { Address, OrderStatus } from "@/lib/types";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"] as const;
type Carrier = (typeof CARRIERS)[number];

type Row = {
  orderId: string;
  shortId: string;
  customerName: string;
  shippingAddress: Address;
  itemCount: number;
  itemSummary: string;
  status: OrderStatus;
  initialCarrier: string | null;
  initialTrackingNumber: string | null;
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
    result: row.status === "shipped" && row.initialTrackingNumber ? "ok" : "idle",
  };
}

export function BatchTrackingTable({ token, rows }: Props) {
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(rows.map((r) => [r.orderId, initialRowState(r)]))
  );
  const [applyCarrier, setApplyCarrier] = useState<Carrier>("USPS");
  const [applyTracking, setApplyTracking] = useState("");
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

  function onApplyToAll() {
    const trimmed = applyTracking.trim();
    if (!trimmed) return;
    setState((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        const cur = next[row.orderId];
        if (!cur.tracking.trim()) {
          next[row.orderId] = {
            ...cur,
            carrier: applyCarrier,
            tracking: trimmed,
          };
        }
      }
      return next;
    });
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
        className="flex flex-wrap items-end gap-4 border-t border-b border-ink-line py-4"
        style={{ color: "rgba(0,0,0,0.78)" }}
      >
        <label className="flex flex-col gap-1">
          <span className="label-caps">Carrier for all</span>
          <select
            value={applyCarrier}
            onChange={(e) => setApplyCarrier(e.target.value as Carrier)}
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
          <span className="label-caps">Same tracking # for all</span>
          <input
            type="text"
            value={applyTracking}
            onChange={(e) => setApplyTracking(e.target.value)}
            disabled={submitting}
            autoComplete="off"
            className="text-sm"
            style={{ ...inputStyle, minWidth: 240 }}
          />
        </label>
        <button
          type="button"
          onClick={onApplyToAll}
          disabled={submitting || !applyTracking.trim()}
          className="btn-ghost is-secondary"
          style={{ padding: "8px 18px", fontSize: 14 }}
        >
          Apply to all empty rows
        </button>
        <span className="text-sm" style={{ color: "rgba(0,0,0,0.5)", marginLeft: "auto" }}>
          {pendingCount} without tracking
        </span>
      </div>

      <ul className="flex flex-col gap-6">
        {rows.map((row) => {
          const s = state[row.orderId];
          return (
            <li
              key={row.orderId}
              className="grid gap-4 border-b border-ink-line pb-6 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {row.shortId}
                  </span>
                  <span style={{ color: "rgba(0,0,0,0.95)" }}>{row.customerName}</span>
                  <StatusPill status={row.status} />
                  <span className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                    {row.itemCount} item{row.itemCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-1 text-sm" style={{ color: "rgba(0,0,0,0.78)" }}>
                  {row.itemSummary || "-"}
                </div>
                <div className="mt-2 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                  {row.shippingAddress.line1}
                  {row.shippingAddress.line2 ? `, ${row.shippingAddress.line2}` : ""} ·{" "}
                  {row.shippingAddress.city}
                  {row.shippingAddress.state ? `, ${row.shippingAddress.state}` : ""}{" "}
                  {row.shippingAddress.postalCode} · {row.shippingAddress.country}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <a
                    className="text-sm"
                    style={{
                      color: "rgba(0,0,0,0.78)",
                      textDecoration: "underline",
                    }}
                    href={`/dispatch/${row.orderId}?token=${token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open full order →
                  </a>
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
          className="btn-ghost"
          style={{ padding: "10px 22px", fontSize: "0.95rem" }}
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

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className="label-caps"
      style={{
        border: "1px solid rgba(0,0,0,0.18)",
        padding: "2px 8px",
        color: "rgba(0,0,0,0.78)",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const inputStyle = {
  border: "1px solid rgba(0,0,0,0.18)",
  background: "#ffffff",
  padding: "8px 10px",
  fontWeight: 900,
  color: "rgba(0,0,0,0.78)",
} as const;

function isCarrier(value: string | null): value is Carrier {
  return value !== null && (CARRIERS as readonly string[]).includes(value);
}
