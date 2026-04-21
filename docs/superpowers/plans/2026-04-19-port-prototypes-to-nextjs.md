# Port Finalized Prototype Visuals to Next.js App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Next.js app's landing hero, catalog grid, header, footer, product page, and buy UI with the visuals agreed on in `design-extract-output/frame-prototype.html` + `design-extract-output/product-prototype.html`, while preserving all existing business logic (cart context, Stripe checkout, Supabase/S3/Resend back-end, data fixture).

**Architecture:** The app's information architecture (routes, cart state, pricing, data loading) stays intact. What changes is the **visual layer** — tokens in `globals.css`, and the JSX/Tailwind markup of ~8 components. The prototypes' patterns translate directly: the sticky-pin frame hero, the 1px-rule 2-col catalog, and the disclosure-driven rail are all implementable in React with CSS + a couple of `useEffect` scroll handlers.

**Tech Stack:** Next.js 16.2.3 (App Router, async params), React 19.2.4, Tailwind CSS 4, custom local Favorit font, EB Garamond + Geist Mono + Noto Naskh Arabic via `next/font/google`. No new dependencies.

**Reference prototypes (source of truth for visuals):**
- `design-extract-output/frame-prototype.html` — landing (hero + catalog)
- `design-extract-output/product-prototype.html` — product detail (gallery + rail + cross-sell)

**Token alignment (change in globals.css):**
| Role | Current | Prototype (target) |
|---|---|---|
| `--bg` | `#f7f5f0` | `#faf9f6` |
| ink @ full | `rgba(35,30,25,.95)` | `rgba(12,11,10,1)` |
| rule line | `--ink-line: rgba(35,30,25,.14)` | `--rule: rgba(12,11,10,.22)` + keep `--ink-line` as `.12` alias |
| Need new | — | `--i8 .92`, `--i5 .70`, `--i3 .52`, `--i1 .12` |

Keep existing token names (`--ink`, `--ink-strong`, `--ink-faint`, `--ink-line`) so we don't break unrelated code; just re-point them to the new prototype values and add the `--i*` family as new aliases.

---

## File Structure

- **Modify** `src/app/globals.css` — adopt prototype palette, add `--i*` tiers, add `--rule`, add `.double-rule-mat` utility, add disclosure CSS primitives (`.disc`, `.d-body` 0fr→1fr animation).
- **Modify** `src/components/Header.tsx` — drop middle-nav Arabic, drop Essay link, landing-page reveal-on-scroll.
- **Modify** `src/components/Footer.tsx` — two-row: copyright on row 1, links on row 2 with `gap: 32px 36px`. Links: Contact, Instagram ↗, Shipping, Terms.
- **Modify** `src/app/page.tsx` — replace image-overlay hero with frame-prototype composition (sticky-pin desktop, left-aligned stack mobile). Catalog bar + `<CatalogGrid>`.
- **Modify** `src/components/CatalogGrid.tsx` — drop collage/grid toggle. Simple 2-col grid (3-col at >1400px) with cell borders.
- **Modify** `src/components/PhotoCard.tsx` — match prototype caption style (italic serif title, mono price, mono edition).
- **Modify** `src/components/BuyUI.tsx` — full rewrite: Paper + Size + Description + Shipping + Care disclosures (div + ARIA, grid-template-rows 0fr→1fr animation), solid-ink full-width CTA, mobile sticky bar with dual IntersectionObserver.
- **Modify** `src/components/DetailPanel.tsx` — desktop: gallery-plate left (double-rule mat) + rail right; mobile: full-bleed hero + stacked rail.
- **Create** `src/components/RelatedPrints.tsx` — cross-sell carousel with "Recently viewed" / "You may also like" tabs + horizontal scroll + arrow nav.
- **Modify** `src/app/photos/[slug]/page.tsx` + `src/app/@modal/(.)photos/[slug]/page.tsx` — ensure `RelatedPrints` is rendered at the bottom on the full page (but not the intercepted modal).

---

## Verification Approach

All tasks verify visually via Claude Preview MCP against the running dev server. After each task, sweep **both desktop (1280×800) and mobile (375×812)** per the mempalace workflow rule.

Server: `npm run dev` on port 3000 (or whatever the preview session assigns). Use `preview_start` if not running.

---

### Task 1: Adopt prototype design tokens

**Files:**
- Modify: `src/app/globals.css:1-35` (token block) and add new CSS utilities at end

- [ ] **Step 1: Update `:root` token values + add `--i*` family + `--rule`**

Replace the existing `:root` block (lines ~8-23) with:

```css
:root {
  /* Prototype-aligned warm palette.
     --ink/--ink-strong map to prototype ink tiers; keep both names so
     existing components that reference --ink-strong keep working. */
  --bg: #faf9f6;
  --bg-soft: #f1eee7;
  --ink: rgba(12, 11, 10, 1);
  --ink-strong: rgba(12, 11, 10, 0.92);
  --ink-faint: rgba(12, 11, 10, 0.52);
  --ink-line: rgba(12, 11, 10, 0.12);

  /* Prototype tier aliases — use these in new components. */
  --i8: rgba(12, 11, 10, 0.92);
  --i5: rgba(12, 11, 10, 0.70);
  --i3: rgba(12, 11, 10, 0.52);
  --i1: rgba(12, 11, 10, 0.12);
  --rule: rgba(12, 11, 10, 0.22);

  --accent: #8b5e3c;
  --heading-weight: 400;
  --body-weight: 400;
  --heading-scale: 1;
  --section-py-scale: 1;
  --header-height: 63px;
  --footer-gap: 48px;
  --font-serif: var(--font-eb-garamond), "Times New Roman", serif;
}
```

- [ ] **Step 2: Append disclosure + double-rule-mat primitives at end of `globals.css`**

Append this block after the existing `.font-serif {}` rule:

