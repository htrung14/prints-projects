import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--ink-line)] px-6 py-8 text-xs md:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-4">
          <Link href="/information#shipping">Shipping</Link>
          <Link href="/information#returns">Returns</Link>
          <Link href="/information#terms">Terms</Link>
          <Link href="/information#privacy">Privacy</Link>
          <Link href="/information#imprint">Imprint</Link>
          <Link href="/information#contact">Contact</Link>
        </div>
        <div className="flex items-baseline gap-4 text-[var(--ink-faint)]">
          <span>Made to order in Brooklyn, NY</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
