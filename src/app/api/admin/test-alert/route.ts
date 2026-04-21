import { NextResponse } from "next/server";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { orderCompletedAlert, editionSoldOutAlert, systemErrorAlert } from "@/lib/alerting";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.DISPATCH_SIGNING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dispatcher = getDispatcher();
  const results: string[] = [];

  // Info alert → Notion only
  await dispatcher.send(
    orderCompletedAlert("test-order-001", "Test Customer", '"Holding On" (Ed. 1/10)')
  );
  results.push("order_completed (info) → Notion");

  // Critical alert → Telegram + Email + Notion
  await dispatcher.send(
    systemErrorAlert("Test alert — verifying all channels are working", "test-alert endpoint")
  );
  results.push("system_error (critical) → Telegram + Email + Notion");

  return NextResponse.json({ ok: true, sent: results });
}
