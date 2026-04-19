import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="flex flex-col gap-[18px] border-t border-ink-line px-5 py-9 md:px-11 md:pb-10"
      style={{
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: "var(--i5)",
      }}
    >
      <span style={{ letterSpacing: "0.03em", textTransform: "none" }}>
        © {new Date().getFullYear()} Thalia Bassim
      </span>
      <div className="flex flex-wrap items-baseline" style={{ gap: "32px 36px" }}>
        <Link href="mailto:thalia@bassim.studio" className="transition-colors hover:text-ink">
          Contact
        </Link>
        <Link
          href="https://instagram.com"
          rel="noreferrer noopener"
          target="_blank"
          className="transition-colors hover:text-ink"
        >
          Instagram ↗
        </Link>
        <Link href="/terms#shipping" className="transition-colors hover:text-ink">
          Shipping
        </Link>
        <Link href="/terms" className="transition-colors hover:text-ink">
          Terms
        </Link>
      </div>
    </footer>
  );
}
