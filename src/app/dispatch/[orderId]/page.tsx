/**
 * Single-order dispatch page — the one Loupe clicks from the print-job email.
 *
 * Server component. Validates the HMAC token and renders the dispatch layout
 * with shipping address, line items, a "mark as sent to printer" button, and
 * a tracking submission form.
 *
 * IMPORTANT: The `paid → sent_to_print` transition is NOT triggered on GET.
 * Email security scanners (Microsoft SafeLinks, Gmail link prefetch, spam
 * filters) issue GETs on every link in every email — if GET advanced status,
 * Thalia sending the batch email would flip every order to `sent_to_print`
 * before Loupe ever opened the link. The transition now only happens when
 * the printer explicitly submits the `<form method="post">` below, which
 * scanners never trigger. Idempotent: a second submit on an already-advanced
 * order is a no-op.
 *
 * Note on the drop-ship model: we show the CUSTOMER's shipping address here,
 * not a forwarding address. Loupe ships direct — no in-person pickup step.
 */

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { updateOrderStatus } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { alertSystemError } from "@/lib/alerting/dispatcher";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { getDispatchItemsForOrder } from "@/lib/dispatch/queries";
import type { DispatchItem } from "@/lib/dispatch/queries";
import type { Address, Order } from "@/lib/types";
import { TrackingForm } from "@/components/dispatch/TrackingForm";

