/**
 * /thank-you - post-payment order confirmation.
 *
 * Server component. Fetches order details from Supabase (created by
 * the webhook) and line items from Stripe. The webhook is still the
 * source of truth for fulfillment — this is display only.
 */

import Link from "next/link";
import { stripeClient } from "@/lib/stripe/client";
import { getOrderBySessionId } from "@/lib/supabase/queries/orders";
import ClearCart from "./ClearCart";
import TrackPurchase from "./TrackPurchase";

type SearchParams = Promise<{
  session_id?: string | string[];
}>;

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Title-case a free-form customer name for display.
 *
 * Buyers occasionally type their name all lowercase ("mr. j smith"),
 * which looks careless when echoed back verbatim. This is a defensive
 * cosmetic touch only — the stored value is unchanged.
 *
 * Only reformat when the input is entirely lowercase OR entirely uppercase:
 * anything with existing mixed case ("McDonald", "O'Brien", "van der Berg")
 * is assumed to be intentional and returned as-is — previous blanket
 * lowercase+capitalise damaged those names.
 *
 * Honorifics (Mr/Mrs/Ms/Dr/Prof/St) keep a trailing period even when
 * the buyer omitted it. Defensive against empty strings.
 */
function toNameCase(s: string): string {
  if (!s) return "";
  const trimmed = s.trim();
  if (!trimmed) return "";
  const hasMixedCase = trimmed !== trimmed.toLowerCase() && trimmed !== trimmed.toUpperCase();
  if (hasMixedCase) return trimmed; // user's intentional capitalisation stays
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      // common honorifics keep their period cap
      /^(mr|mrs|ms|dr|prof|st)\.?$/.test(w)
        ? w.charAt(0).toUpperCase() + w.slice(1) + (w.endsWith(".") ? "" : ".")
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

async function getSessionDetails(sessionId: string) {
  try {
    const stripe = stripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "shipping_cost.shipping_rate"],
    });
  } catch {
    return null;
  }
}

