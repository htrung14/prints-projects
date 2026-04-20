# Design Language: Loose Joints Publishing

> Extracted from `https://loosejoints.biz/` on April 18, 2026
> 626 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role      | Hex       | RGB               | HSL                | Usage Count |
| --------- | --------- | ----------------- | ------------------ | ----------- |
| Primary   | `#253525` | rgb(37, 53, 37)   | hsl(120, 18%, 18%) | 2           |
| Secondary | `#fbe122` | rgb(251, 225, 34) | hsl(53, 96%, 56%)  | 1           |
| Accent    | `#253525` | rgb(37, 53, 37)   | hsl(120, 18%, 18%) | 2           |

### Neutral Colors

| Hex       | HSL              | Usage Count |
| --------- | ---------------- | ----------- |
| `#000000` | hsl(0, 0%, 0%)   | 1232        |
| `#ffffff` | hsl(0, 0%, 100%) | 24          |
| `#767676` | hsl(0, 0%, 46%)  | 1           |
| `#efefef` | hsl(0, 0%, 94%)  | 1           |

### Text Colors

Text color palette: `#000000`, `#ffffff`

### Full Color Inventory

| Hex       | Contexts                 | Count |
| --------- | ------------------------ | ----- |
| `#000000` | text, border, background | 1232  |
| `#ffffff` | background, text, border | 24    |
| `#253525` | background               | 2     |
| `#fbe122` | background               | 1     |
| `#767676` | border                   | 1     |
| `#efefef` | background               | 1     |

## Typography

### Font Families

