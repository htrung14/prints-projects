# Design Language: Luxury fashion & independent designers | SSENSE

> Extracted from `https://ssense.com` on April 18, 2026
> 758 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Neutral Colors

| Hex       | HSL              | Usage Count |
| --------- | ---------------- | ----------- |
| `#333333` | hsl(0, 0%, 20%)  | 827         |
| `#000000` | hsl(0, 0%, 0%)   | 634         |
| `#f4f4f4` | hsl(0, 0%, 96%)  | 28          |
| `#888888` | hsl(0, 0%, 53%)  | 27          |
| `#979797` | hsl(0, 0%, 59%)  | 25          |
| `#ffffff` | hsl(0, 0%, 100%) | 8           |
| `#777777` | hsl(0, 0%, 47%)  | 5           |
| `#cccccc` | hsl(0, 0%, 80%)  | 1           |

### Background Colors

Used on large-area elements: `#ffffff`, `#f4f4f4`

### Text Colors

Text color palette: `#000000`, `#333333`, `#888888`

### Full Color Inventory

| Hex       | Contexts           | Count |
| --------- | ------------------ | ----- |
| `#333333` | text, border       | 827   |
| `#000000` | text, border       | 634   |
| `#f4f4f4` | background         | 28    |
| `#888888` | border, text       | 27    |
| `#979797` | border, background | 25    |
| `#ffffff` | background         | 8     |
| `#777777` | border             | 5     |
| `#cccccc` | border             | 1     |

## Typography

### Font Families

