/**
 * POST /api/alerts/sentry
 *
 * Receives Sentry "Issue Alert" webhook payloads and routes them through
 * the existing alert dispatcher (LLM triage → Telegram + email). Lets
 * Sentry handle error capture/grouping while keeping notification UX
 * consistent with the rest of the alert system.
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

  // Sentry sends HMAC-SHA256 (sometimes `sha256=` prefixed).
  // `x-webhook-secret` is the manual-testing fallback.
  const rawSig = req.headers.get("sentry-hook-signature");
  const signature = rawSig?.replace(/^sha256=/, "") ?? null;
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
    return new Response(null, { status: 204 });
  }

  const type = issue.metadata?.type ?? "Error";
  const value = issue.metadata?.value ?? issue.title ?? "(no message)";
  const culprit = issue.culprit ?? "unknown";
  const permalink = issue.permalink ?? issue.web_url ?? "";
  const count = Number(issue.count ?? 1);
  const users = Number(issue.userCount ?? 0);

  const context = `${type} at ${culprit}`;
  const messageParts = [value];
  if (count > 1 || users > 0) {
    messageParts.push(`Seen ${count} time(s), ${users} user(s) affected.`);
  }
  if (permalink) messageParts.push(`Details: ${permalink}`);
  const message = messageParts.join(" ");

  after(() => {
    getDispatcher()
      .send(systemErrorAlert(context, message))
      .catch((err) => console.error("[alerts/sentry] dispatch failed:", err));
  });

  return new Response(null, { status: 200 });
}
