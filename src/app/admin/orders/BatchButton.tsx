"use client";

import { useState } from "react";

type BatchButtonProps = {
  paidOrdersCount: number;
};

export function BatchButton({ paidOrdersCount }: BatchButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; isError: boolean } | null>(null);

  const disabled = paidOrdersCount === 0 || loading;

  async function handleClick() {
    if (disabled) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/batch-dispatch", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Batch dispatch failed");
      }

      setResult({ message: `Batched ${data.batched} orders.`, isError: false });
    } catch (err) {
      setResult({ message: err instanceof Error ? err.message : "Unknown error", isError: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
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
        {loading ? "Sending..." : "Send batch to printer"}
      </button>
      {result && (
        <p
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderRadius: 4,
            fontSize: 14,
            backgroundColor: result.isError ? "#fee2e2" : "#dcfce7",
            color: result.isError ? "#7f1d1d" : "#14532d",
          }}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
