import "server-only";
import { serverClient } from "@/lib/supabase/server";
import { batchReadyAlert } from "@/lib/alerting";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { getResend, fromAddress } from "@/lib/email/client";
import { buildDispatchUrl } from "@/lib/dispatch/url";
import type { OrderStatus } from "@/lib/types";

async function runSafely(fn: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[batch-dispatch] ${label}: ${(err as Error).message}`);
  }
}

async function sendPrinterBatchEmail(count: number, orderIds: string[]): Promise<void> {
  const printerEmail = process.env.PRINT_SHOP_EMAIL;
  if (!printerEmail) {
    console.warn("[batch-dispatch] PRINT_SHOP_EMAIL not set, skipping printer email.");
    return;
  }

  const dispatchUrl = buildDispatchUrl(orderIds[0], { kind: "batch" });
  const resend = getResend();

  await resend.emails.send({
    from: fromAddress(),
    to: printerEmail,
    subject: `Print batch ready: ${count} orders`,
    text: [
      `Hello,`,
      ``,
      `A new batch of ${count} orders is ready for printing.`,
      ``,
      `View the batch: ${dispatchUrl}`,
      ``,
      `Order IDs: ${orderIds.join(", ")}`,
    ].join("\n"),
  });
}

export async function batchOrdersForPrint(actorEmail: string): Promise<{
  batched: number;
  orderIds: string[];
}> {
  const db = serverClient();

  const newStatus: OrderStatus = "queued_for_print";

  // Atomic: only update rows still in "paid" status (guards against concurrent dispatch)
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: newStatus })
    .eq("status", "paid")
    .select("id");

  if (error) {
    throw new Error(`Failed to batch orders: ${error.message}`);
  }

  const orderIds = (updated ?? []).map((r: { id: string }) => r.id);
  if (orderIds.length === 0) {
    return { batched: 0, orderIds: [] };
  }

  await runSafely(async () => {
    await db.from("audit_log").insert(
      orderIds.map((id) => ({
        order_id: id,
        actor: actorEmail,
        action: "status_change",
        meta: { status: newStatus, trigger: "batch_dispatch" },
      }))
    );
  }, "audit log insert");

  const dispatcher = getDispatcher();
  await runSafely(
    () => dispatcher.send(batchReadyAlert(orderIds.length, orderIds)),
    "batch ready alert"
  );

  await runSafely(() => sendPrinterBatchEmail(orderIds.length, orderIds), "printer batch email");

  return { batched: orderIds.length, orderIds };
}
