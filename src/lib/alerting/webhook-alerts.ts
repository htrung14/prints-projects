import * as Sentry from "@sentry/nextjs";
import { serverClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";
import {
  editionLowStockAlert,
  editionSoldOutAlert,
  orderCompletedAlert,
  webhookRetryAlert,
} from "@/lib/alerting";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import type { Alert } from "@/lib/alerting/types";
import type { IAlertDispatcher } from "@/lib/alerting/triage";

// Wraps dispatcher.send so a triage/dispatch-layer rejection (distinct from
// per-channel failures which dispatch.ts already routes to Sentry) doesn't
// bubble up and abort the post-order bookkeeping. We never want an alerting
// outage to break order finalization.
async function safeSend(
  dispatcher: IAlertDispatcher,
  alert: Alert,
  context: string
): Promise<void> {
  try {
    await dispatcher.send(alert);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    try {
      Sentry.captureException(error, {
        tags: { pipeline: "alerting-webhook", context },
        extra: { alertTitle: alert.title, alertType: alert.type },
      });
    } catch {
      // Terminal sink — Sentry itself unavailable.
    }
    console.error(`[alerting] dispatcher.send failed (${context}):`, error.message);
  }
}

export async function alertAfterOrder(order: Order, items: OrderItem[]): Promise<void> {
  const dispatcher = getDispatcher();
  const db = serverClient();

  const editionInfo = items
    .map((i) => `"${i.photoTitle}" (Ed. ${i.editionNumber}/${i.editionTotal})`)
    .join(", ");

  await safeSend(
    dispatcher,
    orderCompletedAlert(order.id, order.customerName, editionInfo),
    "order_completed"
  );

  for (const item of items) {
    if (item.editionNumber >= item.editionTotal) {
      const { error } = await db
        .from("photos")
        .update({ is_published: false })
        .eq("slug", item.photoSlug);
      if (error) {
        // Failing to unpublish a sold-out edition is a real problem — the
        // next visitor could add it to cart. Surface via Sentry; don't rely
        // on console.error alone.
        try {
          Sentry.captureException(
            new Error(`Failed to unpublish ${item.photoSlug}: ${error.message}`),
            {
              tags: { pipeline: "alerting-webhook", context: "unpublish_sold_out" },
              extra: { photoSlug: item.photoSlug, orderId: order.id },
            }
          );
        } catch {
          // Terminal.
        }
        console.error(`[alerting] Failed to unpublish ${item.photoSlug}:`, error.message);
      }
      await safeSend(
        dispatcher,
        editionSoldOutAlert(item.photoTitle, item.photoSlug),
        "edition_sold_out"
      );
      continue;
    }

    const remaining = item.editionTotal - item.editionNumber;
    if (remaining <= 2) {
      await safeSend(
        dispatcher,
        editionLowStockAlert(item.photoTitle, item.photoSlug, remaining),
        "edition_low_stock"
      );
    }
  }
}

export async function alertWebhookFailure(
  sessionId: string,
  attempt: number,
  error: string
): Promise<void> {
  const dispatcher = getDispatcher();
  await safeSend(dispatcher, webhookRetryAlert(sessionId, attempt, error), "webhook_retry");
}
