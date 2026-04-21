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
import * as Sentry from "@sentry/nextjs";
import type { OrderStatus } from "@/lib/types";

const STATUS_ORDER: OrderStatus[] = [
  "paid",
  "queued_for_print",
  "sent_to_print",
  "printed",
  "shipped",
  "delivered",
];

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
  const [reprintOpen, setReprintOpen] = useState(false);
  const [reprintReason, setReprintReason] = useState("");

  type PostResult = { ok: true; data: Record<string, unknown> } | { ok: false };

  async function post(
    path: string,
    body?: unknown,
    opts?: { successText?: string | ((data: Record<string, unknown>) => string) }
  ): Promise<PostResult> {
    setMsg(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        // Server errors may come back as JSON ({ error }) or plain text.
        const text = await res.text();
        let errText = text;
        try {
          const parsed = JSON.parse(text) as { error?: unknown };
          if (parsed && typeof parsed.error === "string") errText = parsed.error;
        } catch {
          // plain-text fallback is already assigned
        }
        setMsg({ kind: "err", text: errText || `Request failed: ${res.status}` });
        return { ok: false };
      }
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        // Some endpoints return empty bodies on success; that's fine.
      }
      const successText =
        typeof opts?.successText === "function"
          ? opts.successText(data)
          : (opts?.successText ?? "Done.");
      setMsg({ kind: "ok", text: successText });
      return { ok: true, data };
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Unknown error.",
      });
      Sentry.captureException(e, {
        tags: { surface: "admin", action: "admin-action" },
      });
      return { ok: false };
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
      const result = await post(`/api/admin/orders/${orderId}/transition`, payload);
      if (result.ok) router.refresh();
    });
  }

  function handleRegenerateToken() {
    startTransition(async () => {
      const result = await post(`/api/admin/orders/${orderId}/regenerate-token`);
      if (result.ok) router.refresh();
    });
  }

  function handleRevokeToken() {
    const confirmed = window.confirm(
      "Revoke the fulfillment token? The printer's dispatch link will stop working until a new one is generated."
    );
    if (!confirmed) return;
    startTransition(async () => {
      const result = await post(`/api/admin/orders/${orderId}/revoke-token`);
      if (result.ok) router.refresh();
    });
  }

  function handleResendConfirmation() {
    startTransition(async () => {
      const result = await post(`/api/email/retry/${orderId}?kind=confirmation`, undefined, {
        successText: (data) => {
          const to = typeof data.to === "string" && data.to.length > 0 ? data.to : null;
          return to ? `Confirmation email resent to ${to}.` : "Confirmation email resent.";
        },
      });
      if (result.ok) router.refresh();
    });
  }

  function handleReprintSubmit() {
    const reason = reprintReason.trim();
    if (reason.length === 0) {
      setMsg({ kind: "err", text: "Reason is required." });
      return;
    }
    if (reason.length > 200) {
      setMsg({ kind: "err", text: "Reason is too long (max 200 chars)." });
      return;
    }
    startTransition(async () => {
      const result = await post(
        `/api/admin/orders/${orderId}/reprint`,
        { reason },
        {
          successText: (data) => {
            const ref =
              typeof data.newOrderRef === "string" && data.newOrderRef.length > 0
                ? data.newOrderRef
                : typeof data.newOrderId === "string"
                  ? data.newOrderId.slice(0, 8).toUpperCase()
                  : "";
            return ref
              ? `Reprint created. Order ${ref} is queued for the next batch.`
              : "Reprint created. Queued for the next batch.";
          },
        }
      );
      if (result.ok) {
        setReprintOpen(false);
        setReprintReason("");
        router.refresh();
      }
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
            : "Regenerating invalidates the printer's existing dispatch link and re-sends the print-job email with a fresh one."}
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

      <section className="flex flex-col gap-3">
        <h2 className="label-caps">Reprint / reship</h2>
        <p className="text-sm text-ink-faint">
          Clone this order as a new free reprint. It starts as &ldquo;paid&rdquo; and sweeps through
          the next batch dispatch. Use for damage, lost-in-transit, or reship.
        </p>
        {!reprintOpen ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setMsg(null);
                setReprintOpen(true);
              }}
              className="border border-ink-line px-3 py-1.5 text-sm hover:bg-bg-soft disabled:opacity-50"
            >
              Create reprint
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-ink-faint">
                Why? Damage on arrival, lost in transit, etc. Max 200 chars.
              </span>
              <textarea
                value={reprintReason}
                onChange={(e) => setReprintReason(e.target.value)}
                maxLength={200}
                rows={3}
                className="border border-ink-line bg-transparent p-2 text-ink-strong outline-none focus:border-ink-strong"
                placeholder="Customer reports front-left corner creased in shipping."
              />
              <span className="self-end text-xs text-ink-faint">
                {reprintReason.trim().length}/200
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending || reprintReason.trim().length === 0}
                onClick={handleReprintSubmit}
                className="border border-ink-line px-3 py-1.5 text-sm hover:bg-bg-soft disabled:opacity-50"
              >
                Confirm reprint
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setReprintOpen(false);
                  setReprintReason("");
                }}
                className="px-3 py-1.5 text-sm underline underline-offset-4 text-ink-faint hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
