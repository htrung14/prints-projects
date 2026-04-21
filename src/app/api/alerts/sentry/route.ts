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
  const rawBody = await req.text();

  // Log headers + first bytes of body so we can diagnose what Sentry sends.
  const headerEntries: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (/^sentry|signature|hook/i.test(k)) headerEntries[k] = v;
  });
  console.log(
    "[alerts/sentry] headers:",
    JSON.stringify(headerEntries),
    "bodyLen:",
    rawBody.length,
    "bodyHead:",
    rawBody.slice(0, 200)
  );

  if (!secret) {
    return new Response("SENTRY_WEBHOOK_SECRET not configured", { status: 500 });
  }

  // Sentry may send signature as `sentry-hook-signature` (with "sha256=" prefix
  // per newer docs) or our own `x-webhook-secret` for manual testing.
  const rawSig = req.headers.get("sentry-hook-signature");
  const signature = rawSig?.replace(/^sha256=/, "") ?? null;
  const plainSecret = req.headers.get("x-webhook-secret");

  const signatureOk =
    (signature && verifySignature(rawBody, signature, secret)) || plainSecret === secret;

  // Fire a best-effort Telegram diagnostic on any hit so we can see what landed.
  // This runs even on signature failure so we can debug misconfiguration.
  after(() => {
    getDispatcher()
      .send(
        systemErrorAlert(
          "Sentry webhook diagnostic",
          `hit=/api/alerts/sentry signatureOk=${signatureOk} bodyLen=${rawBody.length} headers=${JSON.stringify(headerEntries)} bodyHead=${rawBody.slice(0, 400)}`
        )
      )
      .catch((err) => console.error("[alerts/sentry] diagnostic dispatch failed:", err));
  });

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

  after(() => {
    getDispatcher()
      .send(systemErrorAlert(context, message))
      .catch((err) => console.error("[alerts/sentry] dispatch failed:", err));
  });

  return new Response(null, { status: 200 });
}
