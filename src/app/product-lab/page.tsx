import { notFound } from "next/navigation";
import { getAllPhotos } from "@/lib/photos";

export default function ProductLab() {
  if (process.env.NODE_ENV === "production") notFound();
  const photo = getAllPhotos()[0];

  return (
    <div>
      <div className="border-b border-ink-line bg-bg-soft px-6 py-6 md:px-10">
        <div className="label-caps mb-2">Dev only · Product page lab</div>
        <h1 className="text-ink-strong" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>
          Five product-page layouts
        </h1>
        <p className="mt-2 text-sm text-ink-faint">
          Each mock is a full product-page candidate. Scroll and compare.
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {[
            ["p1", "P1 · Stacked single column"],
            ["p2", "P2 · Photo dominant, buy floats"],
            ["p3", "P3 · Gallery-left, info-right"],
            ["p4", "P4 · Film-strip top, buy inline"],
            ["p5", "P5 · Two-pane sticky photo"],
          ].map(([id, title]) => (
            <a key={id} href={`#${id}`} className="underline" style={{ color: "var(--accent)" }}>
              {title}
            </a>
          ))}
        </nav>
      </div>

      <Variant id="p1" title="P1 · Stacked single column (classic e-comm)">
        <P1 photo={photo} />
      </Variant>

      <Variant id="p2" title="P2 · Photo dominant · buy floats bottom-right">
        <P2 photo={photo} />
      </Variant>

      <Variant id="p3" title="P3 · Gallery-left, info-right (2 cols, no meta rail)">
        <P3 photo={photo} />
      </Variant>

      <Variant id="p4" title="P4 · Film-strip top, buy inline below (editorial long-scroll)">
        <P4 photo={photo} />
      </Variant>

      <Variant id="p5" title="P5 · Two-pane sticky photo, scrolling info (museum wall label)">
        <P5 photo={photo} />
      </Variant>
    </div>
  );
}

function Variant({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
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
      {children}
    </section>
  );
}

type Photo = ReturnType<typeof getAllPhotos>[number];

/* ------------------------------------------------------------------ */
/* Shared sub-blocks                                                   */
/* ------------------------------------------------------------------ */

function Title({ photo, size = "big" }: { photo: Photo; size?: "big" | "med" }) {
  return (
    <h3
      className="text-ink-strong"
      style={{
        fontSize: size === "big" ? "clamp(2rem, 3.2vw, 2.75rem)" : "clamp(1.5rem, 2vw, 2rem)",
        lineHeight: 1.05,
        letterSpacing: "-0.015em",
        margin: 0,
      }}
    >
      {photo.title}
      {photo.titleItalic ? (
        <>
          {" "}
          <em>{photo.titleItalic}</em>
        </>
      ) : null}
    </h3>
  );
}

function EditionBox({ photo }: { photo: Photo }) {
  const remaining = photo.editionTotal - photo.editionSold;
  return (
    <div className="flex items-center justify-between border border-ink bg-bg-soft px-4 py-3">
      <div>
        <div className="label-caps mb-0.5 text-ink-faint">Edition</div>
        <div className="text-ink-strong" style={{ fontSize: "0.9rem" }}>
          of {photo.editionTotal}
        </div>
      </div>
      <div className="text-right">
        <div className="label-caps mb-0.5 text-ink-faint">Status</div>
        <div className="text-ink-strong" style={{ fontSize: "0.9rem" }}>
          {remaining} remaining
        </div>
      </div>
    </div>
  );
}