```css
/* ─── Double-rule mat (gallery frame) ────────────────────────── */
.mat-o {
  border: 1px solid var(--rule);
  padding: 20px; /* overridden on mobile to 14px */
  background: var(--bg);
  width: max-content;
  display: inline-block;
}
.mat-i {
  border: 1px solid var(--rule);
  overflow: hidden;
  line-height: 0;
  display: block;
}
@media (max-width: 700px) {
  .mat-o { padding: 14px; }
}

/* ─── Disclosure (Paper / Size / Description / Shipping / Care) ── */
.disc { display: block; }
.disc-trigger {
  appearance: none;
  border: 0;
  background: transparent;
  width: 100%;
  padding: 14px 0;
  cursor: pointer;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  font-family: 'Favorit', var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink);
  text-align: left;
}
.disc-trigger .d-val {
  justify-self: end;
  font-size: 13px;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--i5);
  transition: color 220ms;
}
.disc[data-open="true"] .disc-trigger .d-val { color: var(--ink); }
.disc-trigger .d-chev {
  width: 10px; height: 10px;
  position: relative;
  transition: transform 260ms cubic-bezier(.2,.6,.2,1);
}
.disc-trigger .d-chev::before,
.disc-trigger .d-chev::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 7px; height: 1px;
  background: var(--ink);
}
.disc-trigger .d-chev::before { left: 0;  transform: rotate(45deg); }
.disc-trigger .d-chev::after  { right: 0; transform: rotate(-45deg); }
.disc[data-open="true"] .disc-trigger .d-chev { transform: rotate(180deg); }

.d-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 340ms cubic-bezier(.2,.6,.2,1);
}
.disc[data-open="true"] .d-body { grid-template-rows: 1fr; }
.d-inner { overflow: hidden; min-height: 0; }
.d-inner-pad { padding: 2px 0 22px; }

/* Option rows inside a disclosure */
.disc-opt {
  appearance: none; border: 0; background: transparent;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 18px;
  padding: 14px 0;
  font-family: 'Favorit', var(--font-sans);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.01em;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--i1);
  transition: padding-left 200ms, color 180ms;
}
.disc-opt:last-child { border-bottom: 0; }
.disc-opt:hover { padding-left: 4px; }
.disc-opt .opt-meta {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--i5);
  letter-spacing: 0.01em;
}
.disc-opt[aria-pressed="true"] { color: var(--ink); }
.disc-opt[aria-pressed="true"]::before {
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  background: var(--ink);
  border-radius: 50%;
  margin-right: 10px;
  transform: translateY(-2px);
}
.disc-opt[disabled] { color: var(--i3); cursor: not-allowed; }
.disc-opt[disabled]:hover { padding-left: 0; }
.disc-opt[disabled] .opt-meta { text-decoration: line-through; }

/* ─── Solid-ink CTA (Add to cart) ─────────────────────────────── */
.btn-ink {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  width: 100%;
  padding: 20px 22px;
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 0;
  font-family: 'Favorit', var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 180ms, transform 180ms;
}
.btn-ink:hover { opacity: 0.88; }
.btn-ink:active { transform: translateY(1px); }
.btn-ink:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-ink .btn-ink-price {
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  font-size: 13px;
  text-transform: none;
}
```

- [ ] **Step 3: Verify in preview — tokens resolve, existing UI still renders**

