import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { batchOrdersForPrint } from "@/lib/dispatch/batch";

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
