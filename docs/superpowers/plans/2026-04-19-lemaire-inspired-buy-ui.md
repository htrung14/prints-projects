# Lemaire-Inspired Buy UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Borrow the 6 highest-leverage patterns from Lemaire's extracted design system and build a print-detail (buy) page that matches the editorial quality of the landing hero, without conforming to Lemaire's voice.

**Architecture:** Extend the existing static HTML prototype approach. Add interactions to the catalog grid in `frame-prototype.html`; build a new standalone `product-prototype.html` using the split-screen gallery + sticky right rail pattern that Lemaire/Loewe/Jil Sander/The Row all share. Keep our own design tokens (warm off-white bg, warm near-black ink, Favorit 300/400 + EB Garamond italic, double-rule mats, 1px-rule catalog grid). Only the *patterns* come from Lemaire — never the tokens.

**Tech Stack:** Static HTML + CSS + vanilla JS (mirrors `frame-prototype.html`). No framework. Served by the existing Claude Preview server on port 4400. Verification via Claude Preview MCP (`preview_eval`, `preview_screenshot`).

**What we borrow from Lemaire:**
1. Cross-fade to alt image on card hover (#4 in assessment)
2. Split-screen product page: left gallery stack + right sticky rail (#5)
3. 40px-radius variant pills — the only round element on the site (#6)
4. Mobile sticky bottom "Add to Cart" bar (#7)
5. Solid-ink full-width "Add to Cart" button with zero radius (#8)
6. 3-column grid only at very wide viewports (#2, conditional)

**What we explicitly reject:**
- 3:4 aspect ratio (keep 4:5 — photobook proportions)
- 2px-gap tight grid (keep 1px rules — museum catalog, not contact sheet)
- Announcement bar (art-book publisher, not retail promo)
- BrownStd / #000 / 4px radius (those are Lemaire's voice, not ours)

---

## File Structure

- **Modify** `design-extract-output/frame-prototype.html` — add card hover cross-fade, 3-col breakpoint at >1400px, link each cat-cell to product page.
- **Create** `design-extract-output/product-prototype.html` — new standalone product detail page, mirrors the token system and font loading of `frame-prototype.html`.

Both files are self-contained static HTML. Design tokens duplicated across the two files is acceptable for prototype stage — when we move to the real Next.js app, tokens will be extracted into a shared layer.

## Verification Approach

This is a visual prototype. "Tests" mean DOM-measured acceptance criteria verified via Claude Preview MCP. Each task specifies:
- A `preview_eval` expression that returns an object with measured values
- The exact values those measurements should match (or ranges they should fall within)
- A `preview_screenshot` pass for visual sanity

The existing preview server (port 4400, serverId from `preview_list`) remains running throughout.

---

### Task 1: Catalog card cross-fade on hover (alt image)

**Files:**
- Modify: `design-extract-output/frame-prototype.html` — `.ci` structure (~lines 260-271, 428-437) and hover CSS

**Goal:** When a user hovers a catalog card, the primary image cross-fades to a second image. For this prototype the "alt" image is the next image in the catalog sequence (card 01 → hovers to show 02; card 25 → hovers to show 01). In production this would be a dedicated alt-angle or framed-on-wall shot per SKU.

- [ ] **Step 1: Replace the `.ci` CSS rules with a two-image stack**

Find:
```css
.ci {
  aspect-ratio: 4/5;
  overflow: hidden;
  background: #ebe9e4;
  margin-bottom: 16px;
}
.ci img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: opacity 450ms ease;
}
```

Replace with:
```css
.ci {
  aspect-ratio: 4/5;
  overflow: hidden;
  background: #ebe9e4;
  margin-bottom: 16px;
  position: relative; /* stack alt image on top */
}
.ci img {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.ci img.alt {
  opacity: 0;
  transition: opacity 520ms cubic-bezier(.2,.6,.2,1);
}
.cat-cell:hover .ci img.alt { opacity: 1; }
/* override prior dim-on-hover rule — we replace it with cross-fade */
.cat-cell:hover .ci img { opacity: 1; }
```

Also DELETE the now-redundant rule (the old dim-on-hover):
```css
.cat-cell:hover .ci img { opacity: .80; }
```

- [ ] **Step 2: Update the JS that builds the grid to render two images per cell**

Find the grid-building IIFE (around lines 417-440):
```javascript
for (let i = 1; i <= 25; i++) {
    const n = String(i).padStart(2, '0');
    const p = prices[i - 1] || 180;
    grid.insertAdjacentHTML('beforeend',
      `<div class="cat-cell">
        <div class="ci">
          <img src="../public/images/catalog/pl-6604-${n}.jpg"
               alt="Untitled, ${n}" loading="lazy">
        </div>
        <span class="ct">Untitled, ${n}</span>
        <span class="cp">$${p}</span>
        <span class="ce">Edition of 10</span>
      </div>`
    );
  }
```

Replace with (adds alt image + wraps card in anchor → product page):
```javascript
for (let i = 1; i <= 25; i++) {
    const n    = String(i).padStart(2, '0');
    const next = String((i % 25) + 1).padStart(2, '0');   /* wrap: 25 → 01 */
    const p    = prices[i - 1] || 180;
    grid.insertAdjacentHTML('beforeend',
      `<a class="cat-cell" href="product-prototype.html">
        <div class="ci">
          <img src="../public/images/catalog/pl-6604-${n}.jpg"
               alt="Untitled, ${n}" loading="lazy">
          <img class="alt" src="../public/images/catalog/pl-6604-${next}.jpg"
               alt="" aria-hidden="true" loading="lazy">
        </div>
        <span class="ct">Untitled, ${n}</span>
        <span class="cp">$${p}</span>
        <span class="ce">Edition of 10</span>
      </a>`
    );
  }
```

- [ ] **Step 3: Update `.cat-cell` to style the anchor correctly**

Find:
```css
.cat-cell {
  background: var(--bg);
  padding: 36px 44px;
  cursor: pointer;
}
```

Replace with (anchors need explicit color/display reset):
```css
.cat-cell {
  background: var(--bg);
  padding: 36px 44px;
  cursor: pointer;
  display: block;
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 4: Reload preview and verify hover cross-fade works**

Run via `mcp__Claude_Preview__preview_eval`:
```javascript
(() => {
  location.reload();
  return 'reloading';
})()
```

Wait a moment, then run:
```javascript
(async () => {
  await new Promise(r => setTimeout(r, 400));
  const cell = document.querySelector('.cat-cell');
  const imgs = cell.querySelectorAll('.ci img');
  /* simulate hover by inspecting computed opacity under :hover is impossible via
     eval; instead verify markup is correct */
  return {
    imgCount: imgs.length,
    firstSrc: imgs[0]?.src.split('/').pop(),
    altSrc:   imgs[1]?.src.split('/').pop(),
    altHasAltClass: imgs[1]?.classList.contains('alt'),
    cellIsAnchor: cell.tagName,
    cellHref: cell.getAttribute('href'),
  };
})()
```

Expected:
```json
{
  "imgCount": 2,
  "firstSrc": "pl-6604-01.jpg",
  "altSrc":   "pl-6604-02.jpg",
  "altHasAltClass": true,
  "cellIsAnchor": "A",
  "cellHref": "product-prototype.html"
}
```

- [ ] **Step 5: Take a screenshot scrolled to the grid**

```javascript
(async () => {
  document.getElementById('prints').scrollIntoView();
  await new Promise(r => setTimeout(r, 200));
  return window.scrollY;
})()
```

Then `mcp__Claude_Preview__preview_screenshot`. Expected: primary image visible on each card, alt image hidden (opacity 0), captions below.

- [ ] **Step 6: Commit**

```bash
cd /Users/haivo/Downloads/prints-projects
git add design-extract-output/frame-prototype.html
git commit -m "feat(prototype): add cross-fade alt image on catalog card hover"
```

---

### Task 2: 3-column grid at viewports >1400px

**Files:**
- Modify: `design-extract-output/frame-prototype.html` — add a new media query just before the existing `@media (max-width: 700px)` block

**Goal:** On widescreen monitors (1400px+), show 3 prints per row instead of 2. Preserves the 2-col intimacy at laptop widths while giving density to widescreen users. Do NOT change the mobile or tablet breakpoints.

- [ ] **Step 1: Add the new min-width media query**

Find (around line 315, right before `/* ─── MOBILE */`):
```css
/* ─────────────────────────────────────────── MOBILE */
@media (max-width: 700px) {
```

Insert immediately ABOVE it:
```css
/* ─────────────────────────────────────────── WIDESCREEN
   Only loosen to 3 cols on very wide viewports — density without
   compromising the 2-col restraint on laptops.
*/
@media (min-width: 1400px) {
  .cat-grid { grid-template-columns: repeat(3, 1fr); }
}

/* ─────────────────────────────────────────── MOBILE */
@media (max-width: 700px) {
```

- [ ] **Step 2: Verify column count switches at 1400px**

Run via `preview_eval`:
```javascript
(() => {
  const cols = getComputedStyle(document.querySelector('.cat-grid'))
                 .gridTemplateColumns.split(' ').length;
  return { width: window.innerWidth, cols };
})()
```

At current preview viewport (typically 1200-1300px), expect `cols: 2`. Then resize via `mcp__Claude_Preview__preview_resize` to 1500×900 and re-run. Expect `cols: 3`.

- [ ] **Step 3: Restore preview viewport and screenshot**

Resize back to 1200×800 via `preview_resize`. Screenshot to confirm 2-col layout intact.

- [ ] **Step 4: Commit**

```bash
git add design-extract-output/frame-prototype.html
git commit -m "feat(prototype): 3-column catalog grid at widescreen (>1400px)"
```

---

### Task 3: Create product-prototype.html scaffold

**Files:**
- Create: `design-extract-output/product-prototype.html`

**Goal:** Stand up the page shell with design tokens, font imports, persistent top nav (unlike landing, this page shows nav immediately — the hero-reveal pattern only belongs to the landing), and empty containers for left gallery and right sticky rail.

- [ ] **Step 1: Create the file with shell markup and tokens**

Create `/Users/haivo/Downloads/prints-projects/design-extract-output/product-prototype.html` with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Untitled, 01 — At-Tamassok — Thalia Bassim</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Geist+Mono:wght@300;400&display=swap');
@font-face { font-family:'Favorit'; src:url('fonts/FavoritLightC.woff2') format('woff2'); font-weight:300; font-style:normal; font-display:swap; }
@font-face { font-family:'Favorit'; src:url('fonts/FavoritBookC.woff2') format('woff2'); font-weight:400; font-style:normal; font-display:swap; }

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

:root {
  --bg:   #faf9f6;
  --ink:  rgba(12,11,10,1);
  --i8:   rgba(12,11,10,.92);
  --i5:   rgba(12,11,10,.70);
  --i3:   rgba(12,11,10,.52);
  --i1:   rgba(12,11,10,.12);
  --rule: rgba(12,11,10,.22);
  --ff:  'Favorit','Helvetica Neue',sans-serif;
  --fs:  'EB Garamond',Georgia,serif;
  --fm:  'Geist Mono',monospace;
  --mat: 14px;    /* tighter than hero mat — many images stacked */
  --rail-w: 38vw; /* right column width */
  --rail-max: 520px;
}

html { scroll-behavior:smooth; }

body {
  font-family: var(--ff);
  background: var(--bg);
  color: var(--i8);
  font-weight: 400;
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

a { color:inherit; text-decoration:none; }

/* ─── NAV — persistent on product page */
.nav {
  position: sticky; top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: baseline;
  padding: 17px 44px;
  background: var(--bg);
  border-bottom: 1px solid var(--i1);
}
.nav-l  { font-size: 13px; letter-spacing: .06em; color: var(--i8); }
.nav-c  { font-family: var(--fs); font-style: italic; font-size: 18px;
          font-weight: 500; color: var(--ink); }
.nav-r  { display: flex; justify-content: flex-end; gap: 28px; align-items: baseline; }
.nav-r a{ font-size: 13px; letter-spacing: .06em; color: var(--i8); }
.nav-r .nav-essay { font-family: var(--fs); font-style: italic; font-size: 16px; }

/* ─── PAGE LAYOUT */
.page {
  display: grid;
  grid-template-columns: 1fr var(--rail-w);
  gap: 0;
  max-width: 1600px;
  margin: 0 auto;
}

.gallery {
  padding: 40px 20px 120px 44px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rail {
  position: sticky;
  top: 64px; /* below nav */
  align-self: start;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 48px 44px 48px 20px;
  max-width: var(--rail-max);
  width: 100%;
  border-left: 1px solid var(--i1);
}

/* ─── MOBILE */
@media (max-width: 900px) {
  .page { grid-template-columns: 1fr; }
  .gallery { padding: 20px 20px 120px; }
  .rail {
    position: static; height: auto; max-width: none;
    padding: 28px 20px 140px; /* bottom room for sticky CTA bar */
    border-left: 0; border-top: 1px solid var(--i1);
  }
}
</style>
</head>
<body>

<nav class="nav">
  <a href="frame-prototype.html" class="nav-l">← Thalia Bassim</a>
  <span class="nav-c">At-Tamassok</span>
  <div class="nav-r">
    <a href="frame-prototype.html#essay" class="nav-essay">Essay</a>
    <a href="frame-prototype.html#prints">All prints</a>
  </div>
</nav>

<main class="page">
  <section class="gallery" id="gallery">
    <!-- gallery images inserted in Task 4 -->
  </section>

  <aside class="rail" id="rail">
    <!-- rail content inserted in Tasks 5–8 -->
  </aside>
</main>

<script>
/* populated in later tasks */
</script>
</body>
</html>
```

- [ ] **Step 2: Verify the page loads and layout grid is correct**

Navigate the preview to the product page:
```javascript
(() => { location.href = '/design-extract-output/product-prototype.html'; return 'navigating'; })()
```

Wait, then measure:
```javascript
(async () => {
  await new Promise(r => setTimeout(r, 600));
  const page   = document.querySelector('.page');
  const gal    = document.getElementById('gallery');
  const rail   = document.getElementById('rail');
  const cs     = getComputedStyle(page);
  return {
    gridCols: cs.gridTemplateColumns,
    galW:  Math.round(gal.getBoundingClientRect().width),
    railW: Math.round(rail.getBoundingClientRect().width),
    railSticky: getComputedStyle(rail).position,
  };
})()
```

Expected at 1200px viewport: `gridCols` is two values, `railW ≈ 456` (38% of 1200), `railSticky: "sticky"`.

- [ ] **Step 3: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): scaffold product detail page with split-screen layout"
```

---

### Task 4: Left column — vertical gallery stack

**Files:**
- Modify: `design-extract-output/product-prototype.html` — populate `#gallery`

**Goal:** Four stacked images of "one print" in the gallery column. Each image wrapped in a double-rule mat matching the hero's frame treatment (outer 1px rule → 14px mat gap → inner 1px rule → image). Images stack with 2px gap between. On mobile the gallery stays single-column full-width.

Since each SKU would have its own set of alt shots in production, for this prototype we'll use catalog images 01, 02, 03, 04 as the four gallery plates.

- [ ] **Step 1: Add gallery-plate CSS inside the `<style>` block**

Append inside the existing `<style>` tag, just before the `@media (max-width: 900px)` block:
```css
/* ─── GALLERY PLATES — double-rule mat per image */
.plate-o {
  border: 1px solid var(--rule);
  padding: var(--mat);
  background: var(--bg);
}
.plate-i {
  border: 1px solid var(--rule);
  overflow: hidden;
  line-height: 0;
}
.plate-i img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4/5;
  object-fit: cover;
}
```

Then inside the existing mobile media query, add:
```css
  .plate-o { padding: 10px; }
```

(immediately after the existing `.rail { ... }` rule inside that media query).

- [ ] **Step 2: Populate the gallery in the `<script>` block**

Replace the empty `<script>` tag with:
```html
<script>
(function () {
  const gallery = document.getElementById('gallery');
  /* prototype: use images 01-04 as four "plates" of one print */
  const plates = ['01','02','03','04'];
  plates.forEach((n, idx) => {
    gallery.insertAdjacentHTML('beforeend',
      `<figure class="plate-o">
        <div class="plate-i">
          <img src="../public/images/catalog/pl-6604-${n}.jpg"
               alt="Untitled, 01 — plate ${idx + 1} of ${plates.length}"
               loading="${idx === 0 ? 'eager' : 'lazy'}">
        </div>
      </figure>`
    );
  });
}());
</script>
```

- [ ] **Step 3: Verify the four plates render with mats**

Reload preview, then:
```javascript
(async () => {
  location.reload();
  await new Promise(r => setTimeout(r, 500));
  const plates = document.querySelectorAll('.plate-o');
  const first  = plates[0].getBoundingClientRect();
  const img    = plates[0].querySelector('img').getBoundingClientRect();
  return {
    count: plates.length,
    firstPlateW: Math.round(first.width),
    firstImgW: Math.round(img.width),
    matGap: Math.round(img.left - first.left), /* should ≈ mat (14) + border (1) = 15 */
  };
})()
```

Expected: `count: 4`, `matGap: 15` (14px padding + 1px outer border).

- [ ] **Step 4: Screenshot gallery**

Take screenshot. Expected: four framed images stacked vertically in the left column with thin mat borders, tight 2px gaps between.

- [ ] **Step 5: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): stacked gallery with double-rule mats"
```

---

### Task 5: Right rail — breadcrumb, title, edition, price

**Files:**
- Modify: `design-extract-output/product-prototype.html` — populate `#rail`, add rail-header CSS

**Goal:** Top of the sticky rail shows: breadcrumb line ("Prints / Untitled, 01"), Arabic title + Latin title (Garamond italic), separator rule, edition metadata line, price. Typography hierarchy identical to the landing hero so the brand voice is continuous.

- [ ] **Step 1: Add rail-header CSS**

Append inside the existing `<style>` block, after the `.rail { ... }` rule:
```css
/* ─── RAIL CONTENT */
.crumb {
  font-family: var(--fm);
  font-size: 12px;
  letter-spacing: .08em;
  color: var(--i5);
  text-transform: uppercase;
  margin-bottom: 20px;
}
.crumb a       { color: var(--i5); }
.crumb a:hover { color: var(--ink); }
.crumb .sep    { margin: 0 .5em; opacity: .55; }

.r-title-ar {
  display: block;
  font-family: var(--fs);
  font-weight: 500;
  font-size: 44px;
  color: var(--ink);
  line-height: 1.1;
  margin-bottom: 10px;
  letter-spacing: .01em;
}
.r-title-en {
  display: block;
  font-family: var(--fs);
  font-style: italic;
  font-size: 26px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.15;
}
.r-rule {
  height: 1px;
  background: var(--i1);
  border: 0;
  margin: 28px 0 20px;
}
.r-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  font-family: var(--fm);
  font-size: 13px;
  color: var(--i8);
  margin-bottom: 24px;
}
.r-meta dt { color: var(--i5); letter-spacing: .04em; text-transform: uppercase; font-size: 11px; padding-top: 2px; }
.r-meta dd { color: var(--i8); }
.r-price {
  font-family: var(--fs);
  font-style: italic;
  font-size: 28px;
  color: var(--ink);
  margin-bottom: 28px;
}
```

- [ ] **Step 2: Insert the rail header markup inside `<aside id="rail">`**

Replace the comment `<!-- rail content inserted in Tasks 5–8 -->` with:
```html
<p class="crumb">
  <a href="frame-prototype.html#prints">Prints</a>
  <span class="sep">/</span>
  <span>Untitled, 01</span>
</p>

<h1>
  <span class="r-title-ar" lang="ar">التمسّك ٠١</span>
  <span class="r-title-en">Untitled, 01</span>
</h1>

<hr class="r-rule">

<dl class="r-meta">
  <dt>Photographer</dt> <dd>Thalia Bassim</dd>
  <dt>Year</dt>         <dd>2024</dd>
  <dt>Edition</dt>      <dd>10 + 2 AP</dd>
  <dt>Paper</dt>        <dd>Hahnemühle Photo Rag 308gsm</dd>
  <dt>Signed</dt>       <dd>Yes, verso</dd>
</dl>

<p class="r-price">From $140</p>

<!-- size pills (Task 6) -->
<!-- add to cart (Task 7) -->
<!-- accordions (Task 8) -->
```

- [ ] **Step 3: Verify rail header measurements**

```javascript
(() => {
  const ar = document.querySelector('.r-title-ar').getBoundingClientRect();
  const en = document.querySelector('.r-title-en').getBoundingClientRect();
  const cs = getComputedStyle.bind(null);
  return {
    arSize:  cs(document.querySelector('.r-title-ar')).fontSize,
    enSize:  cs(document.querySelector('.r-title-en')).fontSize,
    arHeight: Math.round(ar.height),
    priceSize: cs(document.querySelector('.r-price')).fontSize,
  };
})()
```

Expected: `arSize: "44px"`, `enSize: "26px"`, `priceSize: "28px"`.

- [ ] **Step 4: Screenshot**

Expected: breadcrumb small caps at top, large Arabic, italic Latin below, hair-thin rule, meta table in mono, italic price.

- [ ] **Step 5: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): rail header — crumb, title, meta table, price"
```

---

### Task 6: Size selector — 40px-radius pills (the only round element)

**Files:**
- Modify: `design-extract-output/product-prototype.html` — add pills CSS + markup + selection JS

**Goal:** Four size options rendered as pill buttons (40px radius). Default state: transparent bg, 1px ink border. Hover: border thickens via box-shadow inset. Selected: filled ink bg, bg-color text. One option greyed-out (mimics Lemaire's OOS state) to show the affordance. Radius = 40px is intentional — it's the ONLY round element in the entire design system so the pills pop.

- [ ] **Step 1: Add pill CSS**

Append inside `<style>`, after the `.r-price` rule:
```css
/* ─── SIZE PILLS — the only round element in the entire design */
.sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.sizes-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--i5);
  margin-bottom: 10px;
}
.sizes-head a { color: var(--i8); font-size: 12px; text-transform: none; letter-spacing: 0; border-bottom: 1px solid var(--i3); padding-bottom: 1px; }
.sizes-head a:hover { color: var(--ink); border-color: var(--ink); }

.pill {
  appearance: none;
  font-family: var(--ff);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: .02em;
  padding: 11px 20px;
  border-radius: 40px;
  border: 1px solid var(--i3);
  background: transparent;
  color: var(--i8);
  cursor: pointer;
  transition: border-color 180ms, color 180ms, background 180ms;
}
.pill:hover { border-color: var(--ink); color: var(--ink); }
.pill:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.pill[aria-pressed="true"] {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.pill[disabled] {
  color: var(--i3);
  border-color: var(--i1);
  cursor: not-allowed;
  text-decoration: line-through;
}
.pill .pill-price {
  margin-left: 10px;
  font-family: var(--fm);
  font-size: 12px;
  opacity: .78;
}
```

- [ ] **Step 2: Insert size-pills markup**

Find the comment `<!-- size pills (Task 6) -->` in the rail and replace with:
```html
<div class="sizes-head">
  <span>Size</span>
  <a href="#" id="sizeGuide">Size guide</a>
</div>
<div class="sizes" role="group" aria-label="Print size">
  <button class="pill" type="button" aria-pressed="false" data-price="140">8 × 10 in <span class="pill-price">$140</span></button>
  <button class="pill" type="button" aria-pressed="true"  data-price="180">11 × 14 in <span class="pill-price">$180</span></button>
  <button class="pill" type="button" aria-pressed="false" data-price="240">16 × 20 in <span class="pill-price">$240</span></button>
  <button class="pill" type="button" aria-pressed="false" disabled>20 × 24 in <span class="pill-price">Sold out</span></button>
</div>
```

- [ ] **Step 3: Wire pill selection to update price**

Inside the existing `<script>` block, below the gallery IIFE, append:
```javascript
/* ─── Size pill selection ─── */
(function () {
  const pills = document.querySelectorAll('.pill');
  const price = document.querySelector('.r-price');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      if (p.hasAttribute('disabled')) return;
      pills.forEach(x => x.setAttribute('aria-pressed', 'false'));
      p.setAttribute('aria-pressed', 'true');
      const v = p.getAttribute('data-price');
      if (v && price) price.textContent = '$' + v;
    });
  });
}());
```

- [ ] **Step 4: Verify pill state and click updates price**

```javascript
(() => {
  const pills  = [...document.querySelectorAll('.pill')];
  const price  = document.querySelector('.r-price');
  const initial= { selected: pills.findIndex(p => p.getAttribute('aria-pressed') === 'true'),
                   price: price.textContent };
  pills[2].click();
  const after  = { selected: pills.findIndex(p => p.getAttribute('aria-pressed') === 'true'),
                   price: price.textContent };
  const radius = getComputedStyle(pills[0]).borderRadius;
  return { initial, after, radius };
})()
```

Expected: `initial.selected: 1` (middle pill pre-selected), `initial.price: "$180"`, after clicking pill[2] → `after.selected: 2`, `after.price: "$240"`, `radius: "40px"`.

- [ ] **Step 5: Screenshot**

Expected: row of 4 pills, second pill filled ink, last pill strikethrough-disabled. The round pills should visibly contrast against all the right-angle architecture.

- [ ] **Step 6: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): size selector pills (40px radius, the only round element)"
```