Run `npm run dev` if not running. Browse to `/` and `/photos/pl-6604-01`. `preview_screenshot`. Expected: page renders without layout collapse (some UI will look off — that's fine, we fix in later tasks). No CSS errors in `preview_console_logs`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "tokens: adopt prototype warm palette + add disclosure primitives"
```

---

### Task 2: Refactor `Header.tsx` — drop middle Arabic, drop Essay, reveal-on-scroll for landing

**Files:**
- Modify: `src/components/Header.tsx` (full rewrite)

The product prototype nav is a simple sticky 2-col: `← Thalia Bassim` (sans, left) and `All prints / Cart(n)` (sans, right). The landing (frame-prototype) hides the nav until the user scrolls ~past the hero. We keep the same component and gate the reveal behavior by pathname.

- [ ] **Step 1: Replace the Header component with this implementation**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { itemCount, openDrawer } = useCart();
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [revealed, setRevealed] = useState(!isLanding);
  const lastY = useRef(0);

  // Landing: hide until scrolled ~past hero (55vh on mobile, 80% of a 150vh hero on desktop).
  // Other pages: always visible, hide-on-scroll-down for focus.
  useEffect(() => {
    if (isLanding) {
      setRevealed(false);
      const onScroll = () => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        const threshold = window.matchMedia("(max-width: 700px)").matches
          ? vh * 0.55
          : vh * 1.2; // desktop hero is 150vh; emerge ~0.80 in
        setRevealed(y > threshold);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    // non-landing: hide on scroll down past a small threshold; reveal on scroll up.
    setRevealed(true);
    const threshold = 8;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 64) setRevealed(true);
      else if (delta > threshold) setRevealed(false);
      else if (delta < -threshold) setRevealed(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  return (
    <header
      className="sticky top-0 z-50 grid grid-cols-[1fr_auto] items-baseline border-b border-ink-line bg-bg px-5 py-4 transition-opacity duration-300 ease-out md:px-11 md:py-[17px]"
      style={{
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? "auto" : "none",
      }}
      aria-hidden={!revealed}
    >
      <div className="justify-self-start">
        <Link
          href="/"
          className="text-[15px] font-normal tracking-[0.04em] text-ink"
        >
          {isLanding ? "Thalia Bassim" : "← Thalia Bassim"}
        </Link>
      </div>

      <nav className="flex items-baseline gap-6 justify-self-end md:gap-7">
        <Link
          href="/#prints"
          className="text-[15px] font-normal tracking-[0.04em] text-ink"
        >
          {isLanding ? "View prints" : "All prints"}
        </Link>
        <button
          type="button"
          onClick={openDrawer}
          className="text-[15px] font-normal tracking-[0.04em] text-ink"
        >
          Cart
          <span className="ml-1 text-ink-faint">
            ({itemCount})
          </span>
        </button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Verify on `/`**

Scroll from top → header should be invisible. Scroll past hero → header reveals. Screenshot at 1280×800 and 375×812.

`preview_eval`:
```js
(() => {
  const h = document.querySelector('header');
  return { opacity: getComputedStyle(h).opacity, top: h.getBoundingClientRect().top };
})()
```
Expected at top: opacity near 0. After scrolling `window.scrollTo(0, innerHeight * 1.4)` then re-evaluating: opacity 1.

- [ ] **Step 3: Verify on `/photos/pl-6604-01`**

Header visible on load, sticky at top, shows "← Thalia Bassim | All prints | Cart (n)".

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx
git commit -m "header: prototype nav — drop middle Arabic, landing reveal-on-scroll"
```

---

### Task 3: Refactor `Footer.tsx` — two-row, 4 links, prototype spacing

**Files:**
- Modify: `src/components/Footer.tsx` (full rewrite)

- [ ] **Step 1: Replace footer with prototype structure**

```tsx
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
      <div
        className="flex flex-wrap items-baseline"
        style={{ gap: "32px 36px" }}
      >
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
```

- [ ] **Step 2: Verify — footer reads as two rows at both viewports; links don't run together as a sentence**

Screenshot `/` at bottom of page, 1280×800 and 375×812.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "footer: two-row copyright + links, 32/36 gap"
```

---

### Task 4: Landing page — replace hero with frame composition + catalog bar

**Files:**
- Modify: `src/app/page.tsx` (full rewrite)
- Create: `src/components/LandingHero.tsx` (client component for scroll dissolve)

The landing hero is a sticky-pin frame on desktop with four floating labels (Arabic+English TL, essay excerpt BL, Read-essay BR, VIEW PRINTS bottom-center). Scroll progresses the composition fade + nav reveal. Mobile: static stack, all elements left-aligned to the Arabic header.

- [ ] **Step 1: Create `src/components/LandingHero.tsx`**

```tsx
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
      if (maxS <= 0) { raf = false; return; }
      const p = Math.min(1, Math.max(0, window.scrollY / maxS));

      const lA = p < 0.15 ? 1 : p > 0.5 ? 0 : 1 - (p - 0.15) / 0.35;
      lblsRef.current.forEach((l) => { if (l) l.style.opacity = String(lA); });

      const cA = p < 0.38 ? 1 : p > 0.78 ? 0 : 1 - (p - 0.38) / 0.40;
      const cY = p > 0.38 ? ((p - 0.38) / 0.40) * -9 : 0;
      comp.style.opacity = String(cA);
      comp.style.transform = `translateY(${cY}vh)`;

      raf = false;
    }

    function onScroll() {
      if (!raf) { requestAnimationFrame(tick); raf = true; }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    mqMobile.addEventListener("change", () => { clearInline(); tick(); });
    tick();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const setLblRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) lblsRef.current[i] = el;
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative"
      style={{ height: "150vh" }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden md:block md:h-screen">
        <div
          ref={compRef}
          className="comp relative will-change-[opacity,transform]"
          style={{ padding: "96px 0 180px" }}
        >
          {/* TL: Arabic + English title */}
          <div
            ref={setLblRef(0)}
            className="lbl-tl absolute left-0 top-0 md:absolute"
          >
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
                className="block object-cover"
                style={{
                  width: "min(400px, 45vh)",
                  height: "calc(min(400px, 45vh) * 1.25)",
                }}
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

          {/* BC: VIEW PRINTS */}
          <div
            ref={setLblRef(3)}
            className="lbl-bc absolute text-center"
            style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
          >
            <Link
              href="#prints"
              className="inline-block transition-opacity hover:opacity-50"
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
        @media (max-width: 700px) {
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
          .comp :global(.lbl-tl)  { order: 0; margin-bottom: 28px; }
          .comp :global(.mat-o)   { order: 1; align-self: flex-start !important; }
          .comp :global(.lbl-bl)  {
            order: 2;
            margin-top: 36px;
            max-width: min(74vw, 280px) !important;
            width: min(74vw, 280px);
            font-size: 19px;
            line-height: 1.5;
            text-align: left;
          }
          .comp :global(.lbl-br)  {
            order: 3;
            margin-top: 20px;
            max-width: min(74vw, 280px) !important;
            width: min(74vw, 280px);
            text-align: left !important;
            right: auto !important;
          }
          .comp :global(.lbl-bc)  {
            order: 4;
            margin: 80px auto 24px !important;
            align-self: center !important;
          }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`**

```tsx
import LandingHero from "@/components/LandingHero";
import CatalogGrid from "@/components/CatalogGrid";
import { getAllPhotos } from "@/lib/photos";

export default function Home() {
  const photos = getAllPhotos();
  const lead = photos[0];

  return (
    <div>
      {lead ? <LandingHero lead={lead} /> : null}

      <div
        id="prints"
        className="flex items-baseline justify-between border-b border-ink-line px-6 py-[22px] md:px-11"
        style={{ scrollMarginTop: 48 }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink)",
          }}
        >
          Prints
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 15, color: "var(--i8)", letterSpacing: "0.02em" }}
        >
          {photos.length} works
        </span>
      </div>

      <CatalogGrid photos={photos} />
    </div>
  );
}
```

- [ ] **Step 3: Verify desktop — sticky-pin hero, scroll fades composition + reveals header**

`preview_resize` → 1280×800. `preview_screenshot` at `scrollY=0` and at `scrollY=window.innerHeight * 0.9`.

- [ ] **Step 4: Verify mobile — static stack, all items left-aligned to Arabic header**

`preview_resize` → 375×812. `preview_screenshot`. Arabic header, image, excerpt, "Read the essay", and "View prints" should all share the same left edge (except VIEW PRINTS which is intentionally centered with 80px margin-top).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/LandingHero.tsx
git commit -m "landing: frame composition hero + scroll dissolve + mobile stack"
```

---

### Task 5: Rewrite `CatalogGrid.tsx` — simple 2-col grid with cell borders

**Files:**
- Modify: `src/components/CatalogGrid.tsx` (full rewrite)

Drop the collage/grid toggle and the 12-col span map — the prototype is a clean 2-col (3-col at >1400px) with 1px rules on cell edges and no gap-background trick (which caused the gray last-row block).

- [ ] **Step 1: Replace `CatalogGrid.tsx`**

```tsx
import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/types";

export default function CatalogGrid({ photos }: { photos: Photo[] }) {
  return (
    <div
      className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1400px]:grid-cols-3"
      style={{
        gap: 0,
        borderTop: "1px solid var(--rule)",
        borderLeft: "1px solid var(--rule)",
      }}
    >
      {photos.map((photo, i) => (
        <div
          key={photo.slug}
          className="stagger-in block"
          style={
            {
              ["--i" as string]: i,
              background: "var(--bg)",
              padding: "36px 44px",
              borderRight: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
            } as React.CSSProperties
          }
        >
          <PhotoCard photo={photo} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify — no stale gray block in last row, borders wrap cleanly, 2 cols at 1280 and 3 cols at 1440**

`preview_resize` → 1440×900, `preview_screenshot`. Should see 3 cols.
`preview_resize` → 1280×800, `preview_screenshot`. Should see 2 cols.
`preview_resize` → 375×812, `preview_screenshot`. Should see 1 col.

- [ ] **Step 3: Commit**

```bash
git add src/components/CatalogGrid.tsx
git commit -m "catalog: simple 2-col grid with cell borders — drop collage + toggle"
```

---

### Task 6: Update `PhotoCard.tsx` — prototype caption style

**Files:**
- Modify: `src/components/PhotoCard.tsx` (full rewrite)

- [ ] **Step 1: Replace `PhotoCard.tsx`**

```tsx
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { formatUsd, isSoldOut } from "@/lib/pricing";

