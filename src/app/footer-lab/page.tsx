import Link from "next/link";
import PreviewBanner from "@/components/PreviewBanner";
import { getAllPhotos } from "@/lib/photos";

export default function FooterLab() {
  const photos = getAllPhotos().slice(0, 3);

  return (
    <div>
      <PreviewBanner />
      <div className="border-b border-ink-line bg-bg-soft px-6 py-6 md:px-10">
        <div className="label-caps mb-2">Dev only · Footer lab</div>
        <h1 className="text-ink-strong" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>
          Seven footer variants
        </h1>
        <p className="mt-2 text-sm text-ink-faint">
          Scroll through F1–F7. Footer color is driven by the accent picker in the bottom-left.
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {[
            ["f1", "F1 · Current (minimal)"],
            ["f2", "F2 · Single horizontal row"],
            ["f3", "F3 · Loose-Joints split panel"],
            ["f4", "F4 · Cargo one-liner"],
            ["f5", "F5 · Big name type"],
            ["f6", "F6 · 3-column editorial"],
            ["f7", "F7 · Boxed soft panel"],
          ].map(([id, title]) => (
            <a key={id} href={`#${id}`} className="underline" style={{ color: "var(--accent)" }}>
              {title}
            </a>
          ))}
        </nav>
      </div>

      <Shell id="f1" title="F1 · Current (minimal — Contact column + copyright)" photos={photos}>
        <FooterF1 />
      </Shell>

      <Shell id="f2" title="F2 · Single horizontal row (all links inline)" photos={photos}>
        <FooterF2 />
      </Shell>

      <Shell id="f3" title="F3 · Loose-Joints split panel (address + contact rows)" photos={photos}>
        <FooterF3 />
      </Shell>

      <Shell id="f4" title="F4 · Cargo one-liner" photos={photos}>
        <FooterF4 />
      </Shell>

      <Shell id="f5" title="F5 · Big artist name, links tiny below" photos={photos}>
        <FooterF5 />
      </Shell>

      <Shell id="f6" title="F6 · 3-column editorial (Contact / Social / Legal)" photos={photos}>
        <FooterF6 />
      </Shell>

      <Shell id="f7" title="F7 · Boxed soft panel (bg-bg-soft)" photos={photos}>
        <FooterF7 />
      </Shell>
    </div>
  );
}

