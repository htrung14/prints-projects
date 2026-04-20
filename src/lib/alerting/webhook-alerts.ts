import { serverClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";
import {
  editionLowStockAlert,
  editionSoldOutAlert,
  orderCompletedAlert,
  webhookRetryAlert,
} from "@/lib/alerting";
import { getDispatcher } from "@/lib/alerting/dispatcher";

export async function alertAfterOrder(order: Order, items: OrderItem[]): Promise<void> {
  const dispatcher = getDispatcher();
  const db = serverClient();

  const editionInfo = items
    .map((i) => `"${i.photoTitle}" (Ed. ${i.editionNumber}/${i.editionTotal})`)
    .join(", ");

  await dispatcher.send(orderCompletedAlert(order.id, order.customerName, editionInfo));

  for (const item of items) {
    if (item.editionNumber >= item.editionTotal) {
      await Promise.all([
        dispatcher.send(editionSoldOutAlert(item.photoTitle, item.photoSlug)),
        db.from("photos").update({ is_published: false }).eq("slug", item.photoSlug),
      ]);
      continue;
    }

    const remaining = item.editionTotal - item.editionNumber;
    if (remaining <= 2) {
      await dispatcher.send(editionLowStockAlert(item.photoTitle, item.photoSlug, remaining));
    }
  }
}

export async function alertWebhookFailure(
  sessionId: string,
  attempt: number,
  error: string
): Promise<void> {
  const dispatcher = getDispatcher();
  await dispatcher.send(webhookRetryAlert(sessionId, attempt, error));
}
