/**
 * /admin/orders/[id] - order detail.
 *
 * Server component. Renders:
 *  - customer + shipping
 *  - totals breakdown
 *  - line items with edition numbers + print-file-key indicator
 *  - status controls (OrderActions, client component)
 *  - fulfillment-token controls
 *  - link out to Stripe dashboard for refunds (not automated)
 *  - inline audit log, last 20 entries for this order
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getOrderById, getChildOrders } from "@/lib/supabase/queries/orders";
import { listOrderItems, listAuditEntries } from "@/app/admin/_data";
import OrderActions from "./OrderActions";

export const dynamic = "force-dynamic";

function formatMoney(cents: number, currency: string): string {
  return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function stripeDashboardUrl(pi: string | null, sessionId: string | null): string | null {
  if (!pi) return null;
  // Detect live vs test from the session ID prefix so admins land on the
  // correct dashboard without manual URL surgery.
  const isLive = sessionId?.startsWith("cs_live_") ?? false;
  const base = isLive ? "https://dashboard.stripe.com" : "https://dashboard.stripe.com/test";
  return `${base}/payments/${encodeURIComponent(pi)}`;
}

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/orders/${id}`);

  const order = await getOrderById(id);
  if (!order) notFound();

  const [items, audit, children] = await Promise.all([
    listOrderItems(order.id),
    listAuditEntries({ orderId: order.id, limit: 20 }),
    getChildOrders(order.id),
  ]);

  const addr = order.shippingAddress;
  const piUrl = stripeDashboardUrl(order.stripePaymentIntentId, order.stripeCheckoutSessionId);
  const tokenRevoked = order.fulfillmentTokenRevokedAt !== null;

  return (
    <section className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <Link href="/admin/orders" className="text-xs text-ink-faint underline underline-offset-4">
          ← Orders
        </Link>
        {order.parentOrderId ? (
          <Link
            href={`/admin/orders/${order.parentOrderId}`}
            className="text-xs text-ink-faint underline underline-offset-4"
          >
            Reprint of: {order.parentOrderId.slice(0, 8).toUpperCase()} →
          </Link>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="h-display">
            Order {order.id.slice(0, 8)}
            <span className="ml-3 text-sm text-ink-faint">{formatDateTime(order.createdAt)}</span>
          </h1>
          <span className="label-caps">{order.status.replace(/_/g, " ")}</span>
        </div>
      </header>

      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="label-caps">Customer</h2>
            <p className="text-sm">
              <span className="text-ink-strong">{order.customerName}</span>
              <br />
              {order.customerEmail}
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="label-caps">Shipping address</h2>
            <address className="not-italic text-sm">
              {addr.name}
              <br />
              {addr.line1}
              {addr.line2 ? (
                <>
                  <br />
                  {addr.line2}
                </>
              ) : null}
              <br />
              {addr.city}
              {addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
              <br />
              {addr.country}
            </address>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="label-caps">Line items</h2>
            <div className="border-t border-ink-line">
              {items.length === 0 ? (
                <div className="border-b border-ink-line py-3 text-sm text-ink-faint">
                  {order.status === "refunded"
                    ? "No items (refunded: edition exceeded)"
                    : "No items"}
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-col gap-1 border-b border-ink-line py-3 text-sm"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-ink-strong">{it.photoTitle}</span>
                      <span>{formatMoney(it.unitPriceCents, order.currency)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-ink-faint">
                      <span>{it.sizeLabel}</span>
                      <span>{it.paperName}</span>
                      <span>
                        Edition {it.editionNumber} / {it.editionTotal}
                      </span>
                      <span>Qty {it.quantity}</span>
                      {it.printFileUrlSnapshot ? (
                        <span title={it.printFileUrlSnapshot}>Print file: attached</span>
                      ) : (
                        <span>Print file: missing</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="flex flex-col gap-2 text-sm">
            <h2 className="label-caps">Totals</h2>
            <Row label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
            <Row label="Tax" value={formatMoney(order.taxCents, order.currency)} />
            <Row label="Shipping" value={formatMoney(order.shippingCents, order.currency)} />
            <div className="mt-1 border-t border-ink-line pt-2">
              <Row label="Total" strong value={formatMoney(order.totalCents, order.currency)} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="label-caps">Refunds</h2>
            <p className="text-sm text-ink-faint">
              Refunds are handled in the Stripe dashboard (not automated in v1).
            </p>
            {piUrl ? (
              <a
                href={piUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start text-sm underline underline-offset-4 text-ink-strong"
              >
                Open in Stripe ↗
              </a>
            ) : (
              <p className="text-sm text-ink-faint">No payment intent id on this order.</p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <OrderActions
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.trackingNumber}
            carrier={order.carrier}
            hasRevokedToken={tokenRevoked}
          />

          <section className="flex flex-col gap-2 text-sm">
            <h2 className="label-caps">Fulfillment</h2>
            <p className="text-xs text-ink-faint">
              Token: {order.fulfillmentToken.slice(0, 8)}…{order.fulfillmentToken.slice(-6)}
            </p>
            {tokenRevoked ? (
              <p className="text-xs text-ink-faint">
                Revoked at {formatDateTime(order.fulfillmentTokenRevokedAt as string)}
              </p>
            ) : null}
            {order.printJobEmailSentAt ? (
              <p className="text-xs text-ink-faint">
                Print-job email sent {formatDateTime(order.printJobEmailSentAt)}
              </p>
            ) : (
              <p className="text-xs text-ink-faint">Print-job email not yet sent</p>
            )}
          </section>

          {order.notes ? (
            <section className="flex flex-col gap-2 text-sm">
              <h2 className="label-caps">Internal notes</h2>
              <p className="whitespace-pre-wrap text-ink">{order.notes}</p>
            </section>
          ) : null}

          {children.length > 0 ? (
            <section className="flex flex-col gap-2 text-sm">
              <h2 className="label-caps">Reprints / reships ({children.length})</h2>
              <ul className="border-t border-ink-line">
                {children.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-baseline justify-between gap-3 border-b border-ink-line py-2"
                  >
                    <Link
                      href={`/admin/orders/${c.id}`}
                      className="underline underline-offset-4 text-ink-strong"
                    >
                      {c.id.slice(0, 8).toUpperCase()}
                    </Link>
                    <span className="text-xs text-ink-faint">{c.status.replace(/_/g, " ")}</span>
                    <span className="text-xs text-ink-faint">{formatDateTime(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="label-caps">Audit log</h2>
          <Link
            href={`/admin/audit?orderId=${encodeURIComponent(order.id)}`}
            className="text-xs text-ink-faint underline underline-offset-4"
          >
            Full audit log for this order
          </Link>
        </div>
        {audit.length === 0 ? (
          <p className="text-sm text-ink-faint">No audit entries yet.</p>
        ) : (
          <ul className="border-t border-ink-line text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 border-b border-ink-line py-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-strong">
                    {a.action}
                    <span className="ml-2 text-xs text-ink-faint">by {a.actor}</span>
                  </span>
                  <span className="text-xs text-ink-faint">{formatDateTime(a.createdAt)}</span>
                </div>
                {Object.keys(a.meta).length > 0 ? (
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-ink-faint">
                    {JSON.stringify(a.meta)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={strong ? "text-ink-strong" : "text-ink-faint"}>{label}</span>
      <span className={strong ? "text-ink-strong" : ""}>{value}</span>
    </div>
  );
}