---

### Task 7: Add to Cart button (desktop + mobile sticky bar)

**Files:**
- Modify: `design-extract-output/product-prototype.html` — add CTA CSS and markup, plus mobile sticky bar

**Goal:** Solid-ink full-width button in the rail. Below it, a tiny "edition 3 of 10 available" reassurance line. On mobile (<900px) the in-rail button stays, but ALSO a fixed sticky bar pinned to the viewport bottom appears with title + price + mini-CTA. The sticky bar only appears on mobile.

- [ ] **Step 1: Add CTA and sticky-bar CSS**

Append inside `<style>`:
```css
/* ─── ADD TO CART — solid ink rectangle, zero radius */
.cta {
  display: block;
  width: 100%;
  padding: 18px 24px;
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: 0;
  font-family: var(--ff);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 180ms, transform 180ms;
}
.cta:hover       { opacity: .86; }
.cta:active      { transform: translateY(1px); }
.cta:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

.cta-note {
  margin-top: 12px;
  font-family: var(--fm);
  font-size: 12px;
  color: var(--i5);
  letter-spacing: .01em;
}
.cta-note .dot { display: inline-block; width: 6px; height: 6px; background: var(--ink); border-radius: 50%; margin-right: 8px; transform: translateY(-1px); }

/* ─── MOBILE STICKY BAR */
.stickybar {
  display: none; /* shown at mobile breakpoint */
  position: fixed;
  inset: auto 0 0 0;
  z-index: 80;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0));
  background: var(--bg);
  border-top: 1px solid var(--i1);
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
}
.stickybar .sb-info {
  min-width: 0;
}
.stickybar .sb-title {
  display: block;
  font-family: var(--fs);
  font-style: italic;
  font-size: 16px;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.stickybar .sb-price {
  display: block;
  font-family: var(--fm);
  font-size: 13px;
  color: var(--i8);
}
.stickybar .cta {
  padding: 14px 22px;
  width: auto;
}
```

