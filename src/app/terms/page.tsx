import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Thalia Bassim",
  description: "Shipping, returns, terms of sale, privacy, and legal information.",
};

export default function TermsPage() {
  return (
    <div className="px-6 py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
          <span className="label-caps">Contents</span>
          <a href="#shipping" className="underline">
            Shipping &amp; Delivery
          </a>
          <a href="#returns" className="underline">
            Refunds &amp; Returns
          </a>
          <a href="#terms" className="underline">
            Terms of Sale
          </a>
          <a href="#privacy" className="underline">
            Privacy
          </a>
          <a href="#imprint" className="underline">
            Legal Notice
          </a>
        </div>

        <Section id="shipping" n={1} heading="Shipping &amp; Delivery">
          <p>
            <strong>Production lead time.</strong> Prints are made to order. Expected turnaround
            from order to dispatch:{" "}
            <Tbd label="print-shop lead time, typically 2 to 3 business days" />. An order
            confirmation email is sent at purchase; a second email is sent when the order
            dispatches.
          </p>
          <p>
            <strong>Domestic shipping (United States).</strong> Flat rate per size class, shipped by
            USPS Ground Advantage or Priority Mail with carrier insurance. Free US shipping when the
            cart contains two or more prints of any sizes.
          </p>
          <p>
            <strong>International shipping.</strong> Worldwide dispatch from Brooklyn, NY via USPS
            International or DHL. Customs declarations use HS code 4911.91 (printed pictures,
            designs, photographs). International customers are responsible for any VAT, GST, or
            import duties collected by the destination country on delivery; these fees are not
            collected at checkout.
          </p>
          <p>
            <strong>Local pickup (Brooklyn, NY only).</strong> Customers in Brooklyn may select
            local pickup at checkout. The pickup address and window are provided in the order
            confirmation email and on the order status page after payment.
          </p>
          <p>
            <strong>Free shipping thresholds and flat rates.</strong>{" "}
            <Tbd label="free shipping threshold and per-zone flat rates once finalized" />
          </p>
          <p>
            <strong>Reporting a shipping issue.</strong> If your order arrives damaged or does not
            arrive within a reasonable window, contact <Tbd label="support email" /> within seven
            business days of the expected delivery date.
          </p>
        </Section>

        <Section id="returns" n={2} heading="Refunds &amp; Returns">
          <p>
            Each print is made to order. We replace prints damaged in transit or with production
            defects within 14 days of delivery. Otherwise, all sales are final.
          </p>
          <p>
            <strong>How to request a replacement.</strong> Contact <Tbd label="support email" />{" "}
            with your order number and photographs of the damage or defect, including the packaging
            if possible. Replacements ship at no additional cost once the issue has been confirmed.
          </p>
          <p>
            Refunds, when approved, are issued to the original payment method via Stripe. Refund
            timing depends on your bank or card issuer.
          </p>
        </Section>

        <Section id="terms" n={3} heading="Terms of Sale">
          <p>
            <strong>Prices and payment.</strong> All prices are shown in USD. Payment is collected
            by Stripe at checkout. We do not store payment card details.
          </p>
          <p>
            <strong>Delivery.</strong> Estimated dispatch windows and transit times are provided in
            the Shipping section above. We are not responsible for delays caused by carriers,
            customs, or circumstances outside reasonable control.
          </p>
          <p>
            <strong>Customs and duties.</strong> International orders are shipped on a
            delivered-duty-unpaid (DDU) basis. The customer is responsible for any import duties,
            VAT, or handling fees charged by the destination country.
          </p>
          <p>
            <strong>Cancellations.</strong> Orders may be cancelled before production begins by
            contacting <Tbd label="support email" />. Once production has begun, orders cannot be
            cancelled.
          </p>
          <p>
            <strong>Intellectual property.</strong> All photographs remain the copyright of the
            photographer. Purchase of a print grants the customer the right to display the print
            privately. Reproduction, commercial use, and redistribution are not permitted without
            written permission.
          </p>
          <p>
            <strong>Limitation of liability.</strong> Total liability for any order is limited to
            the purchase price of that order.
          </p>
          <p>
            <strong>Governing law.</strong>{" "}
            <Tbd label="jurisdiction, tied to the country of incorporation" />
          </p>
        </Section>

        <Section id="privacy" n={4} heading="Privacy">
          <p>
            <strong>What we collect.</strong> When you place an order, we collect your name,
            shipping address, email address, and, at checkout, payment details handled by Stripe. We
            do not store full payment card numbers.
          </p>
          <p>
            <strong>How we use it.</strong> Your information is used only to fulfil your order, send
            order status updates, and respond to support requests.
          </p>
          <p>
            <strong>Third parties.</strong> We share necessary order details with Stripe (payment),
            Resend (transactional email), the print lab, and the carrier. We do not sell or share
            your information for marketing purposes.
          </p>
          <p>
            <strong>Your rights.</strong> You can request a copy or deletion of your order data by
            contacting <Tbd label="support email" />.
          </p>
        </Section>

        <Section id="imprint" n={5} heading="Legal Notice">
          <p>
            Studio legal name: <Tbd label="studio legal name" />
            <br />
            Registered address: <Tbd label="registered studio address" />
            <br />
            Contact email: <Tbd label="support email" />
          </p>
        </Section>

        <p className="mt-12 text-ink-faint">
          Last updated <time dateTime="2026-04-15">April 15, 2026</time>. This page is a demo draft
          and has not yet been reviewed by counsel.
        </p>
      </div>
    </div>
  );
}

function Section({
  id,
  n,
  heading,
  children,
}: {
  id: string;
  n: number;
  heading: string;
  children: React.ReactNode;
}) {
  const num = String(n).padStart(2, "0");
  return (
    <section id={id} className="scroll-mt-24 grid gap-6 py-10 md:grid-cols-[90px_1fr] md:gap-10">
      <div className="label-caps pt-1 text-ink-faint">{num}</div>
      <div>
        <h2
          className="mb-6 text-ink-strong"
          style={{ fontSize: "28px", lineHeight: 1.1, letterSpacing: "-0.01em" }}
          dangerouslySetInnerHTML={{ __html: heading }}
        />
        <div className="space-y-4 text-sm leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

function Tbd({ label }: { label?: string }) {
  return (
    <span className="inline-block border border-ink-line bg-bg-soft px-1.5 py-0.5 text-[11px] text-ink-faint">
      TBD{label ? `: ${label}` : ""}
    </span>
  );
}
