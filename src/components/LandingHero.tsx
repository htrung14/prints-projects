"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Photo } from "@/lib/types";

export default function LandingHero({ lead }: { lead: Photo }) {
  const heroRef = useRef<HTMLElement>(null);
  const compRef = useRef<HTMLDivElement>(null);
  const lblsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const hero = heroRef.current;
    const comp = compRef.current;
    if (!hero || !comp) return;

    const mqMobile = window.matchMedia("(max-width: 700px)");
    let raf = false;

    function clearInline() {
      if (!comp) return;
      comp.style.opacity = "";
      comp.style.transform = "";
      lblsRef.current.forEach((l) => {
        if (l) l.style.opacity = "";
      });
    }

    function tick() {
      if (!hero || !comp) return;
      if (mqMobile.matches) {
        clearInline();
        raf = false;
        return;
      }
      const maxS = hero.offsetHeight - window.innerHeight;
      if (maxS <= 0) {
        raf = false;
        return;
      }
      const p = Math.min(1, Math.max(0, window.scrollY / maxS));

      const lA = p < 0.15 ? 1 : p > 0.5 ? 0 : 1 - (p - 0.15) / 0.35;
      lblsRef.current.forEach((l) => {
        if (l) l.style.opacity = String(lA);
      });

      const cA = p < 0.38 ? 1 : p > 0.78 ? 0 : 1 - (p - 0.38) / 0.4;
      // Desktop visual lift: shift the whole composition up a touch so the
      // image + surrounding labels feel centered in the viewport rather than
      // sitting low. lbl-bc (View Prints) compensates with a matching +3vh
      // translate so it stays pinned near the bottom of the fold.
      const baseLift = -3;
      const cY = baseLift + (p > 0.38 ? ((p - 0.38) / 0.4) * -9 : 0);
      comp.style.opacity = String(cA);
      comp.style.transform = `translateY(${cY}vh)`;

      raf = false;
    }

    function onScroll() {
      if (!raf) {
        requestAnimationFrame(tick);
        raf = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    mqMobile.addEventListener("change", () => {
      clearInline();
      tick();
    });
    tick();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const setLblRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) lblsRef.current[i] = el;
  };

  return (
    <section ref={heroRef} id="hero" className="relative" style={{ height: "150vh" }}>
      <div className="hero-pin sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div
          ref={compRef}
          className="comp relative will-change-[opacity,transform]"
          style={{ padding: "96px 0 180px" }}
        >
          {/* TL: Arabic + English title */}
          <div ref={setLblRef(0)} className="lbl-tl absolute left-0 top-0 md:absolute">
            <span
              className="block font-serif"
              lang="ar"
              style={{
                fontWeight: 500,
                fontSize: 40,
                color: "var(--i8)",
                marginBottom: 10,
                letterSpacing: "0.01em",
                lineHeight: 1.1,
              }}
            >
              التمسّك
            </span>
            <span
              className="block font-serif italic"
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.01em",
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              At-Tamassok
            </span>
          </div>

          {/* Double-rule mat around hero image */}
          <div className="mat-o">
            <div className="mat-i">
              <img
                src={lead.imageUrl}
                alt={lead.imageAlt}
                className="hero-frame-img img-protected block object-cover"
              />
            </div>
          </div>

          {/* BL: essay excerpt */}
          <div
            ref={setLblRef(1)}
            className="lbl-bl absolute left-0"
            style={{ bottom: 72, maxWidth: 240 }}
          >
            <p
              className="font-serif italic"
              style={{
                fontSize: 19,
                lineHeight: 1.6,
                color: "var(--i8)",
              }}
            >
              Small domestic rituals that repeat across distance and never quite translate.
            </p>
          </div>

          {/* BR: Read the essay */}
          <div
            ref={setLblRef(2)}
            className="lbl-br absolute right-0 text-right"
            style={{ bottom: 72 }}
          >
            <Link
              href="/essay"
              className="font-serif italic transition-opacity hover:opacity-30"
              style={{ fontSize: 19, color: "var(--i8)" }}
            >
              Read the essay →
            </Link>
          </div>

          {/* BC: VIEW PRINTS - smooth-scroll to the prints grid rather than
              jumping. Handler intercepts the native anchor jump, computes the
              target offset, and animates with prefers-reduced-motion respect. */}
          <div
            ref={setLblRef(3)}
            className="lbl-bc absolute text-center"
            style={{ bottom: 0, left: "50%", transform: "translate(-50%, 3vh)" }}
          >
            <Link
              href="#prints"
              onClick={(e) => {
                const target = document.getElementById("prints");
                if (!target) return;
                e.preventDefault();
                const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const top = target.getBoundingClientRect().top + window.scrollY - 16;
                window.scrollTo({
                  top,
                  behavior: reduceMotion ? "auto" : "smooth",
                });
                // Update the URL hash without a second jump so back-forward
                // still lands on the prints section.
                history.replaceState(null, "", "#prints");
              }}
              className="view-prints-link inline-block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink)",
              }}
            >
              View prints ↓
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile override: static stack, left-aligned to Arabic header */}
      <style jsx>{`
        /* Press animation - tactile scale-down on :active, paired with a soft
           translate on the ↓ arrow so the button feels like a nudge toward the
           print grid below. transition covers hover (opacity) and press
           (transform) on the same element. */
        .view-prints-link {
          transition:
            opacity 200ms ease,
            transform 140ms cubic-bezier(0.22, 0.61, 0.36, 1);
          will-change: transform;
        }
        .view-prints-link:hover {
          opacity: 0.5;
        }
        .view-prints-link:active {
          transform: scale(0.94) translateY(1px);
          opacity: 0.85;
        }
        @media (prefers-reduced-motion: reduce) {
          .view-prints-link,
          .view-prints-link:active {
            transform: none;
          }
        }
        .hero-frame-img {
          width: min(400px, 45vh);
          height: calc(min(400px, 45vh) * 1.25);
        }
        @media (max-width: 700px) {
          .hero-frame-img {
            width: min(74vw, 280px);
            height: calc(min(74vw, 280px) * 1.25);
          }
          section {
            height: auto !important;
          }
          section > div {
            position: static !important;
            height: auto !important;
            display: block !important;
            padding: 80px 28px 56px !important;
            overflow: visible !important;
          }
          .comp {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 0 !important;
          }
          .comp :global(.lbl-tl),
          .comp :global(.lbl-bl),
          .comp :global(.lbl-br),
          .comp :global(.lbl-bc),
          .comp :global(.mat-o) {
            position: static !important;
            transform: none !important;
          }
          .comp :global(.lbl-tl) {
            order: 0;
            margin-bottom: 28px;
          }
          .comp :global(.mat-o) {
            order: 1;
            align-self: flex-start !important;
          }
          .comp :global(.lbl-bl) {
            order: 2;
            margin-top: 36px;
            max-width: min(74vw, 280px) !important;
            width: min(74vw, 280px);
            font-size: 19px;
            line-height: 1.5;
            text-align: left;
          }
          .comp :global(.lbl-br) {
            order: 3;
            margin-top: 20px;
            max-width: min(74vw, 280px) !important;
            width: min(74vw, 280px);
            text-align: left !important;
            right: auto !important;
          }
          .comp :global(.lbl-bc) {
            order: 4;
            margin: 80px auto 24px !important;
            align-self: center !important;
          }
        }
      `}</style>
    </section>
  );
}