- **DiatypePre-Regular** — used for body (237 elements)
- **DiatypePre-Bold** — used for body (200 elements)
- **Times** — used for body (146 elements)
- **DiatypePre-Light** — used for body (31 elements)
- **Arial** — used for body (10 elements)
- **GTStandard-M** — used for body (2 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                    |
| --------- | ---------- | ------ | ----------- | -------------- | -------------------------- |
| 16px      | 1rem       | 400    | normal      | normal         | html, head, meta, link     |
| 13.3333px | 0.8333rem  | 400    | normal      | normal         | input, button, svg, path   |
| 12px      | 0.75rem    | 400    | 16px        | normal         | body, div, section, header |

### Body Text

```css
body {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}
```

### Font Weights in Use

`400` (626x)

## Spacing

**Base unit:** 2px

| Token       | Value | Rem       |
| ----------- | ----- | --------- |
| spacing-1   | 1px   | 0.0625rem |
| spacing-30  | 30px  | 1.875rem  |
| spacing-37  | 37px  | 2.3125rem |
| spacing-48  | 48px  | 3rem      |
| spacing-234 | 234px | 14.625rem |
| spacing-384 | 384px | 24rem     |
| spacing-466 | 466px | 29.125rem |

## CSS Custom Properties

### Colors

```css
--swiper-theme-color: #007aff;
--color-accent: ;
--color-body-text: ;
--color-main-background: ;
--color-border: ;
```

### Typography

```css
--font-heading: ;
--font-body: ;
--font-body-weight: ;
--font-body-style: ;
--font-body-bold-weight: bold;
```

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
| 1px    | 1px    | min-width |
| sm     | 576px  | min-width |
| md     | 734px  | max-width |
| md     | 750px  | max-width |
| md     | 768px  | min-width |
| lg     | 992px  | min-width |
| 1150px | 1150px | max-width |
| 1200px | 1200px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`, `[object Object]`

**Durations:** `0.2s`, `0.15s`, `0.075s`

### Common Transitions

```css
transition: all;
transition:
  color 0.2s ease-in-out,
  background-color 0.2s ease-in-out;
transition: 0.2s ease-in-out;
transition:
  opacity 0.15s linear,
  filter 0.15s linear;
transition: transform 0.075s cubic-bezier(0.55, 0.055, 0.675, 0.19);
```

### Keyframe Animations

**swiper-preloader-spin**

```css
@keyframes swiper-preloader-spin {
  100% {
    transform: rotate(1turn);
  }
}
```

**shopify-rotator**

```css
@keyframes shopify-rotator {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(270deg);
  }
}
```

**shopify-dash**

```css
@keyframes shopify-dash {
  0% {
    stroke-dashoffset: 280;
  }
  50% {
    stroke-dashoffset: 75;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 280;
    transform: rotate(450deg);
  }
}
```

**acceleratedCheckoutLoadingSkeleton**

```css
@keyframes acceleratedCheckoutLoadingSkeleton {
  50% {
    opacity: var(--shopify-accelerated-checkout-skeleton-animation-opacity-start, 1);
  }
  75% {
    opacity: var(--shopify-accelerated-checkout-skeleton-animation-opacity-end, 0.5);
  }
  100% {
    opacity: var(--shopify-accelerated-checkout-skeleton-animation-opacity-start, 1);
  }
}
```

**ht_image_fit_slider**

```css
@keyframes ht_image_fit_slider {
  0% {
    background-position: center top;
  }
  100% {
    background-position: center bottom;
  }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (3 instances)

```css
.button {
  background-color: rgb(239, 239, 239);
  color: rgb(0, 0, 0);
  font-size: 13.3333px;
  font-weight: 400;
  padding-top: 1px;
  padding-right: 6px;
  border-radius: 0px;
}
```

### Inputs (2 instances)

```css
.input {
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  border-color: rgb(0, 0, 0);
  border-radius: 0px;
  font-size: 13.3333px;
  padding-top: 48px;
  padding-right: 20px;
}
```

### Links (78 instances)

```css
.link {
  color: rgb(0, 0, 0);
  font-size: 12px;
  font-weight: 400;
}
```

### Navigation (17 instances)

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

### Footer (10 instances)

```css
.foote {
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 12px;
}
```

### Dropdowns (13 instances)

```css
.dropdown {
  background-color: rgb(37, 53, 37);
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
  padding-top: 0px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Input — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 48px 20px 10px 20px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 13.3333px;
font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 1px 6px 1px 6px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 13.3333px;
font-weight: 400;
```

## Layout System

**0 grid containers** and **10 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 50%       | 0px     |
| 100%      | 0px     |

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| row/wrap       | 10x   |

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 12px      | No          | 0           | Yes       | 9987px      |
| tablet (768px)   | 12px      | No          | 0           | Yes       | 6658px      |
| desktop (1280px) | 12px      | No          | 0           | Yes       | 10909px     |
| wide (1920px)    | 12px      | No          | 0           | Yes       | 16253px     |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- Page height: `9987px` → `6658px`

**768px → 1280px** (tablet → desktop):

- Page height: `6658px` → `10909px`

**1280px → 1920px** (desktop → wide):

- Page height: `10909px` → `16253px`

## Interaction States

### Link Hover

```css
text-decoration: none → underline;
```

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 8 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio   | Level |
| ---------- | ---------- | ------- | ----- |
| `#000000`  | `#ffffff`  | 21:1    | AAA   |
| `#ffffff`  | `#253525`  | 13.01:1 | AAA   |
| `#ffffff`  | `#000000`  | 21:1    | AAA   |
| `#000000`  | `#fbe122`  | 15.9:1  | AAA   |
| `#000000`  | `#efefef`  | 18.26:1 | AAA   |

## Design System Score

**Overall: 83/100 (Grade: B)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 100/100 |
| Typography Consistency    | 50/100  |
| Spacing System            | 80/100  |
| Shadow Consistency        | 80/100  |
| Border Radius Consistency | 100/100 |
| Accessibility             | 100/100 |
| CSS Tokenization          | 75/100  |

**Strengths:** Tight, disciplined color palette, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**

- 6 font families — consider limiting to 2 (heading + body)
- 392 !important rules — prefer specificity over overrides
- 90% of CSS is unused — consider purging
- 1794 duplicate CSS declarations

## Z-Index Map

**3 unique z-index values** across 2 layers.

| Layer  | Range  | Elements                                                                                                                               |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| sticky | 10,10  | header.d.e.s.k.t.o.p.-.h.e.a.d.e.r, section.d.e.s.k.t.o.p.-.h.e.a.d.e.r._._.l.e.f.t, section.d.e.s.k.t.o.p.-.h.e.a.d.e.r._._.r.i.g.h.t |
| base   | -100,9 | div, section.d.e.s.k.t.o.p.-.h.e.a.d.e.r._._.s.e.a.r.c.h.-.b.a.r                                                                       |

## SVG Icons

**1 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
| ---------- | ----- |
| md         | 1     |

**Icon colors:** `rgb(0, 0, 0)`

## Font Files

| Family             | Source      | Weights | Styles |
| ------------------ | ----------- | ------- | ------ |
| DiatypePre-Bold    | self-hosted | 400     | normal |
| DiatypePre-Regular | self-hosted | 400     | normal |
| DiatypePre-Light   | self-hosted | 400     | normal |
| swiper-icons       | self-hosted | 400     | normal |

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `DiatypePre-Regular` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
