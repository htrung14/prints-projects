import PreviewBanner from "@/components/PreviewBanner";
import { getAllPhotos } from "@/lib/photos";

const MUTED_BLUE = "#2a4d8f";

type ButtonProps = { label: string; primary?: boolean };

type VariantDef = {
  id: string;
  title: string;
  desc: string;
  Primary: (p: ButtonProps) => React.ReactElement;
  Secondary: (p: ButtonProps) => React.ReactElement;
};

const base = {
  fontSize: "1rem",
  letterSpacing: "0.01em" as const,
};

const VARIANTS: VariantDef[] = [
  {
    id: "a",
    title: "A · Pill",
    desc: "Rounded-full, condensed padding. Soft/modern.",
    Primary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-90"
        style={{
          backgroundColor: MUTED_BLUE,
          color: "#fff",
          borderRadius: 9999,
          padding: "10px 22px",
          ...base,
        }}
      >
        {label}
      </button>
    ),
    Secondary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-70"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          borderRadius: 9999,
          padding: "10px 22px",
          ...base,
        }}
      >
        {label}
      </button>
    ),
  },
  {
    id: "b",
    title: "B · Rectangle (smaller)",
    desc: "Closest to current shop, just scaled down.",
    Primary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-90"
        style={{
          backgroundColor: MUTED_BLUE,
          color: "#fff",
          padding: "10px 22px",
          ...base,
        }}
      >
        {label}
      </button>
    ),
    Secondary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-70"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          padding: "10px 22px",
          ...base,
        }}
      >
        {label}
      </button>
    ),
  },
  {
    id: "c",
    title: "C · Text + arrow (no box)",
    desc: "Least obtrusive. Loose Joints flavor.",
    Primary: ({ label }) => (
      <a
        href="#"
        className="inline-block hover:opacity-70"
        style={{
          color: MUTED_BLUE,
          textDecoration: "underline",
          textUnderlineOffset: "5px",
          fontSize: "16px",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </a>
    ),
    Secondary: ({ label }) => (
      <a
        href="#"
        className="inline-block hover:opacity-70"
        style={{
          color: MUTED_BLUE,
          fontSize: "16px",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </a>
    ),
  },
  {
    id: "d",
    title: "D · Small caps, outlined",
    desc: "Gallery/museum feel. Formal.",
    Primary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-90"
        style={{
          backgroundColor: MUTED_BLUE,
          color: "#fff",
          padding: "11px 22px",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 900,
        }}
      >
        {label}
      </button>
    ),
    Secondary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-70"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          padding: "11px 22px",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 900,
        }}
      >
        {label}
      </button>
    ),
  },
  {
    id: "e",
    title: "E · Ghost (fills on hover)",
    desc: "Minimal by default. Hover commits.",
    Primary: ({ label }) => (
      <button
        type="button"
        className="ghost-fill"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          backgroundColor: "transparent",
          padding: "10px 22px",
          transition: "background-color 160ms, color 160ms",
          ...base,
        }}
      >
        {label}
      </button>
    ),
    Secondary: ({ label }) => (
      <button
        type="button"
        className="ghost-fill"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          backgroundColor: "transparent",
          padding: "10px 22px",
          transition: "background-color 160ms, color 160ms",
          ...base,
        }}
      >
        {label}
      </button>
    ),
  },
  {
    id: "f",
    title: "F · Pure underline (no arrow)",
    desc: "Reads as a link, not a button.",
    Primary: ({ label }) => (
      <a
        href="#"
        className="inline-block hover:opacity-70"
        style={{
          color: MUTED_BLUE,
          textDecoration: "underline",
          textDecorationThickness: "1px",
          textUnderlineOffset: "5px",
          fontSize: "16px",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </a>
    ),
    Secondary: ({ label }) => (
      <a
        href="#"
        className="inline-block hover:opacity-70"
        style={{
          color: MUTED_BLUE,
          textDecoration: "underline",
          textDecorationThickness: "1px",
          textUnderlineOffset: "5px",
          fontSize: "16px",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </a>
    ),
  },
  {
    id: "g",
    title: "G · Chip with dot",
    desc: "Status-y. Dot implies live inventory.",
    Primary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-90"
        style={{
          backgroundColor: MUTED_BLUE,
          color: "#fff",
          borderRadius: 9999,
          padding: "9px 18px 9px 14px",
          fontSize: "14px",
          letterSpacing: "0.01em",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#fff",
            opacity: 0.9,
          }}
        />
        {label}
      </button>
    ),
    Secondary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-70"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          borderRadius: 9999,
          padding: "9px 18px 9px 14px",
          fontSize: "14px",
          letterSpacing: "0.01em",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: MUTED_BLUE,
          }}
        />
        {label}
      </button>
    ),
  },
  {
    id: "h",
    title: "H · Split (label + arrow divider)",
    desc: "Directional, news-site flavor.",
    Primary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-90"
        style={{
          backgroundColor: MUTED_BLUE,
          color: "#fff",
          padding: 0,
          fontSize: "16px",
          letterSpacing: "0.01em",
          display: "inline-flex",
          alignItems: "stretch",
        }}
      >
        <span style={{ padding: "10px 20px" }}>{label}</span>
        <span
          style={{
            padding: "10px 16px",
            borderLeft: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          →
        </span>
      </button>
    ),
    Secondary: ({ label }) => (
      <button
        type="button"
        className="transition-opacity hover:opacity-70"
        style={{
          border: `1px solid ${MUTED_BLUE}`,
          color: MUTED_BLUE,
          padding: 0,
          fontSize: "16px",
          letterSpacing: "0.01em",
          display: "inline-flex",
          alignItems: "stretch",
        }}
      >
        <span style={{ padding: "10px 20px" }}>{label}</span>
        <span
          style={{
            padding: "10px 16px",
            borderLeft: `1px solid ${MUTED_BLUE}`,
          }}
        >
          →
        </span>
      </button>
    ),
  },
];