Inside the existing mobile media query (`@media (max-width: 900px)`) append:
```css
  .stickybar { display: grid; }
```

- [ ] **Step 2: Add markup — in-rail CTA**

Find the comment `<!-- add to cart (Task 7) -->` and replace with:
```html
<button class="cta" type="button" id="addCta">Add to cart — $180</button>
<p class="cta-note"><span class="dot"></span>3 of 10 available in this size</p>
```

- [ ] **Step 3: Add markup — mobile sticky bar**

Just before the closing `</body>` tag, add:
```html
<div class="stickybar" role="region" aria-label="Buy bar">
  <div class="sb-info">
    <span class="sb-title">Untitled, 01</span>
    <span class="sb-price" id="sbPrice">$180</span>
  </div>
  <button class="cta" type="button">Add to cart</button>
</div>
```

- [ ] **Step 4: Extend the pill click handler to update the CTA + sticky bar price**

Replace the existing pill-selection IIFE with:
```javascript
/* ─── Size pill selection ─── */
(function () {
  const pills   = document.querySelectorAll('.pill');
  const price   = document.querySelector('.r-price');
  const cta     = document.getElementById('addCta');
  const sbPrice = document.getElementById('sbPrice');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      if (p.hasAttribute('disabled')) return;
      pills.forEach(x => x.setAttribute('aria-pressed', 'false'));
      p.setAttribute('aria-pressed', 'true');
      const v = p.getAttribute('data-price');
      if (!v) return;
      const label = '$' + v;
      if (price)   price.textContent   = label;
      if (cta)     cta.textContent     = 'Add to cart — ' + label;
      if (sbPrice) sbPrice.textContent = label;
    });
  });
}());
```

