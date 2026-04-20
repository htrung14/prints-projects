# Design Language: Lars Egert – Visuelle Gestaltung

> Extracted from `https://www.larsegert.ch/` on April 18, 2026
> 891 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role    | Hex       | RGB            | HSL               | Usage Count |
| ------- | --------- | -------------- | ----------------- | ----------- |
| Primary | `#ff0000` | rgb(255, 0, 0) | hsl(0, 100%, 50%) | 66          |

### Neutral Colors

| Hex       | HSL              | Usage Count |
| --------- | ---------------- | ----------- |
| `#323232` | hsl(0, 0%, 20%)  | 1038        |
| `#000000` | hsl(0, 0%, 0%)   | 678         |
| `#ffffff` | hsl(0, 0%, 100%) | 2           |
| `#1a1a1a` | hsl(0, 0%, 10%)  | 1           |

### Background Colors

Used on large-area elements: `#ffffff`

### Text Colors

Text color palette: `#000000`, `#ff0000`, `#323232`

### Full Color Inventory

| Hex       | Contexts     | Count |
| --------- | ------------ | ----- |
| `#323232` | text, border | 1038  |
| `#000000` | text, border | 678   |
| `#ff0000` | text, border | 66    |
| `#ffffff` | background   | 2     |
| `#1a1a1a` | background   | 1     |

## Typography

### Font Families

