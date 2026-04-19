/**
 * Shared constants + helpers for all email templates.
 *
 * Kept separate from `send.ts` so templates remain pure presentation and can
 * be rendered by @react-email/render with no runtime.
 */

import type { Order } from "@/lib/types";

// Email clients cannot reliably load a web font. We fall back to a universal
// system stack, bold everywhere to echo the Cargo reference's uniform weight.
export const fontFamily = 'Helvetica, Arial, "Liberation Sans", system-ui, sans-serif';

export const textColor = "rgba(0,0,0,0.6)";

export const baseTextStyle = {
  color: textColor,
  fontFamily,
  fontWeight: 900 as const,
  fontSize: "14px",
  lineHeight: "1.4",
  margin: 0,
} as const;

export const labelStyle = {
  ...baseTextStyle,
  marginBottom: 8,
  textTransform: "uppercase" as const,
  fontSize: "12px",
  letterSpacing: "0.04em",
};

/**
 * Render a customer-facing order reference like `TB-2026-0418`.
 *
 * Format: `TB-YYYY-NNNN`, YYYY from `order.createdAt`, NNNN from the last
 * four hex digits of the order UUID (lossy but deterministic and non-PII).
 *
 * When Track A later adds a sequential `order_number` column, swap this.
 */
export function formatOrderReference(order: Order): string {
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const year = Number.isFinite(created.getTime())
    ? created.getUTCFullYear()
    : new Date().getUTCFullYear();
  const tail = order.id
    .replace(/[^0-9a-f]/gi, "")
    .slice(-4)
    .toUpperCase();
  const seq = tail.length === 4 ? tail : tail.padStart(4, "0");
  return `TB-${year}-${seq}`;
}

export function formatUsdFromCents(cents: number, currency: string = "usd"): string {
  const currencyUpper = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyUpper,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    // Unknown currency code - fall back to USD formatting with suffix.
    return `$${(cents / 100).toFixed(2)} ${currencyUpper}`;
  }
}