- [ ] **Step 5: Verify CTA styling and mobile sticky bar visibility**

Desktop check (1200px):
```javascript
(() => {
  const cta = document.getElementById('addCta');
  const sb  = document.querySelector('.stickybar');
  const cs  = getComputedStyle.bind(null);
  const rect= cta.getBoundingClientRect();
  return {
    ctaBg:    cs(cta).backgroundColor,
    ctaColor: cs(cta).color,
    ctaRadius:cs(cta).borderRadius,
    ctaFullWidth: Math.round(rect.width),
    railWidth: Math.round(cta.parentElement.getBoundingClientRect().width - 64), /* minus padding */
    stickybarDisplay: cs(sb).display,
  };
})()
```

Expected: `ctaBg` rgba(12,11,10,1), `ctaRadius: "0px"`, `stickybarDisplay: "none"` on desktop.

Mobile check — resize to 420×900:
```javascript
(() => {
  const sb = document.querySelector('.stickybar');
  const cs = getComputedStyle(sb);
  return { display: cs.display, position: cs.position, bottom: cs.bottom };
})()
```

Expected: `display: "grid"`, `position: "fixed"`, `bottom: "0px"`.

Restore viewport to 1200×800.

- [ ] **Step 6: Click a pill and confirm price updates everywhere**

