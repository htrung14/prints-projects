import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Info — Thalia Bassim",
  description: "About the artist.",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.7)",
  fontWeight: 600,
  marginBottom: 10,
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  fontFamily: "var(--font-serif)",
  fontSize: "clamp(16px, 1.6vw, 19px)" as string,
  fontWeight: 500,
  lineHeight: 1.65,
  color: "#fff",
};

export default function InfoPage() {
  return (
    <div
      style={{
        background: "#0072BB",
        color: "#fff",
        minHeight: "calc(100dvh - var(--header-height, 63px))",
        padding: "clamp(32px, 5vw, 56px) clamp(28px, 5vw, 64px)",
      }}
    >
      <article
        style={{
          maxWidth: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(28px, 4vw, 40px)",
        }}
      >
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          Thalia Bassim
        </h1>

        <div style={{ paddingLeft: "clamp(0px, 6vw, 80px)" }}>
          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              About
            </p>
            <p
              className="font-serif"
              style={{
                fontSize: "clamp(16px, 1.6vw, 19px)",
                lineHeight: 1.65,
                color: "#fff",
                fontWeight: 500,
                maxWidth: "58ch",
              }}
            >
              Thalia Bassim is a Lebanese visual artist, photographer, and storyteller based between
              New York and Beirut. Her practice explores memory, inheritance, and the emotional
              landscapes of place, often working with photography as a means of tracing personal and
              collective histories. Moving between documentation and constructed narrative, she
              returns to familiar sites, gestures, and archives to examine how time reshapes meaning
              and identity. Bassim&rsquo;s work is rooted in Lebanon, where family history,
              landscape, and repetition form an ongoing dialogue between past and present. She also
              incorporates AI image-making as part of her broader visual practice, expanding how
              images can be constructed, altered, and reinterpreted. Through this combination of
              processes, she reflects on what is preserved, what is transformed, and what resists
              disappearance.
            </p>
          </div>
        </div>

        <div style={{ paddingLeft: "clamp(0px, 24vw, 320px)" }}>
          <p
            style={{
              fontSize: 13,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Background
          </p>
          <p
            className="font-serif"
            style={{
              fontSize: "clamp(16px, 1.6vw, 19px)",
              lineHeight: 1.65,
              color: "#fff",
              fontWeight: 500,
              maxWidth: "58ch",
            }}
          >
            Alongside her artistic practice, she works in media, communications, and production,
            bringing a multidisciplinary approach to storytelling across platforms. Her work is
            driven by a commitment to creating images that hold memory, tension, and continuity in
            fragile balance.
          </p>
        </div>

        <div style={{ paddingLeft: "clamp(0px, 6vw, 80px)" }}>
          <p style={labelStyle}>Solo exhibitions</p>
          <ul style={listStyle}>
            <li>Maybe Scan Yourself? — Beirut, 2022</li>
            <li>Fake Park: Are you Subject to Change? — Beirut, 2021</li>
            <li>What has Become of Me? — Beirut, 2022</li>
          </ul>

          <p style={{ ...labelStyle, marginTop: 24 }}>Group exhibitions</p>
          <ul style={listStyle}>
            <li>Poetry in Space — Shatr Collective, Beirut, 2023</li>
            <li>Let The Whole Goddamn Thing Short-Circuit — Toxi Space, Zurich, 2023</li>
            <li>Scratch the surface, touch the sun — TAP, Niha, 2022</li>
            <li>I don&rsquo;t want to talk but — Zico House, Beirut, 2021</li>
          </ul>

          <p style={{ ...labelStyle, marginTop: 24 }}>Publications</p>
          <ul style={listStyle}>
            <li>Dazed MENA, 2025</li>
            <li>Al-Hayya Magazine, Beirut, 2022</li>
            <li>The Common Table, 2021</li>
          </ul>

          <p style={{ ...labelStyle, marginTop: 24 }}>Performance</p>
          <ul style={listStyle}>
            <li>Audio Performance with Rayyan Abdel Khalek — Beirut Synth Center, 2022</li>
          </ul>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "0 clamp(48px, 8vw, 120px)",
              alignItems: "start",
              marginTop: 24,
            }}
          >
            <div>
              <p style={labelStyle}>Commissions</p>
              <ul style={listStyle}>
                <li>Yalla Bala Manyake, 2021</li>
                <li>Temporary Art Platform, 2022</li>
                <li>Frequent Defect, 2022</li>
                <li>Shatr Collective, 2023</li>
                <li>SASi / Ocean Portal, 2021</li>
              </ul>
            </div>
            <div>
              <p style={labelStyle}>Correspond</p>
              <div
                className="font-serif"
                style={{
                  fontSize: "clamp(22px, 2.8vw, 32px)",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  marginBottom: 28,
                }}
              >
                <Link href="mailto:thalia@bassim.studio" style={{ color: "#fff" }}>
                  Email
                </Link>
                <Link
                  href="https://www.instagram.com/thaliabassim/"
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ color: "#fff" }}
                >
                  Instagram
                </Link>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto",
                  gap: "4px 20px",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.5,
                }}
              >
                <span>Design</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>ediciones studio</span>
                <span>Development</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>Hai Vo</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
