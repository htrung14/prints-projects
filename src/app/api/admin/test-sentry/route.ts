import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.DISPATCH_SIGNING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const err = new Error(
    "TEST — verifying Sentry → /api/alerts/sentry → dispatcher path. No action needed."
  );
  err.name = "TestPipelineError";

  const eventId = Sentry.captureException(err, {
    tags: { test: "true", source: "admin/test-sentry" },
    level: "error",
  });

  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    eventId,
    note: "Sentry should create a new issue within ~30s; the alert rule will POST to /api/alerts/sentry → dispatcher → Telegram + email.",
  });
}
