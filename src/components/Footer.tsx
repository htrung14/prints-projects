import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink-line px-6 py-10 text-xs md:px-10">
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="label-caps mb-3">Studio</div>
          <p className="leading-relaxed">
            Brooklyn, NY
            <br />
            Made to order
          </p>
        </div>

        <div>
          <div className="label-caps mb-3">Info</div>
          <ul className="space-y-1.5">
            <li>
              <Link href="/information#shipping">Shipping</Link>
            </li>
            <li>
              <Link href="/information#returns">Returns</Link>
            </li>
            <li>
              <Link href="/information#terms">Terms</Link>
            </li>
            <li>
              <Link href="/information#privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/information#imprint">Imprint</Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="label-caps mb-3">Contact</div>
          <ul className="space-y-1.5">
            <li>
              <Link href="mailto:">Email</Link>
            </li>
            <li>
              <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
                Instagram ↗
              </Link>
            </li>
            <li>
              <Link href="/information#contact">Support</Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="label-caps mb-3">Newsletter</div>
          <p className="leading-relaxed text-ink-faint">
            Occasional notes on new editions and studio news.
          </p>
          <Link
            href="mailto:?subject=Subscribe%20to%20newsletter"
            className="mt-2 inline-block underline"
          >
            Subscribe →
          </Link>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3 border-t border-ink-line pt-6 text-ink-faint">
        <span>© {new Date().getFullYear()} Thalia Bassim</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}
