import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Information — Brooklyn Prints",
  description: "Shipping, returns, terms of sale, privacy, and legal imprint for Brooklyn Prints.",
};

export default function InformationPage() {
  return (
    <div className="border-t border-[var(--ink-line)] px-6 py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
          <span className="label-caps">Contents</span>
          <a href="#about" className="underline">
            About
          </a>
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
          <a href="#contact" className="underline">
            Contact
          </a>
        </div>

        <Section id="about" heading="About">
          <p>
            Brooklyn Prints is a small shop run by a photographer based in Brooklyn, NY. Every
            photograph in the catalog is an edition of 10 prints, pooled across all sizes and
            papers. Once 10 prints of a photograph have sold in any combination, that edition is
            closed and will not be reprinted.
          </p>
          <p>
            Prints are made to order on archival pigment paper, signed and numbered on the verso.
            Each print ships with a 1 inch border for handling.
          </p>
          <p>
            The shop is currently in design review. Sections below marked <Tbd /> require input from
            the studio before launch.
          </p>
        </Section>

        <Section id="shipping" heading="Shipping &amp; Delivery">
          <p>
            <strong>Production lead time.</strong> Prints are made to order. Expected turnaround
            from order to dispatch:{" "}
            <Tbd label="print-shop lead time, typically 3 to 7 business days" />. An order
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
            confirmation email and on the order status page after payment. Local pickup is available
            at the Brooklyn studio only; it does not cover other New York City boroughs, Long
            Island, or New Jersey.
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

        <Section id="returns" heading="Refunds &amp; Returns">
          <p>
            Each print is made to order. We replace prints damaged in transit or with production
            defects within 14 days of delivery. Otherwise, all sales are final.
          </p>
          <p>
            <strong>How to request a replacement.</strong> Contact <Tbd label="support email" />{" "}
            with your order number and photographs of the damage or defect, including the packaging
            if possible. Replacements ship at no additional cost once the issue has been confirmed.
            Return shipping instructions are provided if required.
          </p>
          <p>
            Refunds, when approved, are issued to the original payment method via Stripe. Refund
            timing depends on your bank or card issuer.
          </p>
        </Section>

        <Section id="terms" heading="Terms of Sale">
          <p>
            <strong>Definitions.</strong> &quot;Studio&quot; refers to{" "}
            <Tbd label="studio legal name" />. &quot;Customer&quot; refers to the person placing an
            order through this site.
          </p>
          <p>
            <strong>Prices and payment.</strong> All prices are shown in USD. Payment is collected
            by Stripe at checkout. The studio does not store payment card details.
          </p>
          <p>
            <strong>Delivery.</strong> Estimated dispatch windows and transit times are provided in
            the Shipping section above. The studio is not responsible for delays caused by carriers,
            customs, or circumstances outside its reasonable control.
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
            <strong>Limitation of liability.</strong> The studio&apos;s total liability for any
            order is limited to the purchase price of that order.
          </p>
          <p>
            <strong>Governing law.</strong> These terms are governed by{" "}
            <Tbd label="jurisdiction, tied to the country of incorporation" />.
          </p>
        </Section>

        <Section id="privacy" heading="Privacy">
          <p>
            <strong>What we collect.</strong> When you place an order, we collect your name,
            shipping address, email address, and, at checkout, payment details handled by Stripe. We
            do not store full payment card numbers on our servers.
          </p>
          <p>
            <strong>How we use it.</strong> Your information is used only to fulfil your order, send
            order status updates, and respond to support requests.
          </p>
          <p>
            <strong>Third parties.</strong> We share necessary order details with the following
            service providers: Stripe (payment processing), Resend (transactional email), the print
            shop that produces your print, and the carrier that ships it. We do not sell or share
            your information for marketing purposes.
          </p>
          <p>
            <strong>Retention.</strong> Order records are retained for{" "}
            <Tbd label="retention period, typically 7 years for tax purposes" />.
          </p>
          <p>
            <strong>Your rights.</strong> You can request a copy or deletion of your order data by
            contacting <Tbd label="support email" />.
          </p>
        </Section>

        <Section id="imprint" heading="Legal Notice">
          <p>
            Studio legal name: <Tbd label="studio legal name" />
            <br />
            Registered address: <Tbd label="registered studio address" />
            <br />
            Company or registration number:{" "}
            <Tbd label="company or registration number, if incorporated" />
            <br />
            Contact email: <Tbd label="support email" />
          </p>
          <p className="text-[var(--ink-faint)]">
            This notice is provided for compliance with legal identification requirements in
            applicable jurisdictions. It is not a guarantee of service or warranty beyond what is
            stated in the Terms of Sale above.
          </p>
        </Section>

        <Section id="contact" heading="Contact">
          <p>
            For order support, shipping questions, or anything else, email{" "}
            <Tbd label="support email" />. We aim to reply within two business days.
          </p>
        </Section>

        <p className="mt-12 border-t border-[var(--ink-line)] pt-6 text-[var(--ink-faint)]">
          Last updated <time dateTime="2026-04-15">April 15, 2026</time>. This page is a demo draft
          and has not yet been reviewed by counsel.
        </p>
      </div>
    </div>
  );
}

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-[var(--ink-line)] py-8 first:border-t-0 first:pt-0"
    >
      <h2
        className="mb-4 text-[var(--ink-strong)]"
        style={{ fontSize: "22px", lineHeight: 1.2 }}
        dangerouslySetInnerHTML={{ __html: heading }}
      />
      <div className="space-y-4 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Tbd({ label }: { label?: string }) {
  return (
    <span className="inline-block border border-[var(--ink-line)] bg-[var(--bg-soft)] px-1.5 py-0.5 text-[11px] text-[var(--ink-faint)]">
      TBD{label ? `: ${label}` : ""}
    </span>
  );
}
