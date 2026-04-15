import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="border-t border-ink-line px-6 py-16 md:px-8">
      <div className="mx-auto max-w-xl space-y-5">
        <span className="label-caps">Demo</span>
        <h1 className="h-display text-3xl">
          This is a <em>demo</em>. Real checkout coming soon.
        </h1>
        <p className="text-sm leading-relaxed text-ink">
          The shop is in design review. Real Stripe checkout, order email, and print fulfillment
          will land once the brand and pricing are locked. For now, you can browse the catalog, add
          prints to a cart, and leave feedback using the button at the bottom right of any page.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/"
            className="inline-block bg-ink-strong px-5 py-3 text-bg hover:opacity-90"
            style={{ fontSize: "1rem", letterSpacing: "0.01em" }}
          >
            Back to catalog →
          </Link>
          <Link
            href="/information"
            className="inline-block border border-ink px-5 py-3 text-ink-strong hover:opacity-70"
            style={{ fontSize: "1rem" }}
          >
            Information
          </Link>
        </div>
      </div>
    </div>
  );
}
