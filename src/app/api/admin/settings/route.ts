/**
 * POST /api/admin/settings
 *
 * Admin-only endpoint to write runtime-editable settings (currently just
 * `print_shop_email`). Persists via `setSetting()` and appends an
 * `audit_log` row with `order_id: null` (settings changes aren't
 * order-scoped; the column is nullable per the init migration).
 *
 * Body: `{ print_shop_email: string | null }`. Empty string is treated as
 * null (clear the value and fall back to the env var).
 */

import { after, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { setSetting } from "@/lib/supabase/queries/settings";
import { audit } from "@/lib/supabase/queries/audit";
import { getDispatcher } from "@/lib/alerting/dispatcher";
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

  if (typeof body !== "object" || body === null || !("print_shop_email" in body)) {
    return NextResponse.json(
      { error: "body must be { print_shop_email: string | null }" },
      { status: 400 }
    );
  }

  const raw = (body as { print_shop_email: unknown }).print_shop_email;
  if (raw !== null && typeof raw !== "string") {
    return NextResponse.json(
      { error: "print_shop_email must be a string or null" },
      { status: 400 }
    );
  }

  // Treat empty string as "clear the value" — setSetting normalizes again
  // but being explicit here keeps the API contract obvious.
  const normalized = raw === null ? null : raw.trim().length > 0 ? raw.trim() : null;

  try {
    await setSetting("print_shop_email", normalized, session.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : "save failed";
    console.error(`POST /api/admin/settings setSetting failed (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(
            `POST /api/admin/settings print_shop_email (actor=${session.email})`,
            message
          )
        )
        .catch((alertErr) => {
          console.error("admin/settings: alert dispatch failed:", alertErr);
        });
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Audit trail. order_id is nullable in the audit_log schema (see
  // supabase/migrations/20260416120000_init.sql line 120) so settings
  // changes can be recorded without an associated order.
  await audit({
    orderId: null,
    actor: session.email,
    action: "settings_update",
    meta: {
      key: "print_shop_email",
      value: normalized,
      actor: session.email,
    },
  });

  return NextResponse.json({ ok: true, value: normalized });
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