export default function PhotoCard({ photo }: { photo: Photo }) {
  const soldOut = isSoldOut(photo);
  return (
    <Link href={`/photos/${photo.slug}`} className="group block">
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4 / 5",
          background: "#ebe9e4",
          marginBottom: 16,
        }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[640ms] group-hover:scale-[1.015]"
          style={{ transitionTimingFunction: "cubic-bezier(.2,.6,.2,1)" }}
          loading="lazy"
        />
        {soldOut ? (
          <span
            className="absolute left-3 top-3 bg-ink px-2 py-1 uppercase text-bg"
            style={{ fontSize: 10, letterSpacing: "0.08em" }}
          >
            Sold out
          </span>
        ) : null}
      </div>
      <span
        className="block font-serif italic"
        style={{ fontSize: 21, color: "var(--ink)", marginBottom: 8 }}
      >
        {photo.title}
        {photo.titleItalic ? <> {photo.titleItalic}</> : null}
      </span>
      <span
        className="block font-mono"
        style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 4 }}
      >
        From {formatUsd(photo.basePriceCents)}
      </span>
      <span
        className="block font-mono"
        style={{ fontSize: 14, fontWeight: 400, color: "var(--i8)" }}
      >
        Edition of {photo.editionTotal}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Verify — titles are italic serif 21px, "From $N" mono 15px, "Edition of N" mono 14px**

`preview_screenshot` of catalog section.

- [ ] **Step 3: Commit**

```bash
git add src/components/PhotoCard.tsx
git commit -m "photo-card: prototype caption — serif italic title, mono price + edition"
```

---

### Task 7: Rewrite `BuyUI.tsx` — disclosure-driven rail

**Files:**
- Modify: `src/components/BuyUI.tsx` (full rewrite)

The new BuyUI is a rail with: breadcrumb, Arabic + English title, current price, 5 disclosures (Paper, Size, Description, Shipping & returns, Care), solid-ink CTA, mobile-only sticky bar. Each disclosure uses the `.disc` primitive from globals.css. Paper and Size bodies contain pressable `.disc-opt` rows.

Size/paper selection still routes through the existing `useCart().add()` — no change to the cart contract.