export default function ButtonLab() {
  const photos = getAllPhotos().slice(0, 3);

  return (
    <div>
      <PreviewBanner />
      <style>{`
        .ghost-fill:hover { background-color: ${MUTED_BLUE} !important; color: #fff !important; }
      `}</style>

      <div className="border-b border-ink-line bg-bg-soft px-6 py-6 md:px-10">
        <div className="label-caps mb-2">Dev only · Button style lab</div>
        <h1 className="text-ink-strong" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>
          Each variant rendered in a mini home-page mockup
        </h1>
        <p className="mt-2 text-sm text-ink-faint">Scroll through A–H. Jump links below.</p>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {VARIANTS.map((v) => (
            <a
              key={v.id}
              href={`#variant-${v.id}`}
              className="underline"
              style={{ color: MUTED_BLUE }}
            >
              {v.title}
            </a>
          ))}
        </nav>
      </div>

      {VARIANTS.map((v) => (
        <VariantPreview key={v.id} variant={v} photos={photos} />
      ))}
    </div>
  );
}

function VariantPreview({
  variant,
  photos,
}: {
  variant: VariantDef;
  photos: ReturnType<typeof getAllPhotos>;
}) {
  const { Primary, Secondary } = variant;
  return (
    <section id={`variant-${variant.id}`} className="scroll-mt-16 border-b border-ink-line">
      <div
        className="sticky z-10 border-b border-ink-line bg-bg-soft px-6 py-3 md:px-10"
        style={{ top: "calc(var(--header-height))" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-ink-strong" style={{ fontSize: "1.1rem" }}>
            {variant.title}
          </h2>
          <span className="text-xs text-ink-faint">{variant.desc}</span>
        </div>
      </div>

      {/* Mini-home hero */}
      <div className="flex flex-col gap-5 px-6 pb-10 pt-10 md:px-10">
        <h3
          className="text-ink-strong"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 0.98,
            letterSpacing: "-0.02em",
            margin: 0,
            maxWidth: "14ch",
          }}
        >
          Roll <em>6604</em>,<br />a film archive
          <br />
          from Brooklyn.
        </h3>
        <div className="label-caps">At-Tamassok</div>
        <p className="drop-cap max-w-md text-sm leading-relaxed">
          Twenty-five frames from a single roll of 35mm film. Each photograph is made to order as an
          archival pigment print.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Primary label="View editions →" />
          <Secondary label="Read essay" />
        </div>
      </div>

      {/* Mini catalog row */}
      <div className="border-t border-ink-line px-6 pb-3 pt-8 md:px-10">
        <div className="label-caps">Editions preview</div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 px-6 pb-10 md:grid-cols-3 md:px-10">
        {photos.map((photo) => (
          <div key={photo.slug}>
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={photo.imageUrl}
                alt={photo.imageAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-xs">
              <span className="text-ink-strong">
                {photo.title}
                {photo.titleItalic ? (
                  <>
                    {" "}
                    <em>{photo.titleItalic}</em>
                  </>
                ) : null}
              </span>
              <span className="text-ink-faint">→</span>
            </div>
            <div className="mt-1 text-xs text-ink-faint">
              {photo.year} · Edition of {photo.editionTotal}
            </div>
          </div>
        ))}
      </div>

      {/* Mini buy-UI (Add to cart in this variant) */}
      <div className="border-t border-ink-line bg-bg-soft px-6 py-10 md:px-10">
        <div className="label-caps mb-2">Detail page preview</div>
        <div className="mb-4 flex items-baseline gap-4">
          <span
            className="text-ink-strong"
            style={{ fontSize: "1.75rem", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            $140
          </span>
          <span className="text-xs text-ink-faint">+ shipping. Free US on 2 prints or more.</span>
        </div>
        <Primary label="Add to cart →" />
      </div>
    </section>
  );
}