```javascript
(() => {
  document.querySelectorAll('.pill')[2].click();
  return {
    pillSelected: document.querySelector('.pill[aria-pressed="true"]').textContent.trim().slice(0,10),
    rail: document.querySelector('.r-price').textContent,
    cta:  document.getElementById('addCta').textContent,
    sb:   document.getElementById('sbPrice').textContent,
  };
})()
```

Expected: all three price readouts show `$240`.

- [ ] **Step 7: Screenshots**

Desktop: rail with solid-ink CTA. Mobile: CTA in rail AND sticky bar at bottom.

- [ ] **Step 8: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): solid-ink CTA + mobile sticky buy bar"
```

---

### Task 8: Collapsible info sections

**Files:**
- Modify: `design-extract-output/product-prototype.html` — add accordion CSS + markup using native `<details>` / `<summary>`

**Goal:** Below the CTA, four collapsible sections: About this print, Framing, Shipping & returns, Care. Use native `<details>` so it works without JS and has built-in keyboard a11y. Customize the chevron so it's typographic (a single + / −) rather than a triangle.

- [ ] **Step 1: Add accordion CSS**

Append inside `<style>`:
```css
/* ─── ACCORDIONS */
.accordions {
  margin-top: 36px;
  border-top: 1px solid var(--i1);
}
.accordions details {
  border-bottom: 1px solid var(--i1);
}
.accordions summary {
  list-style: none;
  padding: 18px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--ink);
  transition: color 180ms;
}
.accordions summary::-webkit-details-marker { display: none; }
.accordions summary:hover { color: var(--i8); }
.accordions summary::after {
  content: '+';
  font-family: var(--ff);
  font-size: 18px;
  font-weight: 400;
  color: var(--i5);
  transition: transform 220ms, color 180ms;
}
.accordions details[open] > summary::after {
  content: '–';
  color: var(--ink);
}
.accordions .acc-body {
  padding: 2px 0 22px;
  font-family: var(--fs);
  font-style: italic;
  font-size: 15px;
  line-height: 1.65;
  color: var(--i8);
  max-width: 42ch;
}
.accordions .acc-body ul { padding-left: 1.1em; margin-top: 6px; }
.accordions .acc-body li { margin-bottom: 4px; }
```

- [ ] **Step 2: Insert accordion markup**

Find the comment `<!-- accordions (Task 8) -->` and replace with:
```html
<section class="accordions">
  <details open>
    <summary>About this print</summary>
    <div class="acc-body">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Printed on
      Hahnemühle Photo Rag 308 gsm archival cotton paper. Each print is
      individually inspected, signed verso in graphite, and numbered within
      an edition of ten plus two artist proofs.
    </div>
  </details>

  <details>
    <summary>Framing</summary>
    <div class="acc-body">
      Sold unframed by default. A conservation-grade oak float frame with
      4-ply museum rag mat and UV-protective glazing is available at
      checkout — add $180, ships within 4 weeks.
    </div>
  </details>

  <details>
    <summary>Shipping &amp; returns</summary>
    <div class="acc-body">
      Ships flat in an archival tube or rigid portfolio within 7 working
      days, via insured courier. Worldwide. Returns accepted within 14
      days if the print is unopened.
    </div>
  </details>

  <details>
    <summary>Care</summary>
    <div class="acc-body">
      Handle by the edges only. Avoid direct sunlight and humidity above
      60%. Store flat or in the supplied sleeve until framed.
    </div>
  </details>
