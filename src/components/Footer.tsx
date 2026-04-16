import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="px-6 md:px-10"
      style={{
        fontSize: "var(--footer-size, 12px)",
        fontWeight: "var(--footer-weight, 400)" as unknown as number,
        lineHeight: 1.6,
        color: "var(--accent)",
        paddingTop: "var(--footer-py, 32px)",
        paddingBottom: "var(--footer-py, 32px)",
        borderTop: "var(--footer-border, 0px) solid var(--ink-line)",
      }}
    >
      <div className="flex flex-wrap items-baseline" style={{ gap: "var(--footer-gap, 80px)" }}>
        <span style={{ opacity: 0.7 }}>© {new Date().getFullYear()} Thalia Bassim</span>
        <Link href="mailto:">Contact</Link>
        <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
          Instagram ↗
        </Link>
        <Link href="/essay">Essay</Link>
        <Link href="/terms#shipping">Shipping</Link>
        <Link href="/terms#returns">Returns</Link>
        <Link href="/terms#terms">Terms</Link>
        <Link href="/terms#privacy">Privacy</Link>
        <span style={{ opacity: 0.6 }}>Brooklyn, NY</span>
      </div>
    </footer>
  );
}
