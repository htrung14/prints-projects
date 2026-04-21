/**
 * POST /api/alerts/sentry
 *
 * Receives Sentry "Issue Alert" webhook payloads and routes them through
 * the existing alert dispatcher (LLM triage → Telegram + email). Lets
 * Sentry handle error capture/grouping while keeping notification UX
 * consistent with the rest of the alert system.
 *
 * Auth: shared secret in `x-sentry-signature` OR `x-webhook-secret` header.
 * Configure this value in:
 *   - The Sentry webhook integration (Settings → Developer Settings → Webhooks)
 *   - Vercel env var SENTRY_WEBHOOK_SECRET
 */

import type { NextRequest } from "next/server";
import { after } from "next/server";
import crypto from "node:crypto";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SentryIssuePayload = {
  action?: string;
  data?: {
    issue?: {
      id?: string;
      title?: string;
      culprit?: string;
      level?: string;
      count?: string | number;
      userCount?: string | number;
      permalink?: string;
      web_url?: string;
      metadata?: { type?: string; value?: string };
    };
  };
};

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const computed = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("SENTRY_WEBHOOK_SECRET not configured", { status: 500 });
  }

  const rawBody = await req.text();

  // Sentry sends HMAC-SHA256 in `sentry-hook-signature`. We also accept a
  // simple shared-secret header for custom/manual testing.
  const signature = req.headers.get("sentry-hook-signature");
  const plainSecret = req.headers.get("x-webhook-secret");

  const signatureOk =
    (signature && verifySignature(rawBody, signature, secret)) || plainSecret === secret;

  if (!signatureOk) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: SentryIssuePayload;
  try {
    payload = JSON.parse(rawBody) as SentryIssuePayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const issue = payload.data?.issue;
  if (!issue) {
    // Not an issue alert (could be a resolved/ping/other event) — ack silently.
    return new Response(null, { status: 204 });
  }

  const type = issue.metadata?.type ?? "Error";
  const value = issue.metadata?.value ?? issue.title ?? "(no message)";
  const culprit = issue.culprit ?? "unknown";
  const permalink = issue.permalink ?? issue.web_url ?? "";
  const count = issue.count ?? 1;
  const users = issue.userCount ?? 0;

  const context = `${type} at ${culprit}`;
  const message = [
    value,
    `Seen ${count} time(s), ${users} user(s) affected.`,
    permalink ? `Details: ${permalink}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Fire-and-forget so we can ack Sentry fast (webhooks retry on non-2xx).
  after(() => {
    getDispatcher()
      .send(systemErrorAlert(context, message))
      .catch((err) => console.error("[alerts/sentry] dispatch failed:", err));
  });

  return new Response(null, { status: 200 });
}