export default async function ThankYouPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawSid = params.session_id;
  const sessionId = Array.isArray(rawSid) ? rawSid[0] : rawSid;

  const [session, order] = await Promise.all([
    sessionId ? getSessionDetails(sessionId) : null,
    sessionId ? getOrderBySessionId(sessionId).catch(() => null) : null,
  ]);

  const lineItems = session?.line_items?.data ?? [];
  const shipping =
    ((session as unknown as Record<string, unknown>)?.shipping_details as
      | { name?: string; address?: Record<string, string | null> }
      | null
      | undefined) ?? session?.customer_details;
  const currency = session?.currency ?? order?.currency ?? "usd";
  const customerEmail = session?.customer_details?.email ?? order?.customerEmail ?? null;
  const customerName =
    shipping?.name ?? order?.shippingAddress?.name ?? session?.customer_details?.name ?? null;
  const orderRef = order?.id
    ? order.id.slice(0, 8).toUpperCase()
    : sessionId
      ? sessionId
          .replace(/^cs_(test|live)_/, "")
          .slice(0, 8)
          .toUpperCase()
      : null;

  if (!sessionId) {
    return (
      <div className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-xl space-y-5">
          <span className="label-caps">Order</span>
          <h1 className="h-display text-3xl">Something went wrong.</h1>
          <p className="text-sm leading-relaxed text-ink">
            We couldn&rsquo;t find your order details. If you completed a purchase, check your email
            for a confirmation — or contact us at info@thaliabassim.com.
          </p>
          <Link href="/" className="btn-ghost inline-block">
            Back to editions →
          </Link>
        </div>
      </div>
    );
  }

  if (session && session.payment_status !== "paid") {
    return (
      <div className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-xl space-y-5">
          <span className="label-caps">Payment</span>
          <h1 className="h-display text-3xl">Payment not completed.</h1>
          <p className="text-sm leading-relaxed text-ink">
            Your payment has not been confirmed yet. If you believe this is an error, please try
            again or contact us at info@thaliabassim.com.
          </p>
          <Link href="/checkout" className="btn-ghost inline-block">
            Return to checkout →
          </Link>
        </div>
      </div>
    );
  }

  // Edition sold out between payment and webhook confirmation — the webhook
  // auto-refunds and writes a refunded stub. Stripe still reports the session
  // as payment_status="paid", so without this branch a losing buyer would
  // see a success confirmation over a refunded stub.
  if (order?.status === "refunded") {
    return (
      <div className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-xl space-y-5">
          <span className="label-caps">Order</span>
          <h1 className="h-display text-3xl">Your order could not be fulfilled.</h1>
          <p className="text-sm leading-relaxed text-ink">
            This edition sold out between your payment and our confirmation. Your card has been
            refunded; it may take a few business days to appear on your statement. We&rsquo;re sorry
            — the remaining editions are live at thaliabassim.com.
          </p>
          <Link href="/" className="btn-ghost inline-block">
            Back to editions →
          </Link>
        </div>
      </div>
    );
  }

  if (!session && !order) {
    return (
      <div className="px-6 py-20 md:px-8">
        <div className="mx-auto max-w-xl space-y-5">
          <span className="label-caps">Order</span>
          <h1 className="h-display text-3xl">We couldn&rsquo;t retrieve your order.</h1>
          <p className="text-sm leading-relaxed text-ink">
            This may be a temporary issue. If you completed a purchase, you&rsquo;ll receive a
            confirmation email shortly. Contact info@thaliabassim.com if you need help.
          </p>
          <Link href="/" className="btn-ghost inline-block">
            Back to editions →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-20 md:px-8">
      <ClearCart />
      <TrackPurchase orderRef={orderRef} totalCents={order?.totalCents ?? 0} currency={currency} />
      <div className="mx-auto max-w-xl space-y-8">
        <div className="space-y-3">
          <span className="label-caps">Order confirmation</span>
          <h1
            className="font-serif italic"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.15, margin: 0 }}
          >
            Your order is in.
          </h1>
          {customerName && customerName.trim() ? (
            <p className="text-lg text-ink">Thank you, {toNameCase(customerName)}.</p>
          ) : null}
          {orderRef ? (
            <p className="text-sm text-ink-faint">
              Order{" "}
              <span className="font-mono text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                #{orderRef}
              </span>
            </p>
          ) : null}
        </div>

        {lineItems.length > 0 ? (
          <div className="space-y-6">
            <ul className="divide-y divide-ink-line border-y border-ink-line">
              {lineItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base text-ink-strong">{item.description}</p>
                    <p className="mt-1 text-sm text-ink-faint">Qty {item.quantity}</p>
                  </div>
                  <span
                    className="flex-none font-mono text-base text-ink-strong"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCents(item.amount_total, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 text-base">
              {session?.shipping_cost ? (
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Shipping</dt>
                  <dd
                    className="font-mono text-ink-strong"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {session.shipping_cost.amount_total === 0
                      ? "Free"
                      : formatCents(session.shipping_cost.amount_total, currency)}
                  </dd>
                </div>
              ) : order ? (
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Shipping</dt>
                  <dd
                    className="font-mono text-ink-strong"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {order.shippingCents === 0
                      ? "Free"
                      : formatCents(order.shippingCents, currency)}
                  </dd>
                </div>
              ) : null}
              {(session?.total_details?.amount_tax ?? order?.taxCents) ? (
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Tax</dt>
                  <dd
                    className="font-mono text-ink-strong"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCents(
                      session?.total_details?.amount_tax ?? order?.taxCents ?? 0,
                      currency
                    )}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-ink-line pt-2">
                <dt className="text-ink-strong">Total</dt>
                <dd
                  className="font-mono text-ink-strong"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatCents(session?.amount_total ?? order?.totalCents ?? 0, currency)}
                </dd>
              </div>
            </dl>
          </div>
        ) : order ? (
          <dl className="space-y-2 border-t border-ink-line pt-4 text-base">
            <div className="flex justify-between">
              <dt className="text-ink-faint">Subtotal</dt>
              <dd
                className="font-mono text-ink-strong"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatCents(order.subtotalCents, currency)}
              </dd>
            </div>
            {order.shippingCents > 0 ? (
              <div className="flex justify-between">
                <dt className="text-ink-faint">Shipping</dt>
                <dd
                  className="font-mono text-ink-strong"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatCents(order.shippingCents, currency)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-ink-line pt-2">
              <dt className="text-ink-strong">Total</dt>
              <dd
                className="font-mono text-ink-strong"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatCents(order.totalCents, currency)}
              </dd>
            </div>
          </dl>
        ) : null}

        {shipping?.address ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-faint">Shipping to</p>
            <p className="text-base text-ink-strong">{shipping.name}</p>
            <p className="text-sm text-ink">
              {[
                shipping.address.line1,
                shipping.address.line2,
                [shipping.address.city, shipping.address.state, shipping.address.postal_code]
                  .filter(Boolean)
                  .join(", "),
                shipping.address.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        ) : order?.shippingAddress ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-faint">Shipping to</p>
            <p className="text-base text-ink-strong">{order.shippingAddress.name}</p>
            <p className="text-sm text-ink">
              {[
                order.shippingAddress.line1,
                order.shippingAddress.line2,
                [
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                  order.shippingAddress.postalCode,
                ]
                  .filter(Boolean)
                  .join(", "),
                order.shippingAddress.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        ) : null}

        {customerEmail ? (
          <p className="text-base leading-relaxed text-ink">
            We&rsquo;ve sent a receipt to <span className="text-ink-strong">{customerEmail}</span>.
            You&rsquo;ll receive a second email with tracking once your print ships.
          </p>
        ) : (
          <p className="text-base leading-relaxed text-ink">
            A receipt is on its way to your inbox. You&rsquo;ll receive tracking once your print
            ships.
          </p>
        )}
        <p className="text-base leading-relaxed text-ink">
          Every edition is printed, signed, and numbered by hand. Please allow 2–3 weeks for
          delivery within the United States, and 3–5 weeks internationally.
        </p>

        <div className="flex flex-wrap gap-3 pt-3">
          <Link
            href="/track"
            className="inline-block px-8 py-3.5 text-center text-sm font-medium tracking-wider"
            style={{ background: "var(--btn-accent)", color: "#ffffff", letterSpacing: "0.04em" }}
          >
            Track your order →
          </Link>
          <Link href="/" className="btn-ghost is-secondary">
            Back to editions
          </Link>
        </div>
      </div>
    </div>
  );
}
