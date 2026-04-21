"use client";

import Image from "next/image";
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { ScrollLink } from "./ScrollLink";

export default function LandingHero({ lead }: { lead: Photo }) {
  return (
    <section id="hero">
      <div className="hfb">
        <figure className="hfb-fig">
          <Image
            src={lead.imageUrl}
            alt={lead.imageAlt}
            fill
            priority
            sizes="100vw"
            className="img-protected object-cover"
            draggable={false}
            style={{ objectPosition: "center 30%" }}
          />
        </figure>
        <h1 className="hfb-center" style={{ margin: 0, fontWeight: "normal" }}>
          <span className="h-arabic" lang="ar">
            التمسّك
          </span>
          <span className="h-title">At-Tamassok</span>
        </h1>
        <div className="hfb-text">
          <div className="hfb-inner">
            <p className="h-pull">
              Small domestic rituals that repeat across distance and never quite translate.
            </p>
            <Link href="/essay" className="h-essay">
              Read the essay <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="hfb-rail">
          <ScrollLink href="#prints" target="prints" className="h-vp">
            View prints <span aria-hidden="true">↓</span>
          </ScrollLink>
        </div>
      </div>

      <style jsx global>{`
        #hero {
          position: relative;
        }

        .h-arabic {
          font-family: var(--font-arabic), "Noto Naskh Arabic", serif;
          font-size: clamp(48px, 5.5vw, 80px);
          font-weight: 700;
          color: #fff;
          line-height: 1;
          letter-spacing: 0.01em;
        }
        .h-title {
          font-family: var(--font-serif);
          font-size: clamp(28px, 3vw, 44px);
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.005em;
          line-height: 1.1;
        }
        .h-meta {
          margin-top: 6px;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        .h-pull {
          font-family: var(--font-serif);
          font-size: clamp(22px, 2vw, 28px);
          font-weight: 500;
          line-height: 1.55;
          color: #fff;
          margin: 0;
        }
        .h-essay {
          font-family: var(--font-serif);
          font-size: clamp(17px, 1.4vw, 20px);
          font-weight: 500;
          color: #fff;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 5px;
          text-decoration-color: rgba(255, 255, 255, 0.5);
          transition: opacity 180ms ease;
          align-self: flex-start;
        }
        .h-essay:hover {
          opacity: 0.55;
        }
        .h-vp {
          font-family: var(--font-sans);
          font-size: clamp(14px, 1.1vw, 16px);
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #fff;
          transition: opacity 180ms ease;
          display: inline-block;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
        }
        .h-vp:hover {
          opacity: 0.5;
        }

        .hfb {
          position: relative;
          height: calc(100dvh + var(--header-height, 63px));
          margin-top: calc(-1 * var(--header-height, 63px));
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .hfb-fig {
          margin: 0;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        .hfb-fig img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
        }
        .hfb-text {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: clamp(28px, 5vw, 56px) clamp(28px, 5vw, 56px) clamp(64px, 10vw, 120px);
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.45) 0%,
            rgba(0, 0, 0, 0.15) 60%,
            transparent 100%
          );
        }
        .hfb-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -65%);
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
          text-align: center;
        }
        .hfb-inner {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 560px;
        }
        .hfb-inner .h-pull {
          margin-top: 16px;
        }
        .hfb-rail {
          position: absolute;
          bottom: 22px;
          z-index: 3;
          left: clamp(28px, 5vw, 56px);
        }

        @media (min-width: 821px) {
          .hfb {
            height: calc(100dvh + var(--header-height, 63px) - 45px);
          }
        }
        @media (max-width: 820px) {
          .hfb {
            height: calc(90dvh + var(--header-height, 63px));
          }
          .hfb-text {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px 20px calc(80px + env(safe-area-inset-bottom, 0px));
          }
          .hfb-rail {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