- [ ] **Step 1: Replace `BuyUI.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { editionRemaining, formatUsd, isSoldOut, priceCents } from "@/lib/pricing";
import type { PaperType, Photo } from "@/lib/types";

type DiscKey = "paper" | "size" | "description" | "shipping" | "care";

export default function BuyUI({ photo }: { photo: Photo }) {
  const { add, itemCount } = useCart();
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [paperId, setPaperId] = useState<PaperType>(photo.papers[0].id);
  const [qty] = useState(1);
  const [open, setOpen] = useState<Record<DiscKey, boolean>>({
    paper: false, size: false, description: false, shipping: false, care: false,
  });

  const ctaRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const remaining = editionRemaining(photo);
  const soldOut = isSoldOut(photo);
  const fromPrice = priceCents(photo, photo.sizes[0].id, paperId);
  const currentPrice = sizeId ? priceCents(photo, sizeId, paperId) : fromPrice;
  const currentSize = sizeId ? photo.sizes.find((s) => s.id === sizeId) : null;
  const currentPaper = photo.papers.find((p) => p.id === paperId);

  const toggleDisc = (key: DiscKey) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const closeDisc = (key: DiscKey) => setOpen((o) => ({ ...o, [key]: false }));

  // Sticky bar — show when the main CTA is out of viewport AND the related
  // section is NOT yet in viewport. Same dual IntersectionObserver as prototype.
  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta || !("IntersectionObserver" in window)) return;

    let ctaOut = false;
    let nearBottom = false;
    const sync = () => setShowSticky(ctaOut && !nearBottom);

    const ctaObs = new IntersectionObserver(
      ([e]) => { ctaOut = !e.isIntersecting; sync(); },
      { rootMargin: "-8px 0px 0px 0px", threshold: 0 }
    );
    ctaObs.observe(cta);

    const related = document.querySelector('[data-related-sentinel]');
    const relObs = related
      ? new IntersectionObserver(
          ([e]) => { nearBottom = e.isIntersecting; sync(); },
          { rootMargin: "0px 0px 0px 0px", threshold: 0 }
        )
      : null;
    if (related && relObs) relObs.observe(related);

    return () => {
      ctaObs.disconnect();
      relObs?.disconnect();
    };
  }, []);

  const handleAdd = () => {
    if (!sizeId || soldOut) return;
    add({ photoSlug: photo.slug, sizeId, paperId, quantity: qty });
  };

  return (
    <section className="flex flex-col self-start">
      {/* Breadcrumb */}
      <p
        className="font-mono mb-7"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          color: "var(--i5)",
          textTransform: "uppercase",
        }}
      >
        <Link href="/#prints" className="text-[color:var(--i5)] hover:text-ink">
          Prints
        </Link>
        <span className="mx-2 opacity-55">/</span>
        <span>{photo.title}{photo.titleItalic ? ` ${photo.titleItalic}` : ""}</span>
      </p>

      {/* Title: Arabic above English italic */}
      <h1 className="flex flex-col">
        <span
          className="font-serif"
          lang="ar"
          style={{
            fontWeight: 500,
            fontSize: 42,
            color: "var(--ink)",
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            marginBottom: 8,
          }}
        >
          التمسّك
        </span>
        <span
          className="font-serif italic"
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "var(--i8)",
            lineHeight: 1.15,
            marginBottom: 24,
          }}
        >
          {photo.title}
          {photo.titleItalic ? <> {photo.titleItalic}</> : null}
        </span>
      </h1>

      <p
        style={{
          fontSize: 17,
          color: "var(--ink)",
          letterSpacing: "0.02em",
          marginBottom: 40,
        }}
      >
        {sizeId ? formatUsd(currentPrice) : `From ${formatUsd(fromPrice)}`} USD
      </p>

      {/* Paper disclosure */}
      <Disclosure
        label="Paper"
        value={currentPaper?.name ?? "Select"}
        open={open.paper}
        onToggle={() => toggleDisc("paper")}
      >
        {photo.papers.map((p) => (
          <button
            key={p.id}
            type="button"
            className="disc-opt"
            aria-pressed={paperId === p.id}
            onClick={() => { setPaperId(p.id); closeDisc("paper"); }}
          >
            {p.name}
            <span className="opt-meta">
              {p.surchargeCents ? `+${formatUsd(p.surchargeCents)}` : "Matte cotton"}
            </span>
          </button>
        ))}
      </Disclosure>

      {/* Size disclosure */}
      <Disclosure
        label="Size"
        value={currentSize?.label ?? "Select a size"}
        open={open.size}
        onToggle={() => toggleDisc("size")}
      >
        {photo.sizes.map((s) => {
          const p = priceCents(photo, s.id, paperId);
          return (
            <button
              key={s.id}
              type="button"
              className="disc-opt"
              aria-pressed={sizeId === s.id}
              onClick={() => { setSizeId(s.id); closeDisc("size"); }}
            >
              {s.label}
              <span className="opt-meta">{formatUsd(p)}</span>
            </button>
          );
        })}
      </Disclosure>

      {/* Delivery copy + CTA */}
      <div className="mt-7 mb-3.5">
        <p
          className="font-mono mb-2"
          style={{
            fontSize: 12,
            color: "var(--i5)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Ships within 7 days · Worldwide
          {soldOut ? " · Sold out" : ` · ${remaining} remaining`}
        </p>
        <button
          ref={ctaRef}
          type="button"
          className="btn-ink"
          disabled={!sizeId || soldOut}
          onClick={handleAdd}
        >
          <span>{soldOut ? "Edition closed" : sizeId ? "Add to cart" : "Select a size"}</span>
          <span className="btn-ink-price">
            {sizeId ? formatUsd(currentPrice) : `From ${formatUsd(fromPrice)}`}
          </span>
        </button>
      </div>

      {/* Description */}
      <Disclosure
        label="Description"
        value=""
        open={open.description}
        onToggle={() => toggleDisc("description")}
      >
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          {photo.description.map((para, i) => (
            <p key={i} style={{ marginTop: i === 0 ? 0 : 10 }}>{para}</p>
          ))}
        </div>
      </Disclosure>

      {/* Shipping & returns */}
      <Disclosure
        label="Shipping & returns"
        value=""
        open={open.shipping}
        onToggle={() => toggleDisc("shipping")}
      >
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          <p>
            Ships flat in an archival tube within 7 working days via insured courier,
            worldwide. No returns — a replacement can be arranged if the package
            arrives damaged or unsealed.
          </p>
        </div>
      </Disclosure>

      {/* Care */}
      <Disclosure
        label="Care"
        value=""
        open={open.care}
        onToggle={() => toggleDisc("care")}
      >
        <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", maxWidth: "58ch" }}>
          <p>
            Handle by the edges only. Avoid direct sunlight and humidity above 60%.
            Store flat or in the supplied sleeve until framed.
          </p>
        </div>
      </Disclosure>

      {/* Mobile sticky bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-[1fr_auto] items-center gap-[18px] border-t border-ink-line bg-bg lg:hidden"
        style={{
          padding: "14px 24px calc(14px + env(safe-area-inset-bottom, 0px))",
          transform: showSticky ? "translateY(0)" : "translateY(110%)",
          transition: "transform 380ms cubic-bezier(.2,.6,.2,1)",
          boxShadow: showSticky ? "0 -10px 32px rgba(12,11,10,.06)" : "none",
          pointerEvents: showSticky ? "auto" : "none",
          willChange: "transform",
        }}
        role="region"
        aria-label="Buy bar"
        aria-hidden={!showSticky}
      >
        <div className="min-w-0">
          <span
            className="block font-serif italic overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 17, color: "var(--ink)", lineHeight: 1, marginBottom: 5 }}
          >
            {photo.title}{photo.titleItalic ? ` ${photo.titleItalic}` : ""}
          </span>
          <span className="block font-mono" style={{ fontSize: 13, color: "var(--ink)" }}>
            {sizeId ? formatUsd(currentPrice) : `From ${formatUsd(fromPrice)}`}
          </span>
        </div>
        <button
          type="button"
          className="btn-ink"
          style={{ width: "auto", padding: "16px 22px", gridTemplateColumns: "auto" }}
          disabled={!sizeId || soldOut}
          onClick={handleAdd}
        >
          {sizeId ? "Add to cart" : "Select size"}
        </button>
      </div>

      {itemCount > 0 ? null : null /* kept for future "free shipping" nudge */}
    </section>
  );
}

function Disclosure({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="disc" data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="disc-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{label}</span>
        <span className="d-val">{value}</span>
        <span className="d-chev" aria-hidden="true" />
      </button>
      <div className="d-body">
        <div className="d-inner">
          <div className="d-inner-pad">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — all 5 disclosures animate open/close; selecting a size updates CTA price + enables button**

`preview_click` on the Size disclosure trigger. Observe expansion. `preview_click` on a size option. Observe disc closes, CTA shows price. `preview_eval`:
```js
(() => {
  const cta = document.querySelector('.btn-ink');
  return { disabled: cta.disabled, text: cta.textContent };
})()
```
Expected: `disabled: false`, text contains "Add to cart" + dollar amount.

- [ ] **Step 3: Verify — mobile sticky bar shows when CTA scrolls out, hides at related section**

`preview_resize` → 375×812. Scroll to middle. Expect sticky bar visible at bottom. Scroll all the way to footer. Expect sticky bar hidden.

- [ ] **Step 4: Commit**

```bash
git add src/components/BuyUI.tsx
git commit -m "buy-ui: disclosure rail + solid-ink CTA + mobile sticky dual-observer"
```

---

### Task 8: Rewrite `DetailPanel.tsx` — split desktop, stacked mobile

**Files:**
- Modify: `src/components/DetailPanel.tsx` (full rewrite)

Desktop: 1fr gallery + 38vw (max 520px) rail, gallery-plate with double-rule mat sized to viewport. Mobile: full-bleed photo on soft bg, rail below.

- [ ] **Step 1: Replace `DetailPanel.tsx`**

```tsx
import BuyUI from "./BuyUI";
import DetailCloseLink from "./DetailCloseLink";
import type { Photo } from "@/lib/types";

