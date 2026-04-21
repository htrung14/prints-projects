import { after, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { batchOrdersForPrint } from "@/lib/dispatch/batch";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await batchOrdersForPrint(session.email);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`POST /api/admin/batch-dispatch failed (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`POST /api/admin/batch-dispatch (actor=${session.email})`, message))
        .catch((alertErr) => {
          console.error("batch-dispatch: alert dispatch failed:", alertErr);
        });
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