</section>
```

- [ ] **Step 3: Verify accordion behavior**

```javascript
(() => {
  const all = [...document.querySelectorAll('.accordions details')];
  const openCount = all.filter(d => d.open).length;
  all[1].open = true;
  const afterOpen = all.filter(d => d.open).length;
  all[1].open = false;
  return {
    total: all.length,
    initialOpen: openCount,
    afterOpen,
    chevron: getComputedStyle(all[0].querySelector('summary'), '::after').content,
  };
})()
```

Expected: `total: 4`, `initialOpen: 1` (first is open), `afterOpen: 2`.

- [ ] **Step 4: Screenshot**

Expected: four bordered rows under the CTA. First row expanded with italic body copy; others collapsed with `+` marker.

- [ ] **Step 5: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): collapsible info accordions (about/frame/ship/care)"
```

---

### Task 9: Mobile layout polish — sticky bar breathing room + gallery spacing

**Files:**
- Modify: `design-extract-output/product-prototype.html` — mobile media query refinements

**Goal:** At viewport ≤900px, ensure the sticky bar doesn't obscure rail content (bottom padding already handled at 140px in Task 3 scaffold, but verify), gallery gap is slightly tighter for mobile screen real-estate, and the title scales down.

- [ ] **Step 1: Refine mobile media query**

