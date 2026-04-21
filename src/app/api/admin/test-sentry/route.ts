import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.DISPATCH_SIGNING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = Sentry.getClient();
  const dsnOptions = client?.getOptions?.();
  const dsn = dsnOptions?.dsn || "(no dsn)";
  const dsnHead = typeof dsn === "string" ? dsn.slice(0, 60) + "..." : "(non-string dsn)";

  const err = new Error(
    "TEST — verifying Sentry → /api/alerts/sentry → dispatcher path. No action needed."
  );
  err.name = "TestPipelineError";

  const eventId = Sentry.captureException(err, {
    tags: { test: "true", source: "admin/test-sentry" },
    level: "error",
  });

  const flushed = await Sentry.flush(5000);

  return NextResponse.json({
    ok: true,
    eventId,
    flushed,
    clientReady: !!client,
    dsnHead,
    env: {
      hasServerDsn: !!process.env.SENTRY_DSN,
      hasPublicDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      publicDsnHead: (process.env.NEXT_PUBLIC_SENTRY_DSN ?? "").slice(0, 60) + "...",
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