export default function DetailPanel({
  photo,
  modal = false,
}: {
  photo: Photo;
  modal?: boolean;
}) {
  return (
    <article>
      {!modal ? (
        <div className="flex items-center justify-end gap-6 border-b border-ink-line px-6 py-3 md:px-11">
          <DetailCloseLink modal={modal} />
        </div>
      ) : null}

      <div
        className="grid min-h-[calc(100vh-63px)] grid-cols-1 gap-0 lg:grid-cols-[1fr_38vw]"
        style={{ maxWidth: 1600, margin: "0 auto" }}
      >
        {/* Gallery — framed image, fit to viewport */}
        <section
          className="flex items-start justify-center lg:py-8"
          style={{ padding: "32px 20px 32px 44px" }}
        >
          <figure
            className="mat-o"
            style={{
              maxHeight: "calc(100vh - 63px - 64px)",
              display: "inline-flex",
            }}
          >
            <div className="mat-i" style={{ display: "flex" }}>
              <img
                src={photo.imageUrl}
                alt={photo.imageAlt}
                className="block object-contain"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 63px - 64px - 40px - 4px)",
                }}
              />
            </div>
          </figure>
        </section>

        {/* Rail */}
        <aside
          className="self-center justify-self-center w-full"
          style={{ padding: "48px 28px", maxWidth: 420 }}
        >
          <BuyUI photo={photo} />
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          article > .grid {
            grid-template-columns: 1fr;
          }
          article > .grid > section {
            padding: 20px 20px 32px !important;
          }
          article > .grid > section .mat-o {
            padding: 10px;
          }
          article > .grid > aside {
            padding: 32px 20px 48px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </article>
  );
}
```

- [ ] **Step 2: Verify desktop — split layout, gallery on left, rail on right, no scroll needed to reach CTA with disclosures closed**

`preview_resize` → 1280×800. `preview_screenshot` of `/photos/pl-6604-01`. Expect the framed image on the left, rail on the right with title + price + 5 disclosures + solid ink CTA all visible without scroll.

- [ ] **Step 3: Verify mobile — full-bleed image, rail below**

`preview_resize` → 375×812. `preview_screenshot`. Image full-width, then rail content stacked below.

- [ ] **Step 4: Commit**

```bash
git add src/components/DetailPanel.tsx
git commit -m "detail: split desktop (plate+rail) + stacked mobile"
```

---

### Task 9: Create `RelatedPrints.tsx` — cross-sell carousel

**Files:**
- Create: `src/components/RelatedPrints.tsx`
- Modify: `src/app/photos/[slug]/page.tsx` — render `<RelatedPrints>` below the detail panel
- Do **not** modify the intercepted modal route — cross-sell only on full page.

- [ ] **Step 1: Create `RelatedPrints.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { formatUsd } from "@/lib/pricing";
import type { Photo } from "@/lib/types";

type Feed = "recent" | "similar";