Find the existing mobile media query block:
```css
@media (max-width: 900px) {
  .page { grid-template-columns: 1fr; }
  .gallery { padding: 20px 20px 120px; }
  .rail {
    position: static; height: auto; max-width: none;
    padding: 28px 20px 140px; /* bottom room for sticky CTA bar */
    border-left: 0; border-top: 1px solid var(--i1);
  }
  .plate-o { padding: 10px; }
  .stickybar { display: grid; }
}
```

Replace the whole block with:
```css
@media (max-width: 900px) {
  .page { grid-template-columns: 1fr; }

  .gallery {
    padding: 20px 20px 40px;
    gap: 4px;
  }
  .plate-o { padding: 10px; }

  .rail {
    position: static; height: auto; max-width: none;
    padding: 28px 20px 140px; /* bottom room for sticky CTA bar */
    border-left: 0; border-top: 1px solid var(--i1);
  }

  .r-title-ar { font-size: 36px; }
  .r-title-en { font-size: 22px; }
  .r-price    { font-size: 24px; }

  .nav { padding: 14px 20px; }
  .nav-c { display: none; } /* center "At-Tamassok" removed on small */

  .stickybar { display: grid; }
}

@media (max-width: 480px) {
  .sizes .pill { padding: 10px 14px; font-size: 12px; }
  .sizes .pill .pill-price { margin-left: 6px; }
}
```

