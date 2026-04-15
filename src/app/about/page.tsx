export default function AboutPage() {
  return (
    <div className="border-t border-[var(--ink-line)] px-6 py-12 md:px-8">
      <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed">
        <span className="label-caps">Info</span>
        <h1 className="h-display text-2xl">About this shop</h1>
        <p>
          This is a demo build of a small print shop for a Brooklyn, NY photographer. Each
          photograph is an edition of 10 prints, pooled across all sizes and papers. Once 10 prints
          of a photograph have sold (in any combination), that edition is closed.
        </p>
        <p>
          Prints are made to order. We replace prints damaged in transit or with production defects
          within 14 days of delivery.
        </p>
        <p className="text-[var(--ink-faint)]">
          The catalog data, copy, and imagery on this page are placeholders for stakeholder review.
        </p>
      </div>
    </div>
  );
}
