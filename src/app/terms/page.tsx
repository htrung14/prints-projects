import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Thalia Bassim",
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
            <strong>Production lead time.</strong> Prints are made to order. Expected total delivery
            time: 2–3 weeks within the United States, 3–5 weeks internationally. An order
            confirmation email is sent at purchase; a second email is sent when the order
            dispatches.
          </p>
          <p>
            <strong>Domestic shipping (United States).</strong> Flat rate per size class, shipped by
            USPS Ground Advantage or Priority Mail with carrier insurance.
          </p>
          <p>
            <strong>International shipping.</strong> Worldwide dispatch via USPS International or
            DHL. Customs declarations use HS code 4911.91 (printed pictures, designs, photographs).
            International customers are responsible for any VAT, GST, or import duties collected by
            the destination country on delivery; these fees are not collected at checkout.
          </p>
          <p>
            <strong>Shipping rates.</strong> Shipping within the United States is free.
            International shipping is charged at a flat rate by region: $35 to Canada, $50 to the
            United Kingdom and EU, and $65 to Australia and the rest of world.
          </p>
          <p>
            <strong>Authentication.</strong> Every print ships with a numbered Certificate of
            Authenticity, signed by the artist.
          </p>
          <p>
            <strong>Reporting a shipping issue.</strong> If your order arrives damaged or does not
            arrive within a reasonable window, contact info@thaliabassim.com within fourteen days of
            the expected delivery date.
          </p>
        </Section>

        <Section id="returns" n={2} heading="Refunds &amp; Returns">
          <p>
            Each print is made to order and all sales are final. If your print arrives damaged,
            contact us within 14 days with a clear photo showing the damage alongside the sealed,
            unopened shipping packaging. We verify all claims against our shipping records before
            issuing replacements at no cost.
          </p>
          <p>
            <strong>How to request a replacement.</strong> Contact info@thaliabassim.com with your
            order number and photographs of the damage or defect, including the packaging if
            possible. Replacements ship at no additional cost once the issue has been confirmed.
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
            contacting info@thaliabassim.com. Once production has begun, orders cannot be cancelled.
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
            <strong>Governing law.</strong> These terms are governed by the laws of the State of New
            York, United States.
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
            contacting info@thaliabassim.com.
          </p>
        </Section>

        <Section id="imprint" n={5} heading="Legal Notice">
          <p>
            Legal name: Thalia Bassim
            <br />
            Contact email: info@thaliabassim.com
          </p>
        </Section>

        <p className="mt-12 text-ink-faint">
          Last updated <time dateTime="2026-04-20">April 20, 2026</time>.
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
