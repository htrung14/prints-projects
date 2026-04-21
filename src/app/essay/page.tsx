import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "At-Tamassok - Essay - Thalia Bassim",
  description:
    "A written accompaniment to At-Tamassok, photographs from an ongoing archive of Lebanon, 2018–2026.",
};

export default function EssayPage() {
  return (
    <article className="essay-root">
      {/* ─── Full-bleed masthead ───────────────────────────────── */}
      <header className="essay-mast">
        <div className="essay-mast-inner">
          <span
            className="label-caps essay-kicker"
            style={{ color: "var(--i5)", letterSpacing: "0.12em" }}
          >
            Essay · At-Tamassok
          </span>

          <h1 className="essay-title" style={{ margin: 0 }}>
            <span className="font-serif essay-title-ar" lang="ar" style={{ color: "var(--ink)" }}>
              التمسّك
            </span>
            <span className="font-serif italic essay-title-en" style={{ color: "var(--i8)" }}>
              At-Tamassok
            </span>
          </h1>

          <div style={{ marginTop: "clamp(28px, 5vw, 44px)" }}>
            <p className="font-serif" style={{ fontSize: 14, color: "var(--i5)" }}>
              By Thalia Bassim
            </p>
          </div>
        </div>
      </header>

      {/* ─── Body ─────────────────────────────────────────────── */}
      <div className="essay-body">
        <section className="essay-measure">
          <p className="drop-cap essay-lede">
            I have been shooting film on a point and shoot camera since December 2018, during one of
            my first visits back to Lebanon after moving away for the first time in 2016. I started
            this practice instinctively, wanting to photograph everything I could before it faded. I
            always knew the things I loved would go away. Growing up in Lebanon, you get used to
            people leaving because of the circumstances of the country. It grows in your body but it
            isn&rsquo;t always clear what it is exactly. Places shift, everyday life carries a quiet
            sense of impermanence, and over time this rhythm becomes internal even if it&rsquo;s
            hard to name.
          </p>

          <p>
            Carrying a small camera that I could take out anytime allowed me to respond to moments
            as they unfolded, quickly and without overthinking. I built a reflex and an eye for when
            something felt worth holding onto. Over the years, the camera has stayed a simple but
            consistent tool. An extension of the heart. A way of noticing, framing, and keeping.
          </p>

          <p>
            The photographs in this series are part of an ongoing body of work that I am developing
            into my first book, spanning the years 2018 to 2026. They move between landscapes,
            people, and gestures, focusing less on events and more on presence, on what it feels
            like to be there, to witness, and to continue. The prints available here are fragments
            of that larger archive. Each image holds a moment that might otherwise pass, offering a
            way to keep it, share it, and return to it.
          </p>

          <p>
            This body of work is a living archive of Lebanon across years of instability and shifts
            with no moments of rest in between. A way to show that we existed and lived during these
            times, even when it felt like we didn&rsquo;t. In honor of everyone who has moved,
            stayed, and had to leave. In honor of the shifting image. We hold on together.
          </p>
        </section>

        {/* Quiet CTA back to prints */}
        <div className="essay-cta">
          <Link href="/#prints" className="essay-cta-link font-serif">
            View the prints →
          </Link>
        </div>
      </div>
    </article>
  );
}