// Dispatch pages depend on request state (searchParams + DB) - force dynamic
// so Next doesn't try to prerender them at build time.
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DispatchOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: SearchParams;
}) {
  const [{ orderId }, rawSearch] = await Promise.all([params, searchParams]);
  const tokenRaw = rawSearch.token;
  const token = typeof tokenRaw === "string" ? tokenRaw : undefined;

  // --- token ---------------------------------------------------------------
  if (!token) {
    return <InvalidShell reason="Missing token." />;
  }
  const payload = verifyDispatchToken(token);
  if (!payload) {
    return <InvalidShell reason="This link is invalid or has expired." />;
  }
  if (payload.kind !== "single" || payload.orderId !== orderId) {
    return <InvalidShell reason="Token does not match this order." />;
  }

  // --- order + items -------------------------------------------------------
  const order = await getOrderById(orderId);
  if (!order) notFound();

  if (order.fulfillmentTokenRevokedAt) {
    return <RevokedShell order={order} />;
  }

  const items = await getDispatchItemsForOrder(orderId);

  const markedRaw = rawSearch.marked;
  const justMarked = typeof markedRaw === "string" && markedRaw === "1";

  return (
    <div
      style={{
        background: "#ffffff",
        color: "rgba(0,0,0,0.78)",
        fontWeight: 900,
      }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-16">
        <Header order={order} />
        <ShipTo address={order.shippingAddress} customerName={order.customerName} />

        <section className="mt-12 border-t border-ink-line pt-8">
          <h2 className="label-caps" style={{ marginBottom: 12 }}>
            Line items
          </h2>
          <ul className="flex flex-col gap-10">
            {items.map((item) => (
              <LineItem key={item.id} item={item} token={token} order={order} />
            ))}
          </ul>
        </section>

        <MarkSentToPrint order={order} token={token} justMarked={justMarked} />

        <section className="mt-14 border-t border-ink-line pt-8">
          <h2 className="label-caps" style={{ marginBottom: 12 }}>
            Submit tracking
          </h2>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)", marginBottom: 18 }}>
            Ship direct to the customer above. Submit one tracking number per order; notes are
            internal to Thalia&apos;s inbox.
          </p>
          <TrackingForm
            orderId={order.id}
            token={token}
            initialCarrier={order.carrier}
            initialTrackingNumber={order.trackingNumber}
            initialNotes={order.notes}
            submittedAt={order.status === "shipped" ? order.createdAt : null}
          />
        </section>

        <FooterNote />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Server action: explicit `paid → sent_to_print` transition (POST only).
// ---------------------------------------------------------------------------

async function markSentToPrintAction(formData: FormData) {
  "use server";

  const orderId = String(formData.get("orderId") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!orderId || !token) {
    throw new Error("markSentToPrintAction: missing orderId or token.");
  }

  // Re-verify the token inside the action. Form fields are user-supplied and
  // the action is callable as a top-level POST endpoint, so we must not trust
  // that the caller ever passed through the GET render.
  const payload = verifyDispatchToken(token);
  if (!payload || payload.kind !== "single" || payload.orderId !== orderId) {
    throw new Error("markSentToPrintAction: token does not authorize this order.");
  }

  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`markSentToPrintAction: order ${orderId} not found.`);
  }
  if (order.fulfillmentTokenRevokedAt) {
    throw new Error(`markSentToPrintAction: order ${orderId} link revoked.`);
  }

  // Idempotent: if the order already advanced past `paid`, no-op and redirect
  // back. This matters because email scanners can't hit POST, but a legitimate
  // printer can click the button twice by accident (or refresh the post-submit
  // page), and we must not double-audit.
  if (order.status !== "paid") {
    redirect(`/dispatch/${orderId}?token=${token}&marked=1`);
  }

  // Flat actor name matches the convention of sibling dispatch audit rows
  // (dispatch_submit, dispatch_download, dispatch_batch). Order scoping is
  // already captured by the audit row's order_id FK and meta.trigger.
  const actor = "dispatch_mark_sent";

  try {
    await updateOrderStatus(order.id, "sent_to_print", { actor });
    await audit({
      orderId: order.id,
      actor,
      action: "status_change",
      meta: { from: "paid", to: "sent_to_print", trigger: "dispatch_page_mark_sent" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dispatch page markSentToPrint: failed to advance order ${order.id}:`, err);
    // Alert ops — the printer is sitting in front of a broken button.
    // We rethrow after so Next renders the error boundary / default 500 and
    // the printer knows to email Thalia instead of assuming it worked.
    await alertSystemError(`POST dispatch mark-sent (order=${order.id})`, msg);
    throw err;
  }

  revalidatePath(`/dispatch/${orderId}`);
  redirect(`/dispatch/${orderId}?token=${token}&marked=1`);
}

// ---------------------------------------------------------------------------
// Sub-components (server)
// ---------------------------------------------------------------------------

function Header({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <header className="flex flex-col gap-2">
      <span className="label-caps">Dispatch · Loupe</span>
      <h1
        className="h-display-xl"
        style={{ color: "rgba(0,0,0,0.95)", fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Order {shortId(order.id)}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span style={{ color: "rgba(0,0,0,0.6)" }}>Placed {date}</span>
        <StatusPill status={order.status} />
      </div>
    </header>
  );
}

function ShipTo({ address, customerName }: { address: Address; customerName: string }) {
  return (
    <section className="mt-10 grid gap-6 md:grid-cols-[200px_1fr]">
      <h2 className="label-caps">Ship to (customer)</h2>
      <div className="text-sm" style={{ color: "rgba(0,0,0,0.78)" }}>
        <div style={{ color: "rgba(0,0,0,0.95)" }}>{address.name || customerName}</div>
        <div>{address.line1}</div>
        {address.line2 ? <div>{address.line2}</div> : null}
        <div>
          {address.city}
          {address.state ? `, ${address.state}` : ""} {address.postalCode}
        </div>
        <div>{address.country}</div>
      </div>
    </section>
  );
}

function LineItem({ item, token, order }: { item: DispatchItem; token: string; order: Order }) {
  const hasPrintFile = Boolean(item.photoPrintFileKey);
  return (
    <li className="grid gap-6 md:grid-cols-[120px_1fr]">
      <div
        className="aspect-[3/4] overflow-hidden border border-ink-line"
        style={{ background: "#f4f4f0" }}
      >
        {item.photoImageUrl ? (
          <img
            src={item.photoImageUrl}
            alt={item.photoImageAlt}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <div className="label-caps" style={{ color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>
            Ref {item.photoReferenceNumber || "-"}
          </div>
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.2,
              color: "rgba(0,0,0,0.95)",
            }}
          >
            {item.photoTitle}
          </div>
        </div>
        <dl
          className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm"
          style={{ color: "rgba(0,0,0,0.78)" }}
        >
          <div>
            <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
              Size
            </dt>
            <dd>{item.sizeLabel}</dd>
          </div>
          <div>
            <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
              Paper
            </dt>
            <dd>{item.paperName}</dd>
          </div>
          <div>
            <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
              Quantity
            </dt>
            <dd>{item.quantity}</dd>
          </div>
          <div>
            <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
              Edition
            </dt>
            <dd>
              {item.editionNumber} of {item.editionTotal}
            </dd>
          </div>
        </dl>
        <div className="mt-2 flex flex-wrap gap-3">
          {hasPrintFile ? (
            <a
              href={`/api/dispatch/print-file/${item.id}?token=${token}`}
              className="btn-ghost"
              style={{ padding: "8px 18px", fontSize: 14 }}
            >
              Download print file
            </a>
          ) : (
            <span
              className="text-sm"
              style={{
                border: "1px solid rgba(0,0,0,0.18)",
                padding: "8px 18px",
                color: "rgba(0,0,0,0.5)",
              }}
            >
              Print file not uploaded
            </span>
          )}
          <a
            href={`/api/coa/${order.id}?token=${token}&itemId=${item.id}`}
            className="btn-ghost is-secondary"
            style={{ padding: "8px 18px", fontSize: 14 }}
          >
            Download COA
          </a>
        </div>
      </div>
    </li>
  );
}

function MarkSentToPrint({
  order,
  token,
  justMarked,
}: {
  order: Order;
  token: string;
  justMarked: boolean;
}) {
  const alreadyAdvanced = order.status !== "paid";
  return (
    <section className="mt-12 border-t border-ink-line pt-8">
      <h2 className="label-caps" style={{ marginBottom: 12 }}>
        Mark as sent to printer
      </h2>
      <p
        className="text-sm"
        style={{ color: "rgba(0,0,0,0.6)", marginBottom: 14, maxWidth: "62ch" }}
      >
        Click once Loupe has the order queued on the press. This moves the order to{" "}
        <em>sent to print</em> in our system and lets Thalia see progress. COA or signature
        decisions are handled out-of-band — reply to the print-job email if anything needs a call.
      </p>
      <form action={markSentToPrintAction}>
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="btn-ghost"
          style={{
            padding: "10px 22px",
            fontSize: 14,
            opacity: alreadyAdvanced ? 0.5 : 1,
            cursor: alreadyAdvanced ? "default" : "pointer",
          }}
          disabled={alreadyAdvanced}
          aria-disabled={alreadyAdvanced}
        >
          {alreadyAdvanced ? "Already marked sent to printer" : "Mark as sent to printer"}
        </button>
      </form>
      {justMarked ? (
        <p
          className="mt-3 text-sm"
          style={{ color: "rgba(0,0,0,0.6)" }}
          role="status"
          aria-live="polite"
        >
          Recorded. Status is now <em>sent to print</em>.
        </p>
      ) : null}
    </section>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className="label-caps"
      style={{
        border: "1px solid rgba(0,0,0,0.18)",
        padding: "2px 8px",
        color: "rgba(0,0,0,0.78)",
      }}
    >
      {label}
    </span>
  );
}

function FooterNote() {
  return (
    <footer
      className="mt-16 border-t border-ink-line pt-6 text-xs"
      style={{ color: "rgba(0,0,0,0.5)" }}
    >
      <p>
        This page is token-gated. If the link was forwarded outside Loupe, reply to the print-job
        email and Thalia will revoke it.
      </p>
    </footer>
  );
}

function InvalidShell({ reason }: { reason: string }) {
  return (
    <div
      style={{ background: "#ffffff", color: "rgba(0,0,0,0.78)", fontWeight: 900 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-2xl px-6 py-20 md:px-10">
        <span className="label-caps">Dispatch</span>
        <h1
          className="h-display-xl"
          style={{ color: "rgba(0,0,0,0.95)", fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Access denied
        </h1>
        <p className="mt-4 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
          {reason}
        </p>
      </div>
    </div>
  );
}

function RevokedShell({ order }: { order: Order }) {
  return (
    <div
      style={{ background: "#ffffff", color: "rgba(0,0,0,0.78)", fontWeight: 900 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-2xl px-6 py-20 md:px-10">
        <span className="label-caps">Dispatch</span>
        <h1
          className="h-display-xl"
          style={{ color: "rgba(0,0,0,0.95)", fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Link revoked
        </h1>
        <p className="mt-4 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
          This fulfillment link for order {shortId(order.id)} was revoked. Reply to the print-job
          email thread for a fresh one.
        </p>
      </div>
    </div>
  );
}

function shortId(id: string): string {
  // Compact display form: first 8 chars of the uuid.
  return id.slice(0, 8);
}
