"use client";

/**
 * Client actions for the order detail page.
 *
 * Status transitions, token regenerate/revoke, resend order confirmation.
 * (Print-job re-send is handled by "Regenerate + resend" in the token
 * section — that flow mints a fresh dispatch URL and emails it atomically.)
 * All POST to admin-gated API routes that re-check the session.
 * Backward transitions require a confirm dialog per the Track E spec.
 *
 * Visual rhythm follows the rest of the app: underline-only affordances,
 * 1px ink-line borders, no pills.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/types";

const STATUS_ORDER: OrderStatus[] = ["paid", "sent_to_print", "printed", "shipped", "delivered"];

const TERMINAL: OrderStatus[] = ["refunded", "cancelled"];

function statusIndex(s: OrderStatus): number {
  return STATUS_ORDER.indexOf(s);
}

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  trackingNumber: string | null;
  carrier: string | null;
  hasRevokedToken: boolean;
};

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function OrderActions({
  orderId,
  currentStatus,
  trackingNumber,
  carrier,
  hasRevokedToken,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [carrierInput, setCarrierInput] = useState(carrier ?? "");

  async function post(path: string, body?: unknown): Promise<boolean> {
    setMsg(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        setMsg({ kind: "err", text: text || `Request failed: ${res.status}` });
        return false;
      }
      setMsg({ kind: "ok", text: "Done." });
      return true;
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Unknown error.",
      });
      return false;
    }
  }

  function handleTransition(to: OrderStatus) {
    const currIdx = statusIndex(currentStatus);
    const nextIdx = statusIndex(to);
    const isBackward = currIdx !== -1 && nextIdx !== -1 && nextIdx < currIdx;

    if (isBackward) {
      const ok = window.confirm(
        `Move order backward from "${currentStatus}" to "${to}"? This is rare and will be audited.`
      );
      if (!ok) return;
    }

    const payload: Record<string, unknown> = { to };
    if (to === "shipped") {
      if (tracking.trim().length === 0) {
        setMsg({
          kind: "err",
          text: "Tracking number is required to mark shipped.",
        });
        return;
      }
      payload.tracking = tracking.trim();
      if (carrierInput.trim().length > 0) payload.carrier = carrierInput.trim();
    }

    startTransition(async () => {
      const ok = await post(`/api/admin/orders/${orderId}/transition`, payload);
      if (ok) router.refresh();
    });
  }

  function handleRegenerateToken() {
    startTransition(async () => {
      const ok = await post(`/api/admin/orders/${orderId}/regenerate-token`);
      if (ok) router.refresh();
    });
  }

  function handleRevokeToken() {
    const ok = window.confirm(
      "Revoke the fulfillment token? The printer's dispatch link will stop working until a new one is generated."
    );
    if (!ok) return;
    startTransition(async () => {
      const ok = await post(`/api/admin/orders/${orderId}/revoke-token`);
      if (ok) router.refresh();
    });
  }

  function handleResendConfirmation() {
    startTransition(async () => {
      await post(`/api/email/retry/${orderId}?kind=confirmation`);
    });
  }

  const isTerminal = TERMINAL.includes(currentStatus);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Status</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-strong">Current: {currentStatus.replace(/_/g, " ")}</span>
        </div>
        {isTerminal ? (
          <p className="text-sm text-ink-faint">
            Order is {currentStatus}; no further transitions available here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.filter((s) => s !== currentStatus).map((s) => (
              <button
                key={s}
                type="button"
                disabled={isPending}
                onClick={() => handleTransition(s)}
                className="border border-ink-line px-3 py-1.5 text-sm text-ink hover:bg-bg-soft disabled:opacity-50"
              >
                → {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Shipping</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-ink-faint">Tracking number</span>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="border-b border-ink-line bg-transparent py-1.5 text-ink-strong outline-none focus:border-ink-strong"
              placeholder="9400..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-ink-faint">Carrier</span>
            <input
              type="text"
              value={carrierInput}
              onChange={(e) => setCarrierInput(e.target.value)}
              className="border-b border-ink-line bg-transparent py-1.5 text-ink-strong outline-none focus:border-ink-strong"
              placeholder="USPS, UPS, DHL..."
            />
          </label>
        </div>
        <p className="text-xs text-ink-faint">
          Tracking is saved when you transition to &ldquo;shipped&rdquo;.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Fulfillment token</h2>
        <p className="text-sm text-ink-faint">
          {hasRevokedToken
            ? "Token is currently revoked. Regenerate to issue a new dispatch link."
            : "Regenerating invalidates Rob's existing dispatch link and re-sends the print-job email with a fresh one."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRegenerateToken}
            className="border border-ink-line px-3 py-1.5 text-sm hover:bg-bg-soft disabled:opacity-50"
          >
            Regenerate + resend
          </button>
          {!hasRevokedToken ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleRevokeToken}
              className="border border-ink-line px-3 py-1.5 text-sm hover:bg-bg-soft disabled:opacity-50"
            >
              Revoke
            </button>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Email</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleResendConfirmation}
            className="border border-ink-line px-3 py-1.5 text-sm hover:bg-bg-soft disabled:opacity-50"
          >
            Resend confirmation
          </button>
        </div>
        <p className="text-xs text-ink-faint">
          To re-send the print-job email, use &ldquo;Regenerate + resend&rdquo; above — it issues a
          fresh dispatch link and emails it in one step.
        </p>
      </section>

      {msg ? (
        <p
          className="text-sm"
          style={
            msg.kind === "err"
              ? { color: "rgba(160, 0, 0, 0.85)" }
              : { color: "rgba(0, 100, 0, 0.85)" }
          }
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
