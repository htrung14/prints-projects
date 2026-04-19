/**
 * POST /api/email/retry/[orderId]?kind=confirmation|print_job|shipped
 *
 * Admin-only resend of one of the transactional emails for a given order.
 * Auth: cookie-backed Supabase session via `adminServerClient()`. The
 * signed-in email must be on the `ADMIN_EMAILS` allowlist (Track E will own
 * a shared `requireAdmin` helper; for now we inline the check here).
 *
 * This is the endpoint the admin "resend confirmation" / "resend print job"
 * buttons hit. It always records an audit entry, regardless of send outcome.
 *
 * Node runtime because it downstream calls @react-email/render.
 */

import { NextResponse, type NextRequest } from "next/server";
import { adminServerClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmation,
  sendPrintJobEmail,
  sendShippedNotification,
} from "@/lib/email/send";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { serverClient } from "@/lib/supabase/server";
import type { OrderItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "confirmation" | "print_job" | "shipped";

function parseKind(raw: string | null): Kind | null {
  if (raw === "confirmation" || raw === "print_job" || raw === "shipped") {
    return raw;
  }
  return null;
}

function parseAdminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );
}

type OrderItemRow = {
  id: string;
  order_id: string;
  photo_id: string;
  photo_slug: string;
  photo_title: string;
  size_id: string;
  size_label: string;
  paper_id: string;
  paper_name: string;
  quantity: number;
  unit_price_cents: number;
  edition_number: number;
  edition_total: number;
  print_file_url_snapshot: string | null;
};

const ORDER_ITEM_COLUMNS =
  "id, order_id, photo_id, photo_slug, photo_title, size_id, size_label, paper_id, paper_name, quantity, unit_price_cents, edition_number, edition_total, print_file_url_snapshot";

async function listItemsFor(orderId: string): Promise<OrderItem[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", orderId);
  if (error) {
    throw new Error(`listItemsFor(${orderId}) failed: ${error.message}`);
  }
  const rows = (data ?? []) as OrderItemRow[];
  return rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    photoId: row.photo_id,
    photoSlug: row.photo_slug,
    photoTitle: row.photo_title,
    sizeId: row.size_id,
    sizeLabel: row.size_label,
    paperId: row.paper_id,
    paperName: row.paper_name,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    editionNumber: row.edition_number,
    editionTotal: row.edition_total,
    printFileUrlSnapshot: row.print_file_url_snapshot,
  }));
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------
  const supabase = await adminServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = user.email?.toLowerCase() ?? "";
  const allowlist = parseAdminAllowlist();
  if (!email || !allowlist.has(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ---------------------------------------------------------------------------
  // Parse query / params
  // ---------------------------------------------------------------------------
  const { orderId } = await ctx.params;
  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json(
      { error: "Invalid `kind`; expected confirmation|print_job|shipped" },
      { status: 400 }
    );
  }

  // ---------------------------------------------------------------------------
  // Load order + items
  // ---------------------------------------------------------------------------
  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let items: OrderItem[] = [];
  if (kind !== "shipped") {
    items = await listItemsFor(orderId);
    if (items.length === 0) {
      return NextResponse.json({ error: "Order has no items; cannot resend." }, { status: 409 });
    }
  }

  // ---------------------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------------------
  try {
    switch (kind) {
      case "confirmation":
        await sendOrderConfirmation(order, items);
        break;
      case "print_job": {
        // Admin is resending - they can also hit "regenerate dispatch link"
        // separately. We pull the URL from the body if provided; otherwise
        // degrade to a bare link to /dispatch/[orderId] that Track D will
        // reject without a token. That's intentional: we don't silently
        // re-sign from here, and the admin sees a bounced auth page if they
        // forgot to paste the link.
        let dispatchUrl = "";
        try {
          const body = (await request.json().catch(() => null)) as { dispatchUrl?: unknown } | null;
          if (body && typeof body === "object" && typeof body.dispatchUrl === "string") {
            dispatchUrl = body.dispatchUrl;
          }
        } catch {
          // no body - fine
        }
        if (!dispatchUrl) {
          return NextResponse.json(
            {
              error:
                "Missing dispatchUrl. Regenerate the dispatch link in admin and POST { dispatchUrl } with this request.",
            },
            { status: 400 }
          );
        }
        await sendPrintJobEmail(order, items, dispatchUrl);
        break;
      }
      case "shipped":
        await sendShippedNotification(order);
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await audit({
      orderId,
      actor: email,
      action: "email_resend_failed",
      meta: { kind, error: message },
    });
    return NextResponse.json({ error: `Send failed: ${message}` }, { status: 502 });
  }

  await audit({
    orderId,
    actor: email,
    action: "email_resent",
    meta: { kind },
  });

  return NextResponse.json({ ok: true, kind, orderId });
}