- **JHA Times Now** — used for all (365 elements)
- **Favorit SSENSE Inter** — used for all (186 elements)
- **sans-serif** — used for body (149 elements)
- **Favorit SSENSE Inter1** — used for all (58 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                   |
| --------- | ---------- | ------ | ----------- | -------------- | ------------------------- |
| 71.25px   | 4.4531rem  | 400    | 76px        | -2.52px        | h1                        |
| 40px      | 2.5rem     | 400    | 44px        | -1px           | h2                        |
| 28.5px    | 1.7813rem  | 400    | 34px        | -0.5px         | h4, span                  |
| 20px      | 1.25rem    | 100    | 26px        | -0.05px        | div, p, a, figure         |
| 19px      | 1.1875rem  | 400    | 26px        | -0.25px        | h4, span                  |
| 16px      | 1rem       | 400    | 18.4px      | normal         | html, head, meta, title   |
| 13px      | 0.8125rem  | 100    | 16px        | normal         | label, span, time, div    |
| 12.35px   | 0.7719rem  | 100    | 0px         | -0.05px        | label, span, div, h4      |
| 11px      | 0.6875rem  | 400    | 15px        | normal         | body, script, div, header |
| 0px       | 0rem       | 100    | 26px        | -0.05px        | div, a, figure, img       |

### Heading Scale

```css
h1 {
  font-size: 71.25px;
  font-weight: 400;
  line-height: 76px;
}
h2 {
  font-size: 40px;
  font-weight: 400;
  line-height: 44px;
}
h4 {
  font-size: 28.5px;
  font-weight: 400;
  line-height: 34px;
}
h4 {
  font-size: 19px;
  font-weight: 400;
  line-height: 26px;
}
h4 {
  font-size: 12.35px;
  font-weight: 100;
  line-height: 0px;
}
```

### Body Text

```css
body {
  font-size: 11px;
  font-weight: 400;
  line-height: 15px;
}
```

### Font Weights in Use

`100` (385x), `400` (360x), `500` (12x), `700` (1x)

## Spacing

**Base unit:** 2px

| Token       | Value | Rem        |
| ----------- | ----- | ---------- |
| spacing-2   | 2px   | 0.125rem   |
| spacing-30  | 30px  | 1.875rem   |
| spacing-40  | 40px  | 2.5rem     |
| spacing-50  | 50px  | 3.125rem   |
| spacing-55  | 55px  | 3.4375rem  |
| spacing-60  | 60px  | 3.75rem    |
| spacing-68  | 68px  | 4.25rem    |
| spacing-98  | 98px  | 6.125rem   |
| spacing-109 | 109px | 6.8125rem  |
| spacing-133 | 133px | 8.3125rem  |
| spacing-234 | 234px | 14.625rem  |
| spacing-290 | 290px | 18.125rem  |
| spacing-397 | 397px | 24.8125rem |
| spacing-498 | 498px | 31.125rem  |

## Border Radii

| Label | Value | Count |
| ----- | ----- | ----- |
| sm    | 3px   | 3     |
| md    | 10px  | 6     |

## Box Shadows

**sm (inset)** — blur: 0px

```css
box-shadow: rgb(0, 0, 0) 0px 0px 0px 1px inset;
```

## CSS Custom Properties

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name   | Value  | Type      |
| ------ | ------ | --------- |
| xs     | 360px  | max-width |
| xs     | 375px  | min-width |
| sm     | 479px  | max-width |
| sm     | 480px  | max-width |
| 568px  | 568px  | max-width |
| sm     | 599px  | max-width |
| md     | 736px  | max-width |
| md     | 767px  | max-width |
| md     | 768px  | max-width |
| md     | 769px  | min-width |
| 950px  | 950px  | max-width |
| lg     | 979px  | max-width |
| lg     | 991px  | max-width |
| lg     | 992px  | min-width |
| lg     | 1023px | max-width |
| lg     | 1024px | min-width |
| lg     | 1025px | min-width |
| 1100px | 1100px | max-width |
| 1105px | 1105px | max-width |
| 1200px | 1200px | min-width |
| xl     | 1280px | max-width |
| 1430px | 1430px | min-width |
| 1440px | 1440px | min-width |
| 2xl    | 1500px | max-width |
| 1920px | 1920px | min-width |
| 2309px | 2309px | max-width |
| 2310px | 2310px | min-width |
| 2560px | 2560px | min-width |

## Transitions & Animations

**Durations:** `0.35s`, `0.5s`

### Common Transitions

```css
transition: all;
transition: transform 0.35s;
transition: transform 0.5s;
```

### Keyframe Animations

**s-loader-blink**

```css
@keyframes s-loader-blink {
  0%,
  100% {
    background: rgb(153, 153, 153);
  }
  50% {
    background: rgba(255, 255, 255, 0.1);
  }
}
```

**s-loader-dash**

```css
@keyframes s-loader-dash {
  0% {
    transform: scaleX(0.41667);
  }
  100% {
    transform: scaleX(1);
  }
}
```

**blink**

```css
@keyframes blink {
  0%,
  100% {
    background: rgb(153, 153, 153);
  }
  50% {
    background: rgba(255, 255, 255, 0.5);
  }
}
```

**blink**

```css
@keyframes blink {
  0%,
  100% {
    background: rgb(153, 153, 153);
  }
  50% {
    background: rgba(255, 255, 255, 0.5);
  }
}
```

**sk-scaleout**

```css
@keyframes sk-scaleout {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
```

**sk-scaleout**

```css
@keyframes sk-scaleout {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
```

**sk-scaleout**

```css
@keyframes sk-scaleout {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
```

**sk-scaleout**

```css
@keyframes sk-scaleout {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (7 instances)

```css
.button {
  color: rgb(51, 51, 51);
  font-size: 0px;
  font-weight: 100;
  padding-top: 0px;
  padding-right: 18px;
  border-radius: 10px;
}
```

### Inputs (5 instances)

```css
.input {
  color: rgb(0, 0, 0);
  border-color: rgb(119, 119, 119);
  border-radius: 0px;
  font-size: 11px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (81 instances)

```css
.link {
  color: rgb(0, 0, 0);
  font-size: 11px;
  font-weight: 400;
}
```

### Navigation (23 instances)

```css
.navigatio {
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (14 instances)

```css
.foote {
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 11px;
}
```

### Dropdowns (12 instances)

```css
.dropdown {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
  padding-top: 0px;
}
```

### Badges (25 instances)

```css
.badge {
  color: rgb(51, 51, 51);
  font-size: 13px;
  font-weight: 100;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

## Layout System

**1 grid containers** and **77 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 50%       | 25px    |
| 100%      | 0px     |
| 33.3333%  | 25px    |

### Grid Column Patterns

| Columns  | Usage Count |
| -------- | ----------- |
| 1-column | 1x          |

### Grid Templates

```css
grid-template-columns: 1280px;
```

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| row/nowrap     | 45x   |
| column/nowrap  | 25x   |
| row/wrap       | 7x    |

**Gap values:** `10px normal`, `20px`

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 11px      | Yes         | 1           | No        | 8432px      |
| tablet (768px)   | 11px      | Yes         | 1           | No        | 3812px      |
| desktop (1280px) | 11px      | Yes         | 1           | No        | 4136px      |
| wide (1920px)    | 11px      | Yes         | 1           | No        | 5660px      |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- H1 size: `38px` → `66.5px`
- Page height: `8432px` → `3812px`

**768px → 1280px** (tablet → desktop):

- H1 size: `66.5px` → `71.25px`
- Page height: `3812px` → `4136px`

**1280px → 1920px** (desktop → wide):

- H1 size: `71.25px` → `95px`
- Page height: `4136px` → `5660px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 39 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio   | Level |
| ---------- | ---------- | ------- | ----- |
| `#333333`  | `#f4f4f4`  | 11.49:1 | AAA   |
| `#000000`  | `#ffffff`  | 21:1    | AAA   |
| `#000000`  | `#999999`  | 7.37:1  | AAA   |

## Design System Score

**Overall: 81/100 (Grade: B)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 85/100  |
| Typography Consistency    | 50/100  |
| Spacing System            | 80/100  |
| Shadow Consistency        | 100/100 |
| Border Radius Consistency | 100/100 |
| Accessibility             | 100/100 |
| CSS Tokenization          | 50/100  |

**Strengths:** Tight, disciplined color palette, Clean elevation system, Consistent border radii, Strong accessibility compliance

**Issues:**

- No clear primary brand color detected
- 4 font families — consider limiting to 2 (heading + body)
- 138 !important rules — prefer specificity over overrides
- 95% of CSS is unused — consider purging
- 5728 duplicate CSS declarations

## Z-Index Map

**4 unique z-index values** across 3 layers.

| Layer    | Range     | Elements                                                                                                                                                                                                                                                                                                                                                      |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modal    | 1000,1000 | header.h.e.a.d.e.r. .o.p.a.q.u.e.-.h.e.a.d.e.r                                                                                                                                                                                                                                                                                                                |
| dropdown | 100,102   | img.e.d.-.L.o.a.d.I.m.a.g.e.-.i.m.a.g.e. .l.a.z.y.a.u.t.o.s.i.z.e.s. .l.s.-.i.s.-.c.a.c.h.e.d. .l.a.z.y.l.o.a.d.e.d, img.e.d.-.L.o.a.d.I.m.a.g.e.-.i.m.a.g.e. .l.a.z.y.a.u.t.o.s.i.z.e.s. .l.s.-.i.s.-.c.a.c.h.e.d. .l.a.z.y.l.o.a.d.e.d, img.e.d.-.L.o.a.d.I.m.a.g.e.-.i.m.a.g.e. .l.a.z.y.a.u.t.o.s.i.z.e.s. .l.s.-.i.s.-.c.a.c.h.e.d. .l.a.z.y.l.o.a.d.e.d |
| sticky   | 10,10     | div.p.o.p.o.v.e.r. .p.o.p.o.v.e.r.-.a.l.t.e.r.n.a.t.e, div.p.o.p.o.v.e.r. .p.o.p.o.v.e.r.-.a.l.t.e.r.n.a.t.e, div.p.o.p.o.v.e.r. .p.o.p.o.v.e.r.-.a.l.t.e.r.n.a.t.e. .p.o.p.o.v.e.r.-.p.a.d.d.i.n.g. .n.o.-.b.o.r.d.e.r                                                                                                                                       |

## SVG Icons

**1 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
| ---------- | ----- |
| xl         | 1     |

**Icon colors:** `rgb(0, 0, 0)`

## Font Files

| Family                 | Source      | Weights | Styles |
| ---------------------- | ----------- | ------- | ------ |
| ssense-fonts           | self-hosted | normal  | normal |
| Favorit SSENSE Inter   | self-hosted | normal  | normal |
| Favorit SSENSE Regular | self-hosted | normal  | normal |
| Favorit SSENSE Inter1  | self-hosted | normal  | normal |
| JHA Times Now          | self-hosted | normal  | normal |

## Image Style Patterns

| Pattern | Count | Key Styles                                        |
| ------- | ----- | ------------------------------------------------- |
| general | 7     | objectFit: fill, borderRadius: 0px, shape: square |

**Aspect ratios:** 4:3 (4x), 3:4 (3x)

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `JHA Times Now` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
