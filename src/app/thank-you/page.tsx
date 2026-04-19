/**
 * /thank-you - post-payment landing page.
 *
 * Server component. Reads `?session_id=...` for display only. We do NOT
 * hit Stripe or Supabase here - per design doc §7, the thank-you redirect
 * is not authoritative. The webhook at /api/webhooks/stripe is the source
 * of truth; we tell the customer their confirmation email is on the way.
 */

import Link from "next/link";
import ClearCart from "./ClearCart";

type SearchParams = Promise<{
  session_id?: string | string[];
}>;

export default async function ThankYouPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawSid = params.session_id;
  const sessionId = Array.isArray(rawSid) ? rawSid[0] : rawSid;

  // Cosmetic only - used so ops can cross-reference from a screenshot.
  const maskedSid = sessionId ? maskSessionId(sessionId) : null;

  return (
    <div className="border-t border-ink-line px-6 py-16 md:px-8">
      <ClearCart />
      <div className="mx-auto max-w-xl space-y-5">
        <span className="label-caps">Thank you</span>
        <h1 className="h-display text-3xl">
          Your order is <em>in</em>.
        </h1>
        <p className="text-sm leading-relaxed text-ink">
          Payment received. Your confirmation email will arrive shortly with the order number,
          shipping estimate, and - when your print is on its way - tracking.
        </p>
        <p className="text-sm leading-relaxed text-ink">
          Each print is made to order. Our printer signs, numbers, and packs every one by hand;
          expect a 3 to 4 week production window.
        </p>
        {maskedSid ? (
          <p className="text-[11px] text-ink-faint">
            Reference:{" "}
            <span className="text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
              {maskedSid}
            </span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className="btn-ghost">
            Back to editions →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Stripe Checkout session IDs look like `cs_live_abc…xyz` (35+ chars).
 * Showing the full string on a thank-you page is ugly and slightly leaky;
 * we keep enough to help support cross-reference.
 */
function maskSessionId(sid: string): string {
  if (sid.length <= 12) return sid;
  return `${sid.slice(0, 8)}…${sid.slice(-4)}`;
}
