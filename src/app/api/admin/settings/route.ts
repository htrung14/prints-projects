/**
 * POST /api/admin/settings
 *
 * Admin-only endpoint to write runtime-editable settings. Persists via
 * `setSetting()` and appends an `audit_log` row per key with
 * `order_id: null` (settings changes aren't order-scoped; the column
 * is nullable per the init migration).
 *
 * Body: partial object — any subset of:
 *   { print_shop_email: string | null, admin_emails: string[] | null }
 *
 * Empty string / empty array / null all clear the DB value (callers
 * fall back to the env var for each key).
 */

import { after, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { setSetting } from "@/lib/supabase/queries/settings";
import { audit } from "@/lib/supabase/queries/audit";
import { alertSafely } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "body must be an object" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const saved: Record<string, string | null> = {};

  // --- print_shop_email -----------------------------------------------------
  if ("print_shop_email" in payload) {
    const raw = payload.print_shop_email;
    if (raw !== null && typeof raw !== "string") {
      return NextResponse.json(
        { error: "print_shop_email must be a string or null" },
        { status: 400 }
      );
    }
    const normalized = raw === null ? null : raw.trim().length > 0 ? raw.trim() : null;
    try {
      await setSetting("print_shop_email", normalized, session.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "save failed";
      console.error(
        `POST /api/admin/settings print_shop_email failed (actor=${session.email}):`,
        err
      );
      after(() =>
        alertSafely(
          `POST /api/admin/settings print_shop_email (actor=${session.email})`,
          systemErrorAlert(
            `POST /api/admin/settings print_shop_email (actor=${session.email})`,
            message
          )
        )
      );
      return NextResponse.json({ error: message }, { status: 500 });
    }
    await audit({
      orderId: null,
      actor: session.email,
      action: "settings_update",
      meta: { key: "print_shop_email", value: normalized, actor: session.email },
    });
    saved.print_shop_email = normalized;
  }

  // --- admin_emails ---------------------------------------------------------
  // Stored as a comma-separated string in the settings table. Accepts an
  // array in the request for ergonomics. Validates email shape so a typo
  // doesn't silently lock someone out.
  if ("admin_emails" in payload) {
    const raw = payload.admin_emails;
    let emails: string[];
    if (raw === null) {
      emails = [];
    } else if (Array.isArray(raw)) {
      if (!raw.every((e): e is string => typeof e === "string")) {
        return NextResponse.json(
          { error: "admin_emails must contain only strings" },
          { status: 400 }
        );
      }
      emails = raw;
    } else if (typeof raw === "string") {
      emails = raw.split(",");
    } else {
      return NextResponse.json(
        { error: "admin_emails must be an array of strings, a comma-separated string, or null" },
        { status: 400 }
      );
    }

    const normalizedEmails = Array.from(
      new Set(emails.map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0))
    );
    // Basic email shape check — not RFC-strict, but catches typos.
    const invalid = normalizedEmails.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid) {
      return NextResponse.json(
        { error: `invalid email in admin_emails: ${invalid}` },
        { status: 400 }
      );
    }

    const asString = normalizedEmails.length > 0 ? normalizedEmails.join(",") : null;
    try {
      await setSetting("admin_emails", asString, session.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "save failed";
      console.error(`POST /api/admin/settings admin_emails failed (actor=${session.email}):`, err);
      after(() =>
        alertSafely(
          `POST /api/admin/settings admin_emails (actor=${session.email})`,
          systemErrorAlert(
            `POST /api/admin/settings admin_emails (actor=${session.email})`,
            message
          )
        )
      );
      return NextResponse.json({ error: message }, { status: 500 });
    }
    await audit({
      orderId: null,
      actor: session.email,
      action: "settings_update",
      meta: { key: "admin_emails", value: asString, actor: session.email },
    });
    saved.admin_emails = asString;
  }

  if (Object.keys(saved).length === 0) {
    return NextResponse.json(
      { error: "no recognized keys in body (expected print_shop_email or admin_emails)" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, saved });
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
