import PreviewBanner from "@/components/PreviewBanner";

/*
  MOCK of the Certificate of Authenticity PDF layout — editorial take.
  Served on the stakeholder-preview branch. Rendered as HTML at US Letter
  for preview. Leans on the same design language as the shop: Geist, accent
  blue, label-caps, plenty of whitespace. Not a stock certificate template.
*/

export default function CoaMock() {
  const data = {
    photoTitle: "Untitled,",
    photoTitleItalic: "03",
    photoYear: 2024,
    size: "11 × 14 in",
    paper: "Hahnemühle Photo Rag 308 gsm",
    medium: "Archival pigment print",
    editionNumber: 3,
    editionTotal: 10,
    customerName: "Jane Smith",
    purchaseDate: "April 15, 2026",
    orderId: "ORD-A7K4XM2",
    imageUrl: "/images/catalog/pl-6604-03.jpg",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e6e6e1",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
      }}
    >
      <style>{`
        body > div > div.app-shell > header,
        body > div > div.app-shell > footer {
          display: none !important;
        }
        body > div > div.app-shell {
          min-height: 0 !important;
        }
      `}</style>

      {/* The wrapping div has padding; banner needs to sit above it, so
          render through a fixed wrapper that bleeds to the viewport edge. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <PreviewBanner />
      </div>

      <div
        style={{
          background: "var(--accent, #1529db)",
          color: "#fff",
          padding: "10px 20px",
          fontSize: "12px",
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          maxWidth: "760px",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          marginTop: "28px",
        }}
      >
        <span>📄 COA preview (mock)</span>
        <span style={{ fontWeight: 400, opacity: 0.8, letterSpacing: "0.04em" }}>
          US Letter · 8.5 × 11 in
        </span>
      </div>

      {/* THE DOCUMENT */}
      <div
        style={{
          background: "#fff",
          width: "min(760px, 100%)",
          aspectRatio: "8.5 / 11",
          boxShadow: "0 20px 50px -20px rgba(0,0,0,0.25)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          padding: "54px 60px 44px",
          color: "rgba(0,0,0,0.92)",
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontWeight: 400,
          position: "relative",
        }}
      >
        {/* TOP STRIP */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingBottom: "14px",
            borderBottom: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 900,
              letterSpacing: "-0.01em",
              color: "rgba(0,0,0,1)",
            }}
          >
            Thalia Bassim
          </span>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.5)",
            }}
          >
            Certificate of Authenticity · {data.orderId}
          </span>
        </header>

        {/* BODY — image anchor-left at ~40%, title + metadata fills the rest.
            The photo + title are the hero; edition number is dry metadata
            right-aligned in the spec stack. */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "40% 1fr",
            gap: "56px",
            paddingTop: "52px",
          }}
        >
          {/* Image */}
          <div>
            <div
              style={{
                aspectRatio: "3/4",
                background: "#f4f4f0",
                overflow: "hidden",
              }}
            >
              <img
                src={data.imageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "40px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "32px",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  fontWeight: 900,
                  color: "rgba(0,0,0,1)",
                }}
              >
                {data.photoTitle}{" "}
                <em style={{ color: "var(--accent, #1529db)", fontStyle: "italic" }}>
                  {data.photoTitleItalic}
                </em>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(0,0,0,0.55)",
                  marginTop: "6px",
                }}
              >
                {data.photoYear}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                rowGap: "10px",
                columnGap: "20px",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              <div style={labelCaps}>Medium</div>
              <div style={valueRight}>{data.medium}</div>

              <div style={labelCaps}>Size</div>
              <div style={valueRight}>{data.size}</div>

              <div style={labelCaps}>Paper</div>
              <div style={valueRight}>{data.paper}</div>

              <div style={labelCaps}>Edition</div>
              <div style={valueRight}>
                {data.editionNumber} of {data.editionTotal}
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER — purchaser + signature */}
        <footer
          style={{
            marginTop: "auto",
            paddingTop: "30px",
            borderTop: "1px solid rgba(0,0,0,0.15)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            alignItems: "end",
          }}
        >
          <div>
            <div style={labelCaps}>Purchased by</div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "-0.01em",
                color: "rgba(0,0,0,1)",
              }}
            >
              {data.customerName}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(0,0,0,0.5)",
                marginTop: "2px",
              }}
            >
              {data.purchaseDate}
            </div>
          </div>

          <div>
            {/* Signature: clean baseline, no caps label. The line itself +
                Thalia's printed name below carry the meaning. Production
                inserts the PNG on top of the baseline. */}
            <div
              style={{
                height: "44px",
                borderBottom: "1px solid rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                paddingBottom: "4px",
                fontSize: "10px",
                color: "rgba(0,0,0,0.25)",
                fontStyle: "italic",
              }}
            >
              [ signature image here ]
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(0,0,0,0.6)",
                marginTop: "6px",
                letterSpacing: "0.01em",
              }}
            >
              Thalia Bassim
            </div>
          </div>
        </footer>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          maxWidth: "760px",
          width: "100%",
          fontSize: "13px",
        }}
      >
        <a
          href="/dispatch-mock"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: "4px",
            fontWeight: 900,
          }}
        >
          ← Back to dispatch mock
        </a>
        <span style={{ color: "#888", marginLeft: "auto" }}>
          Production renders this via @react-pdf/renderer to COA-{data.orderId}-{data.editionNumber}
          of{data.editionTotal}.pdf
        </span>
      </div>
    </div>
  );
}

const labelCaps = {
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "rgba(0,0,0,0.5)",
  alignSelf: "center",
};

const valueRight = {
  fontSize: "12px",
  color: "rgba(0,0,0,0.9)",
  fontWeight: 900,
  lineHeight: 1.5,
  textAlign: "right" as const,
};
