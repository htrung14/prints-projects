# Design Language: more simple chair — Jake Goff

> Extracted from `https://jakegoff.com/more-simple-chair` on April 18, 2026
> 767 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role    | Hex       | RGB            | HSL                 | Usage Count |
| ------- | --------- | -------------- | ------------------- | ----------- |
| Primary | `#0000ee` | rgb(0, 0, 238) | hsl(240, 100%, 47%) | 6           |

### Neutral Colors

| Hex       | HSL              | Usage Count |
| --------- | ---------------- | ----------- |
| `#000000` | hsl(0, 0%, 0%)   | 1512        |
| `#808080` | hsl(0, 0%, 50%)  | 28          |
| `#ffffff` | hsl(0, 0%, 100%) | 6           |

### Background Colors

Used on large-area elements: `#ffffff`

### Text Colors

Text color palette: `#000000`, `#808080`, `#0000ee`

### Full Color Inventory

| Hex       | Contexts                 | Count |
| --------- | ------------------------ | ----- |
| `#000000` | text, border, background | 1512  |
| `#808080` | text, border             | 28    |
| `#ffffff` | background               | 6     |
| `#0000ee` | text, border             | 6     |

## Typography

### Font Families

- **Diatype Variable** — used for body (690 elements)
- **-apple-system** — used for body (54 elements)
- **Times** — used for body (22 elements)
- **Inter** — used for body (1 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                      |
| --------- | ---------- | ------ | ----------- | -------------- | ---------------------------- |
| 14.5px    | 0.9063rem  | 400    | 23.925px    | normal         | body, customhtml, style, div |
| 11.52px   | 0.72rem    | 400    | normal      | normal         | html, head, meta, title      |
| 9.216px   | 0.576rem   | 400    | 10.5984px   | normal         | bodycopy, div, span, style   |
| 5.76px    | 0.36rem    | 400    | 6.624px     | normal         | span                         |

### Body Text

```css
body {
  font-size: 9.216px;
  font-weight: 400;
  line-height: 10.5984px;
}
```

### Font Weights in Use

`400` (767x)

## Spacing

**Base unit:** 2px

| Token       | Value | Rem        |
| ----------- | ----- | ---------- |
| spacing-6   | 6px   | 0.375rem   |
| spacing-20  | 20px  | 1.25rem    |
| spacing-190 | 190px | 11.875rem  |
| spacing-328 | 328px | 20.5rem    |
| spacing-415 | 415px | 25.9375rem |

## CSS Custom Properties

### Spacing

```css
--base-size: 11.52px;
--mobile-padding-offset: 1;
```

### Other

```css
--replace-ui-fadein: 0;
--min-viewport-height: 800px;
--mobile-scale: 1.5;
--viewport-height: 800px;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Transitions & Animations

**Easing functions:** `[object Object]`

**Durations:** `0.3s`, `0.2s`, `0.222s`

### Common Transitions

```css
transition: all;
transition: filter 0.3s;
transition: opacity 0.2s ease-in-out;
transition: opacity 0.222s ease-in-out;
```

### Keyframe Animations

**scrollAnimationFadeIn-1**

```css
@keyframes scrollAnimationFadeIn-1 {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
}
```

**scrollAnimationFadeIn-2**

```css
@keyframes scrollAnimationFadeIn-2 {
  0% {
    opacity: 0;
  }
  22.5% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
```

**scrollAnimationFadeIn-3**

```css
@keyframes scrollAnimationFadeIn-3 {
  0% {
    opacity: 0;
  }
  38% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
```

**scrollAnimationFadeOut-1**

```css
@keyframes scrollAnimationFadeOut-1 {
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

**scrollAnimationFadeOut-2**

```css
@keyframes scrollAnimationFadeOut-2 {
  0% {
    opacity: 1;
  }
  77.5% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

**scrollAnimationFadeOut-3**

```css
@keyframes scrollAnimationFadeOut-3 {
  0% {
    opacity: 1;
  }
  65% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

**scrollAnimationFadeInOut-1**

```css
@keyframes scrollAnimationFadeInOut-1 {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

**scrollAnimationFadeInOut-2**

```css
@keyframes scrollAnimationFadeInOut-2 {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  82.5% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

**scrollAnimationFadeInOut-3**

```css
@keyframes scrollAnimationFadeInOut-3 {
  0% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

**scrollAnimationFlyIn-1**

```css
@keyframes scrollAnimationFlyIn-1 {
  0% {
    transform: translateY(5vh);
  }
  15% {
    transform: scale(1);
  }
  85% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Links (23 instances)

```css
.link {
  color: rgba(0, 0, 0, 0.85);
  font-size: 9.216px;
  font-weight: 400;
}
```

### Navigation (3 instances)

```css
.navigatio {
  color: rgba(0, 0, 0, 0.85);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: absolute;
}
```

### Footer (1 instances)

```css
.foote {
  color: rgba(0, 0, 0, 0.6);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 5.76px;
}
```

## Layout System

**0 grid containers** and **91 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 100%      | 0px     |
| 33.33%    | 0px     |
| 415.109px | 0px     |
| 409.359px | 0px     |

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| column/nowrap  | 42x   |
| row/nowrap     | 42x   |
| row/wrap       | 7x    |

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 16px      | No          | 0           | No        | 1887px      |
| tablet (768px)   | 16px      | No          | 0           | No        | 3523px      |
| desktop (1280px) | 14.5px    | No          | 0           | No        | 1860px      |
| wide (1920px)    | 14.5px    | No          | 0           | No        | 2725px      |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- Page height: `1887px` → `3523px`

**768px → 1280px** (tablet → desktop):

- Body font size: `16px` → `14.5px`
- Page height: `3523px` → `1860px`

**1280px → 1920px** (desktop → wide):

- Page height: `1860px` → `2725px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 20 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio  | Level |
| ---------- | ---------- | ------ | ----- |
| `#808080`  | `#000000`  | 5.32:1 | AA    |
| `#000000`  | `#ffffff`  | 21:1   | AAA   |

## Design System Score

**Overall: 87/100 (Grade: B)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 100/100 |
| Typography Consistency    | 50/100  |
| Spacing System            | 100/100 |
| Shadow Consistency        | 80/100  |
| Border Radius Consistency | 100/100 |
| Accessibility             | 100/100 |
| CSS Tokenization          | 75/100  |

**Strengths:** Tight, disciplined color palette, Well-defined spacing scale, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**

- 4 font families — consider limiting to 2 (heading + body)
- 38 !important rules — prefer specificity over overrides
- 87% of CSS is unused — consider purging
- 1737 duplicate CSS declarations

## Z-Index Map

**9 unique z-index values** across 2 layers.

| Layer    | Range   | Elements                                                                                                                                                                                                                                                                                      |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dropdown | 393,399 | div.p.a.g.e. .p.i.n.n.e.d. .p.i.n.n.e.d.-.t.o.p. .f.i.x.e.d. .s.t.a.c.k.e.d.-.p.a.g.e. .a.l.l.o.w.-.s.c.r.o.l.l, div.p.a.g.e. .p.i.n.n.e.d. .p.i.n.n.e.d.-.t.o.p. .f.i.x.e.d. .s.t.a.c.k.e.d.-.p.a.g.e, div.p.a.g.e. .p.i.n.n.e.d. .p.i.n.n.e.d.-.t.o.p. .f.i.x.e.d. .s.t.a.c.k.e.d.-.p.a.g.e |
| base     | -99,2   | div, div, div                                                                                                                                                                                                                                                                                 |

## Font Files

| Family                     | Source       | Weights                                     | Styles         |
| -------------------------- | ------------ | ------------------------------------------- | -------------- |
| Diatype Variable           | self-hosted  | 200 1000                                    | normal, italic |
| Diatype Semi-Mono Variable | self-hosted  | 200 700                                     | normal, italic |
| Diatype Mono Variable      | self-hosted  | 200 700                                     | normal, italic |
| Marist Variable            | self-hosted  | 350 900                                     | normal, italic |
| Inter                      | self-hosted  | 600, 900, bold, normal                      | normal, italic |
| EB Garamond                | google-fonts | 100, 200, 300, 400, 500, 600, 700, 800, 900 | italic, normal |

**Google Fonts URL:** `https://fonts.googleapis.com/css?family=EB+Garamond:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic`

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Diatype Variable` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
