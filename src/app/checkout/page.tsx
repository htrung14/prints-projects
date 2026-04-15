import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="border-t border-[var(--ink-line)] px-6 py-16 md:px-8">
      <div className="mx-auto max-w-xl space-y-5">
        <span className="label-caps">Demo</span>
        <h1 className="h-display text-3xl">
          This is a <em>demo</em>. Real checkout coming soon.
        </h1>
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          The shop is in design review. Real Stripe checkout, order email, and print fulfillment
          will land once the brand and pricing are locked. For now, you can browse the catalog, add
          prints to a cart, and leave feedback using the button at the bottom right of any page.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/" className="border border-[var(--ink)] px-4 py-2 text-[var(--ink-strong)]">
            Back to catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
