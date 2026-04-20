# Design Language: Cult Pictures

> Extracted from `https://cultpictures.com` on April 18, 2026
> 138 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role    | Hex       | RGB                | HSL               | Usage Count |
| ------- | --------- | ------------------ | ----------------- | ----------- |
| Primary | `#faf8ed` | rgb(250, 248, 237) | hsl(51, 57%, 95%) | 1           |
| Accent  | `#faf8ed` | rgb(250, 248, 237) | hsl(51, 57%, 95%) | 1           |

### Neutral Colors

| Hex       | HSL            | Usage Count |
| --------- | -------------- | ----------- |
| `#000000` | hsl(0, 0%, 0%) | 274         |
| `#161616` | hsl(0, 0%, 9%) | 3           |

### Background Colors

Used on large-area elements: `#161616`, `#faf8ed`

### Text Colors

Text color palette: `#000000`

### Full Color Inventory

| Hex       | Contexts           | Count |
| --------- | ------------------ | ----- |
| `#000000` | text, border       | 274   |
| `#161616` | background, border | 3     |
| `#faf8ed` | background         | 1     |

## Typography

### Font Families

- **Diatype Variable** — used for body (92 elements)
- **-apple-system** — used for body (25 elements)
- **Times** — used for body (21 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                      |
| --------- | ---------- | ------ | ----------- | -------------- | ---------------------------- |
| 14.5px    | 0.9063rem  | 400    | 23.925px    | normal         | body, customhtml, style, div |
| 13.824px  | 0.864rem   | 500    | 21.4272px   | normal         | bodycopy, span, a, script    |
| 11.52px   | 0.72rem    | 400    | normal      | normal         | html, head, meta, title      |

### Body Text

```css
body {
  font-size: 13.824px;
  font-weight: 500;
  line-height: 21.4272px;
}
```

### Font Weights in Use

`500` (70x), `400` (46x), `300` (22x)

## Spacing

| Token       | Value | Rem       |
| ----------- | ----- | --------- |
| spacing-26  | 26px  | 1.625rem  |
| spacing-330 | 330px | 20.625rem |

## CSS Custom Properties

### Spacing

```css
--base-size: 11.52px;
--mobile-padding-offset: 0.8;
```

### Other

```css
--replace-ui-fadein: 0;
--mobile-scale: 1.5;
--min-viewport-height: 800px;
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

### Common Transitions

```css
transition: all;
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

### Links (14 instances)

```css
.link {
  color: rgba(0, 0, 0, 0.85);
  font-size: 13.824px;
  font-weight: 500;
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

## Layout System

**0 grid containers** and **12 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 100%      | 0px     |
| 40%       | 0px     |
| 413.031px | 0px     |

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| column/nowrap  | 4x    |
| row/nowrap     | 8x    |

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 16px      | No          | 0           | No        | 812px       |
| tablet (768px)   | 16px      | No          | 0           | No        | 1220px      |
| desktop (1280px) | 14.5px    | No          | 0           | No        | 800px       |
| wide (1920px)    | 14.5px    | No          | 0           | No        | 1116px      |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- Page height: `812px` → `1220px`

**768px → 1280px** (tablet → desktop):

- Body font size: `16px` → `14.5px`
- Page height: `1220px` → `800px`

**1280px → 1920px** (desktop → wide):

- Page height: `800px` → `1116px`

## Accessibility (WCAG 2.1)

**Overall Score: 50%** — 1 passing, 1 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio  | Level | Used On   |
| ---------- | ---------- | ------ | ----- | --------- |
| `#000000`  | `#161616`  | 1.16:1 | FAIL  | body (1x) |

### Passing Color Pairs

| Foreground | Background | Ratio   | Level |
| ---------- | ---------- | ------- | ----- |
| `#000000`  | `#faf8ed`  | 19.71:1 | AAA   |

## Design System Score

**Overall: 73/100 (Grade: C)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 100/100 |
| Typography Consistency    | 80/100  |
| Spacing System            | 40/100  |
| Shadow Consistency        | 80/100  |
| Border Radius Consistency | 100/100 |
| Accessibility             | 50/100  |
| CSS Tokenization          | 75/100  |

**Strengths:** Tight, disciplined color palette, Consistent border radii, Good CSS variable tokenization

**Issues:**

- No consistent spacing base unit detected — values appear arbitrary
- 1 WCAG contrast failures
- 38 !important rules — prefer specificity over overrides
- 88% of CSS is unused — consider purging
- 1360 duplicate CSS declarations

## Z-Index Map

**4 unique z-index values** across 2 layers.

| Layer    | Range   | Elements                                                                                                                |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| dropdown | 999,999 | div.o.v.e.r.l.a.y.-.c.o.n.t.e.n.t. .i.s.-.c.o.n.t.e.n.t.-.p.a.s.s.t.h.r.o.u.g.h.-.o.v.e.r.l.a.y. .t.o.p.-.o.v.e.r.l.a.y |
| base     | -99,2   | div, div, div                                                                                                           |

## Font Files

| Family                     | Source      | Weights  | Styles         |
| -------------------------- | ----------- | -------- | -------------- |
| Diatype Variable           | self-hosted | 200 1000 | normal, italic |
| Diatype Semi-Mono Variable | self-hosted | 200 700  | normal, italic |
| Diatype Mono Variable      | self-hosted | 200 700  | normal, italic |

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Diatype Variable` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
