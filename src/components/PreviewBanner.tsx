import Link from "next/link";

/*
  Stakeholder preview banner. Rendered at the top of every mock page on the
  `stakeholder-preview` branch so reviewers always know they're looking at a
  preview deployment with placeholder data, not the live shop.

  Uses accent color at full saturation so it's unmissable; kept to a single
  thin strip so it doesn't dominate the layout underneath.
*/
export default function PreviewBanner() {
  return (
    <div
      style={{
        background: "var(--accent, #1529db)",
        color: "#fff",
        padding: "8px 16px",
        fontSize: "11px",
        fontWeight: 900,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        lineHeight: 1.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        flexWrap: "wrap",
        textAlign: "center",
      }}
    >
      <span>Stakeholder preview</span>
      <span style={{ opacity: 0.55 }}>·</span>
      <span style={{ fontWeight: 400, letterSpacing: "0.08em" }}>
        Not a live site · fake customer data for review
      </span>
      <span style={{ opacity: 0.55 }}>·</span>
      <Link
        href="/preview"
        style={{
          color: "#fff",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          fontWeight: 900,
        }}
      >
        All mocks
      </Link>
    </div>
  );
}
