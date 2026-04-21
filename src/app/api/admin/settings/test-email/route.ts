/**
 * POST /api/admin/settings/test-email
 *
 * Admin-only: send a short verification email to the currently-saved printer
 * address so Thalia can sanity-check the config BEFORE dispatching a batch.
 *
 * Reads the address via `getPrinterEmail()` (DB → env fallback, same resolver
 * the batch dispatch uses). If none is configured, returns 400 so the UI can
 * surface a clear "save an address first" message instead of silently 204ing.
 *
 * Audits `settings_test_email_sent` on success. Resend failures are logged,
 * Sentry-captured via `alertSystemError`, and returned as 500 — no silent
 * catch, per the no-silent-failures rule.
 */

import { after, NextResponse } from "next/server";
import * as React from "react";
import { render } from "@react-email/render";
import { getAdminSession } from "@/lib/auth/session";
import { getPrinterEmail } from "@/lib/supabase/queries/settings";
import { fromAddress, getResend } from "@/lib/email/client";
import TestEmail from "@/lib/email/templates/TestEmail";
import { audit } from "@/lib/supabase/queries/audit";
import { alertSafely } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const printerEmail = await getPrinterEmail();
  if (!printerEmail) {
    return NextResponse.json(
      {
        error:
          "No printer email configured. Save an address on this page (or set PRINT_SHOP_EMAIL) before sending a test.",
      },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  const context = `POST /api/admin/settings/test-email (actor=${session.email}, to=${printerEmail})`;

  try {
    const html = await render(React.createElement(TestEmail, { timestamp }));
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: printerEmail,
      replyTo: fromAddress(),
      subject: `Test email from At-Tamassok · ${timestamp}`,
      html,
      tags: [{ name: "email_kind", value: "printer_test" }],
    });
    if (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : JSON.stringify(error);
      throw new Error(`Resend send failed: ${message}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.error(`${context} failed:`, err);
    after(() => alertSafely(context, systemErrorAlert(context, message)));
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await audit({
    orderId: null,
    actor: session.email,
    action: "settings_test_email_sent",
    meta: { to: printerEmail },
  });

  return NextResponse.json({ ok: true, to: printerEmail });
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