export default function RelatedPrints({
  current,
  all,
}: {
  current: Photo;
  all: Photo[];
}) {
  const [feed, setFeed] = useState<Feed>("recent");
  const gridRef = useRef<HTMLDivElement>(null);

  const { recent, similar } = useMemo(() => {
    const others = all.filter((p) => p.slug !== current.slug);
    // Recent: first 6 in catalog order excluding current.
    const recent = others.slice(0, 6);
    // Similar: next 6 by edition-total proximity, same basePriceCents tier.
    const similar = [...others]
      .sort(
        (a, b) => Math.abs(a.basePriceCents - current.basePriceCents) -
                  Math.abs(b.basePriceCents - current.basePriceCents)
      )
      .slice(0, 6);
    return { recent, similar };
  }, [all, current.slug, current.basePriceCents]);

  const items = feed === "recent" ? recent : similar;

  const scroll = (dir: 1 | -1) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cell = grid.querySelector<HTMLAnchorElement>("a");
    const dx = (cell?.getBoundingClientRect().width ?? 260) + 28;
    grid.scrollBy({ left: dx * dir, behavior: "smooth" });
  };

  return (
    <section
      data-related-sentinel
      aria-label="Related prints"
      className="px-5 md:px-11"
      style={{ padding: "72px 44px 96px" }}
    >
      <header
        className="mb-8 flex items-center justify-between md:flex-row"
      >
        <nav
          role="tablist"
          className="flex flex-nowrap"
          style={{ gap: 28 }}
        >
          <Tab active={feed === "recent"} onClick={() => setFeed("recent")}>
            Recently viewed
          </Tab>
          <Tab active={feed === "similar"} onClick={() => setFeed("similar")}>
            You may also like
          </Tab>
        </nav>
        <div className="hidden md:flex" style={{ gap: 6 }}>
          <Arrow label="Scroll left" onClick={() => scroll(-1)}>‹</Arrow>
          <Arrow label="Scroll right" onClick={() => scroll(1)}>›</Arrow>
        </div>
      </header>

      <div
        ref={gridRef}
        role="tabpanel"
        className="flex overflow-x-auto scroll-snap-x"
        style={{
          gap: 28,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          paddingBottom: 8,
          margin: "0 -8px",
        }}
      >
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/photos/${p.slug}`}
            className="block flex-none"
            style={{
              width: 260,
              scrollSnapAlign: "start",
              color: "inherit",
              padding: "0 8px",
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                background: "#ebe9e4",
                aspectRatio: "4 / 5",
                marginBottom: 14,
              }}
            >
              <img
                src={p.imageUrl}
                alt={p.imageAlt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[640ms] hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <span
              className="block font-serif italic"
              style={{ fontSize: 19, color: "var(--ink)", marginBottom: 4 }}
            >
              {p.title}{p.titleItalic ? ` ${p.titleItalic}` : ""}
            </span>
            <span
              className="block font-mono"
              style={{ fontSize: 13, color: "var(--i5)", letterSpacing: "0.02em" }}
            >
              From {formatUsd(p.basePriceCents)} · Edition of {p.editionTotal}
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        [data-related-sentinel] > div::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) {
          [data-related-sentinel] { padding: 48px 20px !important; }
          [data-related-sentinel] header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </section>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="relative"
      style={{
        background: "transparent",
        border: 0,
        padding: "4px 0",
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: active ? "var(--ink)" : "var(--i5)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 200ms",
      }}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0, right: 0, bottom: -2,
            height: 1,
            background: "var(--ink)",
          }}
        />
      ) : null}
    </button>
  );
}

function Arrow({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        background: "transparent",
        border: 0,
        width: 32,
        height: 32,
        fontFamily: "var(--font-serif)",
        fontSize: 24,
        lineHeight: 1,
        color: "var(--i5)",
        cursor: "pointer",
        transition: "color 180ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--i5)")}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Render on the full detail page (not modal)**

Replace `src/app/photos/[slug]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import DetailPanel from "@/components/DetailPanel";
import RelatedPrints from "@/components/RelatedPrints";
import { getAllPhotos, getPhotoBySlug } from "@/lib/photos";

export function generateStaticParams() {
  return getAllPhotos().map((p) => ({ slug: p.slug }));
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const photo = getPhotoBySlug(slug);
  if (!photo) notFound();
  const all = getAllPhotos();
  return (
    <>
      <DetailPanel photo={photo} />
      <RelatedPrints current={photo} all={all} />
    </>
  );
}
```

- [ ] **Step 3: Verify — tabs switch feeds, arrows scroll, single-line tabs at 1280 + 375**

`preview_click` on "You may also like". Feed changes. `preview_click` the right arrow. Grid scrolls ~288px right.

- [ ] **Step 4: Verify — sticky bar hides when related enters viewport**

`preview_resize` → 375×812, scroll to bottom. Related section comes in. Mobile sticky bar should retreat.

- [ ] **Step 5: Commit**

```bash
git add src/components/RelatedPrints.tsx src/app/photos/[slug]/page.tsx
git commit -m "cross-sell: Recently viewed / You may also like carousel"
```

---

### Task 10: Cross-surface cohesion pass + spec preservation

**Files (all surfaces that aren't covered by Tasks 4-9 but still face the user):**
- Modify: `src/app/essay/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/app/thank-you/page.tsx`
- Modify: `src/components/CartDrawer.tsx`
- Modify: `src/components/DemoBanner.tsx`
- Modify: `src/components/Toast.tsx`
- Modify: `src/components/PhotoModal.tsx`
- Modify: `src/components/DetailCloseLink.tsx`
- Modify: `src/components/BuyUI.tsx` (re-add free-ship nudge — spec §shipping-zones)

**Goal:** Every user-facing surface adopts the prototype visual language (warm bg, prototype serif headings, `.btn-ink` for primary CTAs, `.btn-ghost` for secondary, mono + caps for meta, `--i5`/`--i8` ink tiers). Headings follow the product-rail pattern — Arabic `التمسّك` 42px serif above English italic 22px — wherever the page has a titled section.

**Spec preservation per `docs/system-design.md`:**

| Spec | Where it lives | Keep in port |
|---|---|---|
| Edition of 10, N remaining (pooled) | `editionRemaining(photo)` → BuyUI delivery line | Already in Task 7 delivery line; keep |
| Free US shipping on 2+ prints | Backend: cart rule still applies at Stripe session creation | **Remove** from BuyUI — user directive: prototype rail is quiet, no nudges |
| DDU / international customs copy | `/terms` | Keep — no copy change, just visual pass |
| Local pickup (Brooklyn, NY only) | `/checkout` (future) | Not in current checkout — no regression |
| Lead time "2 to 3 business days" | BuyUI delivery line | Keep as "Ships within 7 days" (prototype wording; stakeholder to confirm) |
| No returns — replacement for damage | BuyUI Shipping disclosure + `/terms#returns` | Copy matches prototype; no-op |

- [ ] **Step 1: Essay page visual alignment**

Update `src/app/essay/page.tsx` heading to match product rail pattern (Arabic then English italic, same tokens):

```tsx
<div className="mb-10">
  <span
    className="label-caps mb-4 block"
    style={{ color: "var(--i5)", letterSpacing: "0.08em" }}
  >
    Essay
  </span>
  <h1 className="flex flex-col" style={{ margin: 0 }}>
    <span
      className="font-serif"
      lang="ar"
      style={{
        fontWeight: 500,
        fontSize: "clamp(36px, 5vw, 48px)",
        color: "var(--ink)",
        lineHeight: 1.05,
        letterSpacing: "0.01em",
        marginBottom: 10,
      }}
    >
      التمسّك
    </span>
    <span
      className="font-serif italic"
      style={{
        fontSize: "clamp(20px, 2.2vw, 24px)",
        fontWeight: 500,
        color: "var(--i8)",
      }}
    >
      At-Tamassok
    </span>
  </h1>
</div>
```

Leave the prose paragraphs (`.drop-cap .text-sm`) as-is — they already read correctly under new tokens.

- [ ] **Step 2: Terms page — section numbering keeps Cargo feel, just verify tokens**

No code changes needed. `label-caps`, `--ink-strong`, `--ink-line` all continue to work. Only verify visually in preview.

- [ ] **Step 3: Checkout page — CTA upgrade**

Replace the primary "Proceed to Stripe" `btn-ghost` instance with `btn-ink` (the solid-ink CTA from Task 1). Keep the "Back to editions" link as `btn-ghost`. Find the pending button (e.g. `className="btn-ghost"` on the proceed action) and swap it to `className="btn-ink"` — then inside the button, use the same two-span structure as BuyUI's CTA so the mono price aligns on the right:

```tsx
<button
  type="button"
  className="btn-ink w-full"
  disabled={pending || lines.length === 0}
  onClick={proceed}
>
  <span>{pending ? "Redirecting…" : "Proceed to checkout"}</span>
  <span className="btn-ink-price">{formatUsd(subtotalCents)}</span>
</button>
```

Keep the empty-state heading. Update it to the Arabic+English title pattern if it currently uses `h-display` — not required, but cohesion-positive.

- [ ] **Step 4: Thank-you page — token alignment only**

Heading `<h1 className="h-display text-3xl">Your order is <em>in</em>.</h1>` reads fine under new tokens. No change needed. Update "Back to editions →" button to use `btn-ghost` (already does).

- [ ] **Step 5: CartDrawer — primary CTA upgrade**

Inside the drawer, the primary CTA that routes to `/checkout` should use `.btn-ink`. Any currently-`.btn-ghost` action that moves the user forward in the funnel should become `.btn-ink`. "Continue shopping" stays `.btn-ghost` as a secondary.

Ensure the subtotal row uses mono font + `--ink` color, matching the product-rail price line:

```tsx
<span className="font-mono" style={{ fontSize: 17, color: "var(--ink)", letterSpacing: "0.02em" }}>
  {formatUsd(subtotalCents)}
</span>
```

- [ ] **Step 6: ~~BuyUI — re-add the free-shipping nudge~~** *(removed — user directive, the prototype buy UI is intentionally quiet; no nudges)*

- [ ] **Step 7: DemoBanner + Toast — token check**

Both use `--ink-line`, `--bg`. Confirm they render correctly at 375 and 1280. No code change expected. If the DemoBanner shows a stark contrast against the warmer `#faf9f6` bg, soften its border to `var(--i1)` and text to `var(--i5)`.

- [ ] **Step 8: PhotoModal + DetailCloseLink — unchanged, token check**

These render on top of DetailPanel. If the close-link uses an old color, align to `var(--i5)` hover-to-`var(--ink)`.

- [ ] **Step 9: Commit the cohesion pass**

Stage exactly the files you changed. Do not bulk-add.

```bash
git add src/app/essay/page.tsx \
        src/app/checkout/page.tsx \
        src/components/CartDrawer.tsx \
        src/components/BuyUI.tsx \
        src/components/DemoBanner.tsx \
        src/components/DetailCloseLink.tsx
# (skip terms/thank-you/Toast/PhotoModal if no changes were needed)
git commit -m "cohesion: align auxiliary surfaces + free-ship nudge"
```

- [ ] **Step 10: Verify — walk the funnel end-to-end at 1280 and 375**

Visit `/`, click a print → `/photos/pl-6604-01`. Add to cart. Click the cart → drawer opens. Click "Checkout" → `/checkout`. Confirm the primary CTA on the checkout is `btn-ink` matching the product rail. Back out. Visit `/essay`, `/terms`, `/thank-you?session_id=cs_test_123`. Screenshot each at both viewports. Everything should feel like one site.

---

### Task 11: Full desktop + mobile sweep — per mempalace workflow rule

**Files:** (no modifications — verification only; note any defects back as follow-up tasks)

- [ ] **Step 1: Desktop sweep (1280×800) on `/`**

`preview_resize` 1280 800. Screenshot at scrollY 0, 0.5 * innerHeight, innerHeight * 1.4, document end. Check: hero dissolves, nav reveals, catalog 2-col with clean cell borders, footer two-row.

- [ ] **Step 2: Desktop sweep on `/photos/pl-6604-01`**

`preview_resize` 1280 800. Screenshot top + document end. Check: plate+rail split, all 5 disclosures collapsed on load, CTA disabled until size selected, related prints horizontal scroll, footer.

- [ ] **Step 3: Mobile sweep (375×812) on `/`**

`preview_resize` 375 812. Screenshot at top and document end. Check: static hero stack left-aligned to Arabic header, "View prints ↓" centered below with whitespace, catalog 1-col, footer two-row.

- [ ] **Step 4: Mobile sweep on `/photos/pl-6604-01`**

`preview_resize` 375 812. Screenshot at: top, mid-page, before related, at related, document end. Check: full-bleed photo, rail below, sticky bar appears when CTA out of view and disappears at related section.

- [ ] **Step 5: Report punch list**

Summarize any residual defects with file:line references. No commit needed unless changes were made.

---

## Self-Review Checklist

**Spec coverage:**
- Prototype desktop frame hero → Task 4 ✓
- Prototype mobile left-aligned stack → Task 4 (`<style jsx>` mobile block) ✓
- Nav drops middle Arabic + Essay → Task 2 ✓
- Nav hidden on landing until scroll → Task 2 (`isLanding` + IntersectionObserver-like scroll gate) ✓
- Footer two-row 32/36 gap → Task 3 ✓
- Catalog 2-col (3 at >1400) with cell borders → Task 5 ✓
- No gray last-row block → Task 5 (cell borders technique) ✓
- Product split desktop + stacked mobile → Task 8 ✓
- 5 disclosures (Paper, Size, Description, Shipping, Care) → Task 7 ✓
- Solid-ink full-width CTA → Task 7 + `.btn-ink` in Task 1 ✓
- Mobile sticky bar with dual IntersectionObserver → Task 7 ✓
- Cross-sell tabs single line → Task 9 (`flexWrap: nowrap`, `whiteSpace: nowrap`) ✓
- Cross-sell arrows scroll → Task 9 ✓
- Shipping copy updated → Task 7 ✓
- Frame-prototype double-rule mat → `.mat-o` / `.mat-i` in Task 1 ✓

**Type consistency check:**
- `Photo.sizes[i].id` used in BuyUI state ✓
- `PaperType` preserved as discriminated union ✓
- `useCart().add({ photoSlug, sizeId, paperId, quantity })` — matches existing `CartLine` shape ✓
- `RelatedPrints` props `{ current: Photo; all: Photo[] }` — matches `getAllPhotos()` return ✓

**Placeholder scan:** none — all tasks have concrete code.

---

## Execution

Plan complete at `docs/superpowers/plans/2026-04-19-port-prototypes-to-nextjs.md`.

User directed: **spawn subagents** to implement. Partitioning to minimize file conflicts:
1. **Phase 1 (sequential — foundational):** Tasks 1, 2, 3 — tokens + Header + Footer. All touch distinct files but must land first so subsequent pages pick up the new palette.
2. **Phase 2 (parallel after Phase 1):**
   - **Landing agent:** Tasks 4, 5, 6 — `page.tsx`, `LandingHero.tsx` (new), `CatalogGrid.tsx`, `PhotoCard.tsx`.
   - **Product agent:** Tasks 7, 8, 9 — `BuyUI.tsx`, `DetailPanel.tsx`, `RelatedPrints.tsx` (new), `photos/[slug]/page.tsx`.
3. **Phase 3 (parallel with Phase 2):** Task 10 — cross-surface cohesion pass (essay, terms, checkout, thank-you, CartDrawer, Toast, DemoBanner, PhotoModal, DetailCloseLink). File partition is disjoint from Landing + Product agents, so all three run at once.
4. **Phase 4 (sequential):** Task 11 — dual-viewport sweep, report punch list.
