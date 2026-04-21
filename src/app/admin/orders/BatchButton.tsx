"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

type OrderPreview = {
  id: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  itemCount: number;
};

type BatchButtonProps = {
  paidOrdersCount: number;
  previewOrders: OrderPreview[];
  printerEmail: string | null;
};

function formatMoney(cents: number, currency: string): string {
  return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
}

export function BatchButton({ paidOrdersCount, previewOrders, printerEmail }: BatchButtonProps) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done" | "warning" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  const disabled = paidOrdersCount === 0;

  async function handleConfirm() {
    setStep("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/batch-dispatch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch dispatch failed");
      const delta = data.batched - previewOrders.length;
      const base = `Batched ${data.batched} order${data.batched === 1 ? "" : "s"}.`;
      const deltaNote =
        delta === 0
          ? ""
          : delta > 0
            ? ` (${delta} new since preview.)`
            : ` (${-delta} fewer since preview — likely another admin or status change.)`;

      // Truthful printer-email status. The server returns
      // `printerEmailResolved` + `printerEmailSent` so the UI can stop
      // falsely claiming delivery on a silent dispatcher/Resend failure.
      const resolved = data.printerEmailResolved !== false;
      const sent = data.printerEmailSent !== false;
      let printerNote: string;
      let nextStep: "done" | "warning";
      if (!resolved) {
        nextStep = "warning";
        printerNote =
          " Printer email NOT sent — no printer email configured. Set one at /admin/settings, then hand off manually or re-run.";
      } else if (!sent) {
        nextStep = "warning";
        const reason = data.printerEmailError ? ` (${data.printerEmailError})` : "";
        printerNote = ` Printer email NOT sent${reason} — check alerts / Sentry and hand off manually or retry.`;
      } else {
        nextStep = "done";
        printerNote = " Printer email delivered.";
      }

      setStep(nextStep);
      setMessage(base + deltaNote + printerNote);
    } catch (err) {
      setStep("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
      Sentry.captureException(err, {
        tags: { surface: "admin", action: "batch-dispatch" },
      });
    }
  }

  if (step === "done" || step === "warning" || step === "error") {
    // Colour key:
    //   done    → green (all good)
    //   warning → amber (batched OK, printer email did NOT go through)
    //   error   → red (the API call itself failed)
    const palette =
      step === "error"
        ? { bg: "#fee2e2", fg: "#7f1d1d" }
        : step === "warning"
          ? { bg: "#fef3c7", fg: "#78350f" }
          : { bg: "#dcfce7", fg: "#14532d" };
    return (
      <p
        style={{
          marginTop: 0,
          padding: "8px 12px",
          borderRadius: 4,
          fontSize: 14,
          backgroundColor: palette.bg,
          color: palette.fg,
        }}
      >
        {message}
      </p>
    );
  }

  if (step === "confirm" || step === "loading") {
    const total = previewOrders.reduce((sum, o) => sum + o.totalCents, 0);
    const currency = previewOrders[0]?.currency ?? "usd";
    return (
      <div
        style={{
          border: "1px solid var(--ink-line, #e5e7eb)",
          borderRadius: 6,
          padding: 16,
          background: "#fff",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          Confirm batch — {previewOrders.length} order{previewOrders.length === 1 ? "" : "s"}
        </h3>

        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b7280" }}>
              <th style={{ padding: "4px 8px 4px 0" }}>Ref</th>
              <th style={{ padding: "4px 8px 4px 0" }}>Customer</th>
              <th style={{ padding: "4px 8px 4px 0" }}>Items</th>
              <th style={{ padding: "4px 0", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {previewOrders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: "6px 8px 6px 0", fontFamily: "ui-monospace, monospace" }}>
                  {o.id.slice(0, 8)}
                </td>
                <td style={{ padding: "6px 8px 6px 0" }}>
                  {o.customerName || "(no name)"}
                  <br />
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    {o.customerEmail || "(no email)"}
                  </span>
                </td>
                <td style={{ padding: "6px 8px 6px 0" }}>{o.itemCount}</td>
                <td style={{ padding: "6px 0", textAlign: "right" }}>
                  {formatMoney(o.totalCents, o.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid #e5e7eb", fontWeight: 600 }}>
              <td colSpan={3} style={{ padding: "8px 0" }}>
                Total
              </td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>
                {formatMoney(total, currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            lineHeight: 1.5,
            background: "#f9fafb",
            padding: "10px 12px",
            borderRadius: 4,
          }}
        >
          <strong style={{ color: "#374151" }}>What happens on confirm:</strong>
          <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>
              {previewOrders.length} order{previewOrders.length === 1 ? "" : "s"} flip{" "}
              <code>paid → queued_for_print</code>.
            </li>
            <li>
              {printerEmail ? (
                <>
                  Batch email sent to <strong>{printerEmail}</strong>.
                </>
              ) : (
                <span style={{ color: "#b45309" }}>
                  No printer email set. Configure it at{" "}
                  <a
                    href="/admin/settings"
                    style={{ color: "#b45309", textDecoration: "underline" }}
                  >
                    /admin/settings
                  </a>
                  .
                </span>
              )}
            </li>
            <li>Hai gets a Telegram + email &ldquo;batch ready&rdquo; alert.</li>
          </ol>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={step === "loading"}
            style={{
              fontFamily: "Favorit, sans-serif",
              backgroundColor: "#0072BB",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "10px 20px",
              fontSize: 14,
              cursor: step === "loading" ? "not-allowed" : "pointer",
              opacity: step === "loading" ? 0.5 : 1,
            }}
          >
            {step === "loading" ? "Sending…" : "Confirm and send batch"}
          </button>
          <button
            type="button"
            onClick={() => setStep("idle")}
            disabled={step === "loading"}
            style={{
              fontFamily: "Favorit, sans-serif",
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              padding: "10px 20px",
              fontSize: 14,
              cursor: step === "loading" ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep("confirm")}
      disabled={disabled}
      style={{
        fontFamily: "Favorit, sans-serif",
        backgroundColor: "#0072BB",
        color: "white",
        border: "none",
        borderRadius: 4,
        padding: "10px 24px",
        fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      Review batch
    </button>
  );
}
