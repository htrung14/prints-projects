# Session Handoff B — 2026-04-20 (afternoon)

> Continuation of the morning session. Build is green.

## What shipped this afternoon

### Font decisions locked

- **Suisse Intl locked** as secondary/serif font — Inter and Helvetica Neue removed from layout
- Font toggle removed, AccentToggle added then removed (color decided)
- Geist Mono removed — `--font-mono` now points to Suisse Intl
- Header uses Suisse Intl at 17px/600 weight

### CTA button

- Color: Pantone French Blue `#0072BB` (was Klein blue, then navy, settled on French Blue)
- Active state: `#005a94`
- Thinner padding: 10px vertical
- Sentence case (removed all uppercase site-wide)
- Uses CSS variable `--btn-accent` / `--btn-accent-active`

### Hero (full bleed only)

- Vertical/split toggle removed — full bleed is the only layout
- Image: North Lebanon, October 2020 (`north-lebanon-oct-2020`)
- Arabic + "At-Tamassok" centered in the middle of the image
- Text overlay at bottom with gradient
- `object-position: center 30%` to keep trees visible
- `100dvh + header` height with negative margin for true full bleed
- Mobile: text absolute bottom, "Read the essay" visible, "View prints" hidden

### BuyUI (product detail page)

- Breadcrumb removed (gallery pages don't breadcrumb)
- "Edition price" label removed — price stands alone at 30px
- Paper pills removed (single paper type)
- All text sentence case, no uppercase anywhere
- Shipping meta: "Each print made to order · ships within 14 business days"
- Description always open
- Title not italicized
- Size: 8 × 10 in (changed from 16×20)
- Price on grid cards: hover-only on desktop, always visible on mobile
- "From" removed from price display

### Info page (`/info`)

- French Blue (`#0072BB`) background, white text
- Von Steiner-inspired staggered layout
- Sections: Title → About → Background (indented right) → CV (solo exhibitions, group exhibitions, publications, performance, commissions + correspond/credits on same row)
- CV data parsed from artist's portfolio PDF
- Credits: "Design — ediciones studio / Development — Hai Vo"
- Header/footer match blue on `/info`

### Essay page (`/essay`)

- Acid yellow (`#E2E052`) background with paper grain texture
- Dark text
- Header/footer match yellow on `/essay`
- "Filed" / "Frames" metadata removed
- "By Thalia Bassim" removed from masthead
- Attribution added to top: "Introduction by Thalia Bassim / Essay by Zacarias Gonzalez"
- All border lines removed
- "View the prints →" not italicized, uses French Blue color
- Pull quote left border removed

### Data consistency

- 25 photos in fixture (added 25th: North Lebanon (4), October 2020)
- All editions: 10 (was 25)
- All sizes: 8×10 (was 16×20)
- Titles updated to match file naming: Roman numerals → parenthetical numbers
- Commas added before dates in all title displays
- AT-025 reference number (was TBS-025)
- Year corrected on 25th entry (2020, not 2026)

### Header

- Suisse Intl, 17px, semibold (600)
- "Info" link added
- "View prints" hidden on mobile
- Back arrow removed
- Blue background on `/info` and `/essay` pages

### Footer

- "Info" link added
- "Free US shipping on 2 prints" removed from cart
- Blue/yellow background matching on `/info` and `/essay`

### Cleanup

- `src/middleware.ts` → `src/proxy.ts` (Next 16 deprecation)
- FontToggle.tsx and AccentToggle.tsx still exist but not mounted
- Detail page frame/mat removed (clean image, no wrapper)
- `--accent: #8b5e3c` still in globals.css (used by lab pages)
- Instagram link still placeholder (`https://instagram.com`)

## Pending

- [ ] Per-image descriptions (all 25 use identical boilerplate)
- [ ] Instagram handle (currently placeholder)
- [ ] Contact email verification (`thalia@bassim.studio` — from footer, unverified)
- [ ] Stripe fee pass-through decision
- [ ] Mobile full bleed text still tight on some devices
- [ ] Clean up unused FontToggle.tsx, AccentToggle.tsx files
- [ ] Info page inline styles → CSS classes (Gemini Pro recommendation)
- [ ] `--font-serif` conflicting definition in globals.css (line 37 vs @theme block)
