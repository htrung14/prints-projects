import Link from "next/link";
import { REF_PATTERN } from "@/lib/orderRef";
import { getOrderByRefPrefix, getOrdersByEmail } from "@/lib/supabase/queries/orders";
import type { Order, OrderStatus } from "@/lib/types";
import TrackForm from "./TrackForm";

type SearchParams = Promise<{
  email?: string | string[];
  ref?: string | string[];
}>;

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Order received",
  queued_for_print: "Queued for print",
  sent_to_print: "Sent to printer",
  printed: "Printed",
  shipped: "Shipped",
  delivered: "Delivered",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  paid: "Payment received. Your order joins the next print batch (Tuesdays & Fridays).",
  queued_for_print: "In the queue for the next batch to the print lab in New York.",
  sent_to_print:
    "Being printed and inspected at the lab. Total time from order to delivery is 2–3 weeks within the United States, and 3–5 weeks internationally.",
  printed: "Printed, signed, and numbered. Packing and labeling now.",
  shipped:
    "Shipped. Tracking is below — allow a couple of days before the first carrier scan appears.",
  delivered:
    "Delivered. If anything arrived damaged, reply to the shipping confirmation within 14 days.",
  refunded: "This order has been refunded.",
  cancelled: "This order has been cancelled.",
};

const STATUS_STEPS: OrderStatus[] = [
  "paid",
  "queued_for_print",
  "sent_to_print",
  "printed",
  "shipped",
  "delivered",
];

function statusIndex(status: OrderStatus): number {
  const i = STATUS_STEPS.indexOf(status);
  return i === -1 ? 0 : i;
}

function carrierUrl(carrier: string | null, tracking: string): string | null {
  if (!carrier) return null;
  const c = carrier.toLowerCase();
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
  return null;
}

export default async function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawEmail = params.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const rawRef = params.ref;
  const ref = Array.isArray(rawRef) ? rawRef[0] : rawRef;

  let orders: Order[] = [];
  let searched = false;
  let lookupError = false;

  if (ref) {
    searched = true;
    const trimmed = ref.trim();
    // Validate the 8-hex ref at the edge so a bad query string doesn't
    // reach the query helper. Invalid refs are reported as "not found"
    // rather than an error to keep the UX consistent with an email miss.
    if (REF_PATTERN.test(trimmed)) {
      try {
        const order = await getOrderByRefPrefix(trimmed);
        orders = order ? [order] : [];
      } catch {
        orders = [];
        lookupError = true;
      }
    } else {
      orders = [];
    }
  } else if (email) {
    searched = true;
    try {
      orders = await getOrdersByEmail(email);
    } catch {
      orders = [];
      lookupError = true;
    }
  }

  // Pre-fill the form with whichever identifier the user already submitted.
  const defaultLookup = ref ?? email ?? "";

  return (
    <div className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-2xl space-y-10">
        <div className="space-y-4">
          <span className="label-caps">Track order</span>
          <h1 className="h-display text-4xl md:text-5xl">
            Where&rsquo;s my <em>print</em>?
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-ink">
            Enter the email address you used at checkout, or the 8-character order reference from
            your confirmation email.
          </p>
        </div>

        <TrackForm defaultValue={defaultLookup} />

        {searched && lookupError ? (
          <div className="space-y-4 border-t border-ink-line pt-10">
            <p className="text-lg text-ink">Something went wrong.</p>
            <p className="text-base text-ink-faint">
              Please try again, or contact us at{" "}
              <a href="mailto:info@thaliabassim.com" className="underline">
                info@thaliabassim.com
              </a>
              .
            </p>
          </div>
        ) : searched && orders.length === 0 ? (
          <div className="space-y-4 border-t border-ink-line pt-10">
            <p className="text-lg text-ink">
              {ref ? "No order found for that reference." : "No orders found for that email."}
            </p>
            <p className="text-base text-ink-faint">
              Double-check the {ref ? "reference" : "address"} or contact us at{" "}
              <a href="mailto:info@thaliabassim.com" className="underline">
                info@thaliabassim.com
              </a>
              .
            </p>
          </div>
        ) : null}

        {orders.length > 0 ? (
          <div className="space-y-8 border-t border-ink-line pt-10">
            <p className="text-base text-ink-faint">
              {orders.length} {orders.length === 1 ? "order" : "orders"} found
            </p>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : null}

        <div className="pt-4">
          <Link href="/" className="btn-ghost">
            Back to editions →
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const ref = order.id.slice(0, 8).toUpperCase();
  const step = statusIndex(order.status);
  const isFinal = order.status === "refunded" || order.status === "cancelled";

  return (
    <div className="space-y-6 border border-ink-line p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="font-mono text-lg text-ink-strong"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            #{ref}
          </p>
          <p className="mt-1 text-sm text-ink-faint">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-base text-ink-strong">{STATUS_LABELS[order.status]}</p>
          <p
            className="font-mono text-lg text-ink-strong"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCents(order.totalCents, order.currency)}
          </p>
        </div>
      </div>

      {!isFinal ? (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {STATUS_STEPS.map((s, i) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  backgroundColor: i <= step ? "var(--btn-accent)" : "var(--ink-line)",
                }}
              />
            ))}
          </div>
          <p className="text-sm text-ink-faint">{STATUS_DESCRIPTIONS[order.status]}</p>
        </div>
      ) : (
        <p className="text-sm text-ink-faint">{STATUS_DESCRIPTIONS[order.status]}</p>
      )}

      {order.trackingNumber ? (
        <div className="space-y-2 border-t border-ink-line pt-4">
          <p className="text-sm text-ink-faint">Tracking number</p>
          {carrierUrl(order.carrier, order.trackingNumber) ? (
            <a
              href={carrierUrl(order.carrier, order.trackingNumber)!}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-baseline gap-2 font-mono text-base text-ink-strong underline"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {order.trackingNumber}
              {order.carrier ? (
                <span className="text-sm text-ink-faint">{order.carrier}</span>
              ) : null}
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <p
              className="font-mono text-base text-ink-strong"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {order.trackingNumber}
              {order.carrier ? (
                <span className="ml-2 text-sm text-ink-faint">{order.carrier}</span>
              ) : null}
            </p>
          )}
        </div>
      ) : null}

      <div className="border-t border-ink-line pt-4">
        <p className="text-sm text-ink-faint">Shipping to</p>
        <p className="mt-1 text-base text-ink-strong">{order.shippingAddress.name}</p>
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
    </div>
  );
}