- **Helvetica Neue** — used for all (818 elements)
- **Times** — used for body (71 elements)
- **Icons** — used for body (1 elements)
- **-apple-system** — used for body (1 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                  |
| --------- | ---------- | ------ | ----------- | -------------- | ------------------------ |
| 128px     | 8rem       | 500    | 166.4px     | normal         | bodycopy, div, span, a   |
| 28px      | 1.75rem    | 400    | 28px        | normal         | a                        |
| 23.04px   | 1.44rem    | 400    | 23.04px     | normal         | a                        |
| 14.976px  | 0.936rem   | 500    | 18.432px    | normal         | h1, span, a              |
| 11.52px   | 0.72rem    | 400    | normal      | normal         | html, head, script, meta |
| 9.216px   | 0.576rem   | 500    | 11.52px     | normal         | div, a, u                |

### Heading Scale

```css
h1 {
  font-size: 14.976px;
  font-weight: 500;
  line-height: 18.432px;
}
```

### Body Text

```css
body {
  font-size: 14.976px;
  font-weight: 500;
  line-height: 18.432px;
}
```

### Font Weights in Use

`500` (818x), `400` (73x)

## Spacing

| Token       | Value | Rem       |
| ----------- | ----- | --------- |
| spacing-1   | 1px   | 0.0625rem |
| spacing-64  | 64px  | 4rem      |
| spacing-115 | 115px | 7.1875rem |

## Border Radii

| Label | Value | Count |
| ----- | ----- | ----- |
| full  | 100px | 2     |

## CSS Custom Properties

### Other

```css
--following-width: -400px;
--following-animation-duration: 450ms;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Transitions & Animations

**Durations:** `0.3s`

### Common Transitions

```css
transition: all;
transition: opacity 0.3s;
```

### Keyframe Animations

**following-open**

```css
@keyframes following-open {
  0% {
    transform: translateX(0px);
  }
  100% {
    transform: translateX(var(--following-width));
  }
}
```

**following-open-inverse**

```css
@keyframes following-open-inverse {
  0% {
    transform: translateX(0px);
  }
  100% {
    transform: translateX(calc(-1 * var(--following-width)));
  }
}
```

**following-close**

```css
@keyframes following-close {
  0% {
    transform: translateX(var(--following-width));
  }
  100% {
    transform: translateX(0px);
  }
}
```

**following-close-inverse**

```css
@keyframes following-close-inverse {
  0% {
    transform: translateX(calc(-1 * var(--following-width)));
  }
  100% {
    transform: translateX(0px);
  }
}
```

**fade-pulse-in**

```css
@keyframes fade-pulse-in {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
```

**fade-pulse-in**

```css
@keyframes fade-pulse-in {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
```

**pulsate**

```css
@keyframes pulsate {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

**pulsate**

```css
@keyframes pulsate {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

**spin-loading**

```css
@keyframes spin-loading {
  0% {
    transform: rotate(0deg);
  }
  9% {
    transform: rotate(1050deg);
  }
  18% {
    transform: rotate(-1090deg);
  }
  20% {
    transform: rotate(-1080deg);
  }
  23% {
    transform: rotate(-1080deg);
  }
  28% {
    transform: rotate(-1095deg);
  }
  29% {
    transform: rotate(-1065deg);
  }
  34% {
    transform: rotate(-1080deg);
  }
  35% {
    transform: rotate(-1050deg);
  }
  40% {
    transform: rotate(-1065deg);
  }
  41% {
    transform: rotate(-1035deg);
  }
  44% {
    transform: rotate(-1035deg);
  }
  47% {
    transform: rotate(-2160deg);
  }
  50% {
    transform: rotate(-2160deg);
  }
  56% {
    transform: rotate(45deg);
  }
  60% {
    transform: rotate(45deg);
  }
  80% {
    transform: rotate(6120deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
```

**spin-loading**

```css
@keyframes spin-loading {
  0% {
    transform: rotate(0deg);
  }
  9% {
    transform: rotate(1050deg);
  }
  18% {
    transform: rotate(-1090deg);
  }
  20% {
    transform: rotate(-1080deg);
  }
  23% {
    transform: rotate(-1080deg);
  }
  28% {
    transform: rotate(-1095deg);
  }
  29% {
    transform: rotate(-1065deg);
  }
  34% {
    transform: rotate(-1080deg);
  }
  35% {
    transform: rotate(-1050deg);
  }
  40% {
    transform: rotate(-1065deg);
  }
  41% {
    transform: rotate(-1035deg);
  }
  44% {
    transform: rotate(-1035deg);
  }
  47% {
    transform: rotate(-2160deg);
  }
  50% {
    transform: rotate(-2160deg);
  }
  56% {
    transform: rotate(45deg);
  }
  60% {
    transform: rotate(45deg);
  }
  80% {
    transform: rotate(6120deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Cards (332 instances)

```css
.card {
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (7 instances)

```css
.link {
  color: rgb(50, 50, 50);
  font-size: 14.976px;
  font-weight: 500;
}
```

### Navigation (1 instances)

```css
.navigatio {
  color: rgb(50, 50, 50);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Modals (1 instances)

```css
.modal {
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Dropdowns (1 instances)

```css
.dropdown {
  border-radius: 0px;
  border-color: rgb(50, 50, 50);
  padding-top: 0px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Card — 150 instances, 1 variant

**Variant 1** (150 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(50, 50, 50);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(50, 50, 50);
font-size: 128px;
font-weight: 500;
```

### Card — 150 instances, 1 variant

**Variant 1** (150 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(50, 50, 50);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(50, 50, 50);
font-size: 128px;
font-weight: 500;
```

## Layout System

**0 grid containers** and **174 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 100%      | 0px     |

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| row/wrap       | 173x  |
| row/nowrap     | 1x    |

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 10.2px    | No          | 0           | No        | 812px       |
| tablet (768px)   | 15.2722px | No          | 0           | No        | 1061px      |
| desktop (1280px) | 11.52px   | No          | 0           | No        | 817px       |
| wide (1920px)    | 15.552px  | No          | 0           | No        | 1101px      |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- Body font size: `10.2px` → `15.2722px`
- H1 size: `13.26px` → `19.8539px`
- Page height: `812px` → `1061px`

**768px → 1280px** (tablet → desktop):

- Body font size: `15.2722px` → `11.52px`
- H1 size: `19.8539px` → `14.976px`
- Page height: `1061px` → `817px`

**1280px → 1920px** (desktop → wide):

- Body font size: `11.52px` → `15.552px`
- H1 size: `14.976px` → `20.2176px`
- Page height: `817px` → `1101px`

## Interaction States

### Link Hover

```css
color: rgb(0, 0, 0) → rgb(255, 0, 0);
border-color: rgb(0, 0, 0) → rgb(255, 0, 0);
outline: rgb(0, 0, 0) none 3px → rgb(255, 0, 0) none 3px;
```

## Accessibility (WCAG 2.1)

**Overall Score: 33%** — 1 passing, 2 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio  | Level | Used On  |
| ---------- | ---------- | ------ | ----- | -------- |
| `#ff0000`  | `#ffffff`  | 4:1    | FAIL  | div (1x) |
| `#000000`  | `#1a1a1a`  | 1.21:1 | FAIL  | div (1x) |

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
| ---------- | ---------- | ----- | ----- |
| `#000000`  | `#ffffff`  | 21:1  | AAA   |

## Design System Score

**Overall: 63/100 (Grade: D)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 100/100 |
| Typography Consistency    | 50/100  |
| Spacing System            | 40/100  |
| Shadow Consistency        | 80/100  |
| Border Radius Consistency | 100/100 |
| Accessibility             | 33/100  |
| CSS Tokenization          | 50/100  |

**Strengths:** Tight, disciplined color palette, Consistent border radii

**Issues:**

- 4 font families — consider limiting to 2 (heading + body)
- No consistent spacing base unit detected — values appear arbitrary
- 2 WCAG contrast failures
- 31 !important rules — prefer specificity over overrides
- 84% of CSS is unused — consider purging
- 1065 duplicate CSS declarations

## Z-Index Map

**10 unique z-index values** across 4 layers.

| Layer    | Range                 | Elements                                                                                                                                                                    |
| -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modal    | 2147483637,2147483637 | div                                                                                                                                                                         |
| dropdown | 100,999               | div.l.o.a.d.i.n.g, div.g.a.l.l.e.r.y._.c.a.r.d. .h.a.s._.c.a.p.t.i.o.n. .s.l.i.c.k.-.s.l.i.d.e, div.g.a.l.l.e.r.y._.c.a.r.d. .h.a.s._.c.a.p.t.i.o.n. .s.l.i.c.k.-.s.l.i.d.e |
| sticky   | 10,15                 | script, script, div.l.o.a.d.i.n.g._.a.n.i.m.a.t.i.o.n. .p.u.l.s.i.n.g. .<.%.=. .e.x.t.r.a._.c.l.a.s.s. .%.>                                                                 |
| base     | 1,9                   | div.t.h.u.m.b.n.a.i.l.s, div.p.a.g.e. .c.o.n.t.a.i.n.e.r. .c.o.n.t.a.i.n.e.r._.w.i.d.t.h. .c.l.e.a.r.f.i.x, div.p.a.g.e. .c.o.n.t.a.i.n.e.r. .c.o.n.t.a.i.n.e.r._.w.i.d.t.h |

**Issues:**

- [object Object]

## Font Files

| Family   | Source      | Weights                         | Styles         |
| -------- | ----------- | ------------------------------- | -------------- |
| Starling | self-hosted | normal                          | normal         |
| Icons    | self-hosted | 200, 240, 400, 600, 800, normal | normal, italic |

## Image Style Patterns

| Pattern | Count | Key Styles                                        |
| ------- | ----- | ------------------------------------------------- |
| gallery | 158   | objectFit: fill, borderRadius: 0px, shape: square |
| general | 8     | objectFit: fill, borderRadius: 0px, shape: square |

**Aspect ratios:** 3:2 (128x), 4:3 (19x), 2:3 (11x), 3:4 (7x), 1:1 (1x)

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Helvetica Neue` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
