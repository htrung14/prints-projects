import { after, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { batchOrdersForPrint } from "@/lib/dispatch/batch";
import { alertSafely } from "@/lib/alerting/dispatcher";
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
    const context = `POST /api/admin/batch-dispatch (actor=${session.email})`;
    console.error(`${context} failed:`, err);
    // No-silent-failures: alertSafely wraps dispatcher errors so we don't
    // swallow them with .catch(console.error). The outer catch in
    // alertSafely logs + Sentry-captures if the dispatcher itself blows up.
    after(() => alertSafely(context, systemErrorAlert(context, message)));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