- [ ] **Step 2: Verify mobile typographic scale and layout**

Resize preview to 420×900:
```javascript
(() => {
  const cs = getComputedStyle;
  return {
    titleAr: cs(document.querySelector('.r-title-ar')).fontSize,
    titleEn: cs(document.querySelector('.r-title-en')).fontSize,
    price:   cs(document.querySelector('.r-price')).fontSize,
    navCenterDisplay: cs(document.querySelector('.nav-c')).display,
    stickybarVisible: cs(document.querySelector('.stickybar')).display,
    pageCols: cs(document.querySelector('.page')).gridTemplateColumns,
  };
})()
```

Expected: `titleAr: "36px"`, `titleEn: "22px"`, `price: "24px"`, `navCenterDisplay: "none"`, `stickybarVisible: "grid"`, `pageCols` is a single value (one column).

- [ ] **Step 3: Scroll to CTA and verify sticky bar does not cover the rail CTA**

```javascript
(async () => {
  document.getElementById('addCta').scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 200));
  const cta = document.getElementById('addCta').getBoundingClientRect();
  const sb  = document.querySelector('.stickybar').getBoundingClientRect();
  return {
    ctaBottom: Math.round(cta.bottom),
    sbTop: Math.round(sb.top),
    overlap: cta.bottom > sb.top,
  };
})()
```

Expected: `overlap: false`.

- [ ] **Step 4: Screenshot at 420×900**

Expected: gallery stacks full-width, info below, sticky bar with title + price + small CTA docked to viewport bottom.

Restore viewport to 1200×800.

- [ ] **Step 5: Commit**

```bash
git add design-extract-output/product-prototype.html
git commit -m "feat(prototype): mobile polish — title scale, sticky-bar clearance"
```

---

### Task 10: Wire landing → product page (final polish)

**Files:**
- Modify: `design-extract-output/frame-prototype.html` — already linked in Task 1; verify round-trip

**Goal:** Confirm the full user journey works: land on `frame-prototype.html`, scroll to grid, click a card → product page loads, click "← Thalia Bassim" in top-left → back to landing. Take before/after screenshots for the record.

- [ ] **Step 1: Navigate landing → product via click simulation**

```javascript
(async () => {
  location.href = '/design-extract-output/frame-prototype.html';
  await new Promise(r => setTimeout(r, 600));
  document.getElementById('prints').scrollIntoView();
  await new Promise(r => setTimeout(r, 300));
  /* verify first card is anchor pointing to product page */
  const firstCard = document.querySelector('.cat-cell');
  return {
    tag: firstCard.tagName,
    href: firstCard.getAttribute('href'),
  };
})()
```

Expected: `tag: "A"`, `href: "product-prototype.html"`.

- [ ] **Step 2: Navigate directly to product page and verify back link**

```javascript
(async () => {
  location.href = '/design-extract-output/product-prototype.html';
  await new Promise(r => setTimeout(r, 600));
  const back = document.querySelector('.nav-l');
  return {
    backText: back.textContent.trim(),
    backHref: back.getAttribute('href'),
  };
})()
```

Expected: `backText` starts with `"← "`, `backHref: "frame-prototype.html"`.

- [ ] **Step 3: Final screenshots — one desktop, one mobile**

Desktop (1200×800):
- Load `product-prototype.html`
- `preview_screenshot` → archive as evidence

Mobile (420×900):
- `preview_resize` to 420×900
- `preview_screenshot` → archive as evidence
- `preview_resize` back to 1200×800

- [ ] **Step 4: Commit final state**

```bash
cd /Users/haivo/Downloads/prints-projects
git add design-extract-output/frame-prototype.html design-extract-output/product-prototype.html
git status /* should be clean except for any final tweaks */
git commit -m "feat(prototype): Lemaire-inspired buy UI — landing → product flow wired" --allow-empty
```

---

## Self-Review Notes

- **Coverage vs assessment:** All 6 "Steal" items from the Lemaire assessment (#4, #5, #6, #7, #8, #2-conditional) are implemented across Tasks 1–9. "Reject" items (3:4 aspect, 2px gap grid, announcement bar, BrownStd/literal-black) are not touched. #10 (cart drawer) is deliberately deferred — building it requires also building a cart model, which is out of scope for a "product detail page" prototype.
- **Type/naming consistency:** Pills selector is `.pill` in every task. Price element IDs: `.r-price` (rail), `#addCta` (main button), `#sbPrice` (sticky bar) — all referenced consistently by the single pill-click IIFE in Task 7 Step 4.
- **No placeholders:** Every code block is complete. Every verification step has an exact `preview_eval` expression and exact expected return shape.
- **One-file prototype discipline:** Everything is in two HTML files — no build step, no npm install, no framework to learn. Matches the project's existing prototype approach.
