/**
 * Thin notice strip at the very top of the page. Signals to stakeholders
 * reviewing the preview that this is a demo — no real payments, no real orders.
 *
 * Remove this component (and its mount in `src/app/layout.tsx`) before the
 * site accepts real payments.
 */
export default function DemoBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-bg-soft px-6 py-2 text-center md:px-10"
      style={{ borderBottom: "1px solid var(--i1)", color: "var(--i5)" }}
    >
      Demo preview · not accepting payments · checkout is disabled
    </div>
  );
}
