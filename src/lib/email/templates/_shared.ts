/**
 * Shared constants + helpers for all email templates.
 *
 * Kept separate from `send.ts` so templates remain pure presentation and can
 * be rendered by @react-email/render with no runtime.
 */

import type { Order } from "@/lib/types";

export const fontFamily =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", system-ui, sans-serif';

export const serifFamily = 'Georgia, "Times New Roman", Times, serif';

export const colors = {
  bg: "#faf9f6",
  ink: "rgba(12, 11, 10, 1)",
  inkSoft: "rgba(12, 11, 10, 0.7)",
  inkFaint: "rgba(12, 11, 10, 0.45)",
  rule: "rgba(12, 11, 10, 0.15)",
  blue: "#0072BB",
  white: "#ffffff",
} as const;

export const baseTextStyle = {
  color: colors.ink,
  fontFamily,
  fontWeight: 400 as const,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: 0,
} as const;

export const labelStyle = {
  ...baseTextStyle,
  color: colors.inkFaint,
  marginBottom: 8,
  textTransform: "uppercase" as const,
  fontSize: "10px",
  letterSpacing: "0.1em",
  fontWeight: 600 as const,
};

export const serifStyle = {
  fontFamily: serifFamily,
  fontWeight: 400 as const,
  fontStyle: "italic" as const,
  color: colors.ink,
};

/**
 * Render a customer-facing order reference like `TB-2026-0418`.
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
    return `$${(cents / 100).toFixed(2)} ${currencyUpper}`;
  }
}