function Controls({ photo }: { photo: Photo }) {
  return (
    <div className="border-2 border-ink-strong">
      <Row label="Size" value={photo.sizes[0].label} />
      <Row label="Paper" value={photo.papers[0].name} />
      <Row label="Qty" value="1" last />
    </div>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr] items-center gap-6 px-4 py-3 ${
        last ? "" : "border-b border-ink-line"
      }`}
    >
      <span className="text-ink-strong" style={{ fontSize: "0.875rem" }}>
        {label}
      </span>
      <span className="text-right text-ink-strong" style={{ fontSize: "0.875rem" }}>
        {value} ˅
      </span>
    </div>
  );
}

function PriceBlock() {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-ink-strong"
        style={{ fontSize: "1.75rem", lineHeight: 1, letterSpacing: "-0.02em" }}
      >
        $140
      </span>
      <span className="text-xs text-ink-faint">+ shipping. Free US on 2 prints or more.</span>
    </div>
  );
}

function AddToCart({ full = true }: { full?: boolean }) {
  return (
    <button type="button" className={`btn-ghost ${full ? "w-full" : ""} text-center`}>
      Add to cart →
    </button>
  );
}

function Meta({ photo }: { photo: Photo }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
      <dt className="text-ink-faint">Medium</dt>
      <dd className="text-ink-strong">Archival pigment print</dd>
      <dt className="text-ink-faint">Edition</dt>
      <dd className="text-ink-strong">of {photo.editionTotal}</dd>
      <dt className="text-ink-faint">Year</dt>
      <dd className="text-ink-strong">{photo.year}</dd>
    </dl>
  );
}

function Description({ photo }: { photo: Photo }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {photo.description.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* P1 - Stacked single column                                          */
/* ------------------------------------------------------------------ */
function P1({ photo }: { photo: Photo }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <div className="bg-bg-soft p-6">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="mx-auto w-full object-contain"
          style={{ maxHeight: "70vh" }}
        />
      </div>
      <div className="mt-8 flex flex-col gap-6">
        <Title photo={photo} />
        <Meta photo={photo} />
        <Description photo={photo} />
        <EditionBox photo={photo} />
        <Controls photo={photo} />
        <div className="flex flex-col gap-4">
          <PriceBlock />
          <AddToCart />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* P2 - Photo dominant, buy floats                                     */
/* ------------------------------------------------------------------ */
function P2({ photo }: { photo: Photo }) {
  return (
    <div className="relative px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="bg-bg-soft p-8">
          <img
            src={photo.imageUrl}
            alt={photo.imageAlt}
            className="mx-auto w-full object-contain"
            style={{ maxHeight: "80vh" }}
          />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-5">
            <Title photo={photo} />
            <Meta photo={photo} />
            <Description photo={photo} />
          </div>
          <div />
        </div>
      </div>

      {/* Floating buy card - bottom right, sticky within section */}
      <div
        className="sticky bottom-6 ml-auto mt-10 w-full max-w-sm border border-ink bg-bg p-5 shadow-lg"
        style={{ boxShadow: "0 12px 32px -12px rgba(0,0,0,0.18)" }}
      >
        <div className="flex items-baseline justify-between">
          <span className="label-caps text-ink-faint">Edition</span>
          <span className="text-xs text-ink-faint">
            {photo.editionTotal - photo.editionSold} of {photo.editionTotal} remaining
          </span>
        </div>
        <div className="mt-3">
          <Controls photo={photo} />
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <PriceBlock />
        </div>
        <div className="mt-4">
          <AddToCart />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* P3 - Gallery-left, info-right                                       */
/* ------------------------------------------------------------------ */
function P3({ photo }: { photo: Photo }) {
  return (
    <div className="grid gap-10 px-6 py-10 md:grid-cols-[3fr_2fr] md:gap-16 md:px-10">
      <div className="bg-bg-soft p-6">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="w-full object-contain"
          style={{ maxHeight: "85vh" }}
        />
      </div>
      <div className="flex flex-col gap-6">
        <Title photo={photo} />
        <EditionBox photo={photo} />
        <Controls photo={photo} />
        <div className="flex flex-col gap-4">
          <PriceBlock />
          <AddToCart />
        </div>
        <div className="border-t border-ink-line pt-6">
          <Meta photo={photo} />
        </div>
        <Description photo={photo} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* P4 - Film-strip top, buy inline                                     */
/* ------------------------------------------------------------------ */
function P4({ photo }: { photo: Photo }) {
  return (
    <div>
      <div className="bg-bg-soft px-6 py-12 md:px-10">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="mx-auto w-full object-contain"
          style={{ maxHeight: "75vh", maxWidth: "900px" }}
        />
      </div>
      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Title photo={photo} />
            <div className="flex flex-wrap gap-x-4 text-xs text-ink-faint">
              <span>Archival pigment print</span>
              <span>·</span>
              <span>Edition of {photo.editionTotal}</span>
              <span>·</span>
              <span>{photo.year}</span>
            </div>
          </div>
          <Description photo={photo} />
          <EditionBox photo={photo} />
          <Controls photo={photo} />
          <div className="flex flex-col gap-4">
            <PriceBlock />
            <AddToCart />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* P5 - Two-pane sticky photo, scrolling info                          */
/* ------------------------------------------------------------------ */
function P5({ photo }: { photo: Photo }) {
  return (
    <div className="grid md:grid-cols-2">
      {/* Photo pane - sticky to viewport */}
      <div
        className="md:sticky md:self-start"
        style={{
          top: "calc(var(--header-height) + 48px)",
          height: "calc(100vh - var(--header-height) - 48px)",
        }}
      >
        <div className="flex h-full items-center justify-center bg-bg-soft p-6">
          <img
            src={photo.imageUrl}
            alt={photo.imageAlt}
            className="max-h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Scrolling info pane */}
      <div className="flex flex-col gap-8 px-6 py-12 md:px-10">
        <Title photo={photo} />
        <Meta photo={photo} />
        <Description photo={photo} />
        <EditionBox photo={photo} />
        <Controls photo={photo} />
        <div className="flex flex-col gap-4">
          <PriceBlock />
          <AddToCart />
        </div>
        {/* Extra filler so the sticky effect is obvious */}
        <div className="space-y-3 text-xs text-ink-faint">
          <p className="label-caps">More detail</p>
          <p>
            Prints are made to order on archival pigment paper with a 1 inch border for handling.
            Edition of ten pooled across all sizes and papers - once ten prints have sold in any
            combination, the edition is closed.
          </p>
          <p>
            Shipping by USPS Priority with insurance. Flat-shipped up to 11×14; tubed above that.
            International shipping available; customs fees are the collector&apos;s responsibility.
          </p>
          <p>
            Returns accepted only for damage in transit or production defects, within 14 days of
            delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
