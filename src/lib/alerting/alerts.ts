import type { Alert } from "./types";

export function orderCompletedAlert(
  orderId: string,
  customerName: string,
  editionInfo: string
): Alert {
  return {
    type: "order_completed",
    severity: "info",
    title: "New order completed",
    whatHappened: `Order ${orderId} placed by ${customerName}. ${editionInfo}`,
    autoHandled: "Payment processed, edition assigned, confirmation email sent.",
    actionRequired: false,
    actionInstructions: "None — order is in the print queue.",
    timestamp: new Date().toISOString(),
    metadata: { orderId, customerName },
  };
}

export function editionSoldOutAlert(photoTitle: string, photoSlug: string): Alert {
  return {
    type: "edition_sold_out",
    severity: "critical",
    title: `Edition sold out: ${photoTitle}`,
    whatHappened: `All 10 editions of "${photoTitle}" (${photoSlug}) have been sold.`,
    autoHandled: "Photo automatically marked as unavailable on storefront.",
    actionRequired: false,
    actionInstructions:
      "None — auto-removed from storefront. Review in admin if you want to reopen.",
    timestamp: new Date().toISOString(),
    metadata: { photoSlug, photoTitle },
  };
}

export function editionLowStockAlert(
  photoTitle: string,
  photoSlug: string,
  remaining: number
): Alert {
  return {
    type: "edition_low_stock",
    severity: "warning",
    title: `Low stock: ${photoTitle}`,
    whatHappened: `Only ${remaining} edition(s) remaining for "${photoTitle}" (${photoSlug}).`,
    autoHandled: "Nothing — still available for purchase.",
    actionRequired: false,
    actionInstructions: "Heads up only. No action needed unless you want to hold stock.",
    timestamp: new Date().toISOString(),
    metadata: { photoSlug, photoTitle, remaining },
  };
}

export function webhookRetryAlert(sessionId: string, attempt: number, error: string): Alert {
  return {
    type: "webhook_retry",
    severity: attempt >= 3 ? "critical" : "warning",
    title: `Webhook retry #${attempt}`,
    whatHappened: `Stripe webhook for session ${sessionId} failed. Attempt ${attempt}. Error: ${error}`,
    autoHandled: attempt < 3 ? "Stripe will auto-retry." : "Max retries reached.",
    actionRequired: attempt >= 3,
    actionInstructions:
      attempt >= 3
        ? "Check Stripe Dashboard > Webhooks for the failed event. May need manual order creation."
        : "None unless you see retry #3.",
    timestamp: new Date().toISOString(),
    metadata: { sessionId, attempt, error },
  };
}

export function paymentFailedAlert(
  sessionId: string,
  customerEmail: string,
  reason: string
): Alert {
  return {
    type: "payment_failed",
    severity: "critical",
    title: "Payment failed",
    whatHappened: `Payment failed for session ${sessionId} (${customerEmail}). Reason: ${reason}`,
    autoHandled: "Customer was shown an error and can retry. No edition was assigned.",
    actionRequired: false,
    actionInstructions: "None — customer can retry. Check if this becomes a pattern.",
    timestamp: new Date().toISOString(),
    metadata: { sessionId, customerEmail, reason },
  };
}

export function batchReadyAlert(orderCount: number, orderIds: string[]): Alert {
  return {
    type: "batch_ready",
    severity: "info",
    title: `Weekly batch ready: ${orderCount} orders`,
    whatHappened: `${orderCount} paid orders are ready to batch for the printer.`,
    autoHandled: "Nothing yet — waiting for your approval to send to printer.",
    actionRequired: true,
    actionInstructions:
      "Go to Admin > Orders and click 'Send batch to printer' to dispatch this week's orders.",
    timestamp: new Date().toISOString(),
    metadata: { orderCount, orderIds },
  };
}

export function systemErrorAlert(context: string, error: string): Alert {
  return {
    type: "system_error",
    severity: "critical",
    title: "System error",
    whatHappened: `Unexpected error in ${context}: ${error}`,
    autoHandled: "Error was logged. Operation may have partially completed.",
    actionRequired: true,
    actionInstructions:
      "Investigate immediately. Check Vercel logs and Supabase for data consistency.",
    timestamp: new Date().toISOString(),
    metadata: { context, error },
  };
}