function Shell({
  id,
  title,
  photos,
  children,
}: {
  id: string;
  title: string;
  photos: ReturnType<typeof getAllPhotos>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-b border-ink-line">
      <div
        className="sticky z-10 border-b border-ink-line bg-bg-soft px-6 py-3 md:px-10"
        style={{ top: "calc(var(--header-height))" }}
      >
        <h2 className="text-ink-strong" style={{ fontSize: "1.1rem" }}>
          {title}
        </h2>
      </div>

      {/* Mock home page: hero (heading + image) + 3-photo grid */}
      <div className="grid gap-8 px-6 pb-14 pt-10 md:grid-cols-[1fr_1fr] md:gap-12 md:px-10">
        <div className="order-2 flex flex-col gap-5 self-end md:order-1">
          <div className="label-caps">At-Tamassok</div>
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
          <p className="drop-cap max-w-md text-sm leading-relaxed">
            Twenty-five frames from a single roll of 35mm film. Each photograph is made to order as
            an archival pigment print.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="#" className="btn-ghost">
              View editions →
            </Link>
            <Link href="#" className="btn-ghost is-secondary">
              Read essay
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={photos[0].imageUrl}
              alt={photos[0].imageAlt}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-3 pt-8 md:px-10">
        <div className="flex items-baseline justify-between">
          <div className="label-caps">Editions</div>
          <div className="text-xs text-ink-faint">{photos.length} photographs</div>
        </div>
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

      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* F1 — Current minimal                                                */
/* ------------------------------------------------------------------ */
function FooterF1() {
  return (
    <footer
      className="border-t border-ink-line px-6 py-10 md:px-10"
      style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.6, color: "var(--accent)" }}
    >
      <div>
        <div className="mb-3" style={{ color: "var(--accent)", opacity: 0.6 }}>
          Contact
        </div>
        <ul className="space-y-1.5">
          <li>
            <Link href="mailto:">Email</Link>
          </li>
          <li>
            <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
              Instagram ↗
            </Link>
          </li>
        </ul>
      </div>
      <div
        className="mt-10 flex flex-wrap items-baseline justify-between gap-3"
        style={{ opacity: 0.7 }}
      >
        <span>© {new Date().getFullYear()} Thalia Bassim</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* F2 — Single horizontal row                                          */
/* ------------------------------------------------------------------ */
function FooterF2() {
  return (
    <footer
      className="border-t border-ink-line px-6 py-8 md:px-10"
      style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.6, color: "var(--accent)" }}
    >
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span style={{ opacity: 0.7 }}>© {new Date().getFullYear()} Thalia Bassim</span>
        <Link href="mailto:">Email</Link>
        <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
          Instagram ↗
        </Link>
        <Link href="/essay">Essay</Link>
        <span className="ml-auto" style={{ opacity: 0.6 }}>
          Brooklyn, NY
        </span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* F3 — Loose-Joints split panel                                       */
/* ------------------------------------------------------------------ */
function FooterF3() {
  return (
    <footer
      className="border-t-[1.5px] bg-bg-soft px-6 py-12 md:px-10"
      style={{
        fontSize: "13px",
        fontWeight: 400,
        lineHeight: 1.6,
        color: "var(--accent)",
        borderTopColor: "var(--accent)",
      }}
    >
      <div className="grid gap-10 md:grid-cols-2">
        {/* LEFT — identity + address */}
        <div className="space-y-5">
          <div>
            <div className="text-ink-strong" style={{ fontSize: "18px", letterSpacing: "-0.01em" }}>
              Thalia Bassim
            </div>
            <div style={{ opacity: 0.7 }}>Photographer, Brooklyn, NY</div>
          </div>
          <div className="border-t pt-5" style={{ borderColor: "var(--accent)", opacity: 0.9 }}>
            <div style={{ opacity: 0.6 }}>Studio · Brooklyn, NY</div>
            <div>By appointment</div>
          </div>
        </div>
        {/* RIGHT — contact rows */}
        <div className="space-y-2">
          {[
            ["General", "studio@example.com"],
            ["Press", "press@example.com"],
            ["Sales", "sales@example.com"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4">
              <span style={{ opacity: 0.6 }}>{label}</span>
              <Link
                href={`mailto:${value}`}
                className="text-ink-strong"
                style={{ color: "var(--accent)" }}
              >
                {value}
              </Link>
            </div>
          ))}
          <div
            className="mt-4 border-t pt-4"
            style={{ borderColor: "var(--accent)", opacity: 0.9 }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span style={{ opacity: 0.6 }}>Social</span>
              <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
                Instagram ↗
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div
        className="mt-10 flex flex-wrap items-baseline justify-between gap-3 border-t pt-5"
        style={{ borderColor: "var(--accent)", opacity: 0.7 }}
      >
        <span>© {new Date().getFullYear()} Thalia Bassim</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* F4 — Cargo one-liner                                                */
/* ------------------------------------------------------------------ */
function FooterF4() {
  return (
    <footer
      className="px-6 py-8 text-center md:px-10"
      style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.6, color: "var(--accent)" }}
    >
      <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
        <span style={{ opacity: 0.7 }}>© {new Date().getFullYear()} Thalia Bassim</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ opacity: 0.7 }}>Brooklyn, NY</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <Link href="mailto:">Email</Link>
        <span style={{ opacity: 0.4 }}>·</span>
        <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
          Instagram ↗
        </Link>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* F5 — Big name type                                                  */
/* ------------------------------------------------------------------ */
function FooterF5() {
  return (
    <footer
      className="border-t border-ink-line px-6 py-14 md:px-10"
      style={{ color: "var(--accent)" }}
    >
      <div
        className="text-ink-strong"
        style={{
          fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          color: "var(--accent)",
        }}
      >
        Thalia <em>Bassim</em>
      </div>
      <div
        className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2"
        style={{ fontSize: "12px", opacity: 0.7 }}
      >
        <span>© {new Date().getFullYear()}</span>
        <span>Brooklyn, NY</span>
        <Link href="mailto:" style={{ opacity: 1 }}>
          Email
        </Link>
        <Link
          href="https://instagram.com"
          rel="noreferrer noopener"
          target="_blank"
          style={{ opacity: 1 }}
        >
          Instagram ↗
        </Link>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* F6 — 3-column editorial                                             */
/* ------------------------------------------------------------------ */
function FooterF6() {
  return (
    <footer
      className="border-t border-ink-line px-6 py-10 md:px-10"
      style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.6, color: "var(--accent)" }}
    >
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <div className="mb-3" style={{ opacity: 0.6 }}>
            Contact
          </div>
          <ul className="space-y-1.5">
            <li>
              <Link href="mailto:">Email</Link>
            </li>
            <li>
              <Link href="mailto:?subject=Press">Press</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3" style={{ opacity: 0.6 }}>
            Social
          </div>
          <ul className="space-y-1.5">
            <li>
              <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
                Instagram ↗
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3" style={{ opacity: 0.6 }}>
            Legal
          </div>
          <ul className="space-y-1.5">
            <li>
              <Link href="#">Terms &amp; conditions</Link>
            </li>
            <li>
              <Link href="#">Privacy</Link>
            </li>
            <li>
              <Link href="#">Imprint</Link>
            </li>
          </ul>
        </div>
      </div>
      <div
        className="mt-10 flex flex-wrap items-baseline justify-between gap-3 border-t pt-5"
        style={{ borderColor: "var(--accent)", opacity: 0.7 }}
      >
        <span>© {new Date().getFullYear()} Thalia Bassim · Brooklyn, NY</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* F7 — Boxed soft panel                                               */
/* ------------------------------------------------------------------ */
function FooterF7() {
  return (
    <div className="px-6 py-10 md:px-10">
      <footer
        className="bg-bg-soft px-6 py-10 md:px-10"
        style={{
          fontSize: "12px",
          fontWeight: 400,
          lineHeight: 1.6,
          color: "var(--accent)",
        }}
      >
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-ink-strong" style={{ fontSize: "16px", color: "var(--accent)" }}>
              Thalia Bassim
            </div>
            <div style={{ opacity: 0.7 }}>Brooklyn, NY · by appointment</div>
          </div>
          <div className="space-y-1.5 md:text-right">
            <div>
              <Link href="mailto:">Email</Link>
            </div>
            <div>
              <Link href="https://instagram.com" rel="noreferrer noopener" target="_blank">
                Instagram ↗
              </Link>
            </div>
          </div>
        </div>
        <div
          className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t pt-5"
          style={{ borderColor: "var(--accent)", opacity: 0.7 }}
        >
          <span>© {new Date().getFullYear()} Thalia Bassim</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
