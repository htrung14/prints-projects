# Design Language: MACK

> Extracted from `https://mackbooks.co.uk` on April 18, 2026
> 5000 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Neutral Colors

| Hex       | HSL              | Usage Count |
| --------- | ---------------- | ----------- |
| `#000000` | hsl(0, 0%, 0%)   | 10489       |
| `#ffffff` | hsl(0, 0%, 100%) | 314         |
| `#aaaaaa` | hsl(0, 0%, 67%)  | 2           |

### Background Colors

Used on large-area elements: `#ffffff`, `#000000`, `#fefefe`

### Text Colors

Text color palette: `#000000`, `#ffffff`, `#aaaaaa`

### Gradients

```css
background-image: linear-gradient(to right, rgb(0, 0, 0), rgb(0, 0, 0));
```

### Full Color Inventory

| Hex       | Contexts                 | Count |
| --------- | ------------------------ | ----- |
| `#000000` | text, border, background | 10489 |
| `#ffffff` | background, text, border | 314   |
| `#aaaaaa` | text, border             | 2     |

## Typography

### Font Families

- **Figtree** — used for all (4909 elements)
- **Times** — used for body (91 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                              |
| --------- | ---------- | ------ | ----------- | -------------- | ------------------------------------ |
| 25px      | 1.5625rem  | 400    | 25px        | normal         | a, h2                                |
| 20px      | 1.25rem    | 400    | 30px        | normal         | main-header                          |
| 16.875px  | 1.0547rem  | 600    | 25.3125px   | normal         | a, span, svg, g                      |
| 16px      | 1rem       | 400    | normal      | normal         | html, head, meta, link               |
| 15px      | 0.9375rem  | 400    | 22.5px      | normal         | body, script, a, div                 |
| 14.0625px | 0.8789rem  | 400    | 17.5781px   | normal         | div                                  |
| 13.125px  | 0.8203rem  | 400    | 19.6875px   | normal         | localization-form, span, button, img |
| 13px      | 0.8125rem  | 500    | 19.5px      | normal         | div, p, btn, img                     |
| 12px      | 0.75rem    | 500    | 14.4px      | normal         | span, svg, path, localization-form   |
| 10.3125px | 0.6445rem  | 400    | 15.4688px   | normal         | span                                 |
| 10px      | 0.625rem   | 400    | 15px        | normal         | span                                 |
| 0px       | 0rem       | 500    | 0px         | normal         | span, svg, circle, path              |

### Heading Scale

```css
h2 {
  font-size: 25px;
  font-weight: 400;
  line-height: 25px;
}
```

### Body Text

```css
body {
  font-size: 15px;
  font-weight: 400;
  line-height: 22.5px;
}
```

### Font Weights in Use

`400` (3671x), `500` (878x), `600` (450x), `700` (1x)

## Spacing

**Base unit:** 2px

| Token       | Value | Rem        |
| ----------- | ----- | ---------- |
| spacing-1   | 1px   | 0.0625rem  |
| spacing-40  | 40px  | 2.5rem     |
| spacing-46  | 46px  | 2.875rem   |
| spacing-52  | 52px  | 3.25rem    |
| spacing-60  | 60px  | 3.75rem    |
| spacing-70  | 70px  | 4.375rem   |
| spacing-75  | 75px  | 4.6875rem  |
| spacing-90  | 90px  | 5.625rem   |
| spacing-100 | 100px | 6.25rem    |
| spacing-120 | 120px | 7.5rem     |
| spacing-125 | 125px | 7.8125rem  |
| spacing-192 | 192px | 12rem      |
| spacing-211 | 211px | 13.1875rem |
| spacing-285 | 285px | 17.8125rem |
| spacing-352 | 352px | 22rem      |

## Border Radii

| Label | Value | Count |
| ----- | ----- | ----- |
| sm    | 3px   | 3     |
| md    | 6px   | 581   |
| md    | 10px  | 54    |
| xl    | 20px  | 36    |
| full  | 30px  | 3     |
| full  | 50px  | 169   |
| full  | 100px | 38    |

## CSS Custom Properties

### Colors

```css
--font-stack-headings-primary: Figtree, sans-serif;
--font-weight-headings-primary: 500;
--font-style-headings-primary: normal;
--font-stack-body-primary: Figtree, sans-serif;
--font-weight-body-primary: 400;
--font-weight-body-primary-bold: 600;
--font-weight-body-primary-medium: 500;
--font-style-body-primary: normal;
--font-stack-body-secondary: Figtree, sans-serif;
--font-weight-body-secondary: 400;
--font-weight-body-secondary-bold: 600;
--font-style-body-secondary: normal;
--base-headings-primary-size: 24;
--base-headings-secondary-size: ;
--base-body-primary-size: 15;
--base-body-secondary-size: 15;
--color-background-header: #ffffff;
--color-text-header: #000000;
--color-foreground-header: #fff;
--color-borders-header: rgba(0, 0, 0, 0.15);
--color-background-main: #ffffff;
--color-secondary-background-main: rgba(0, 0, 0, 0.08);
--color-third-background-main: rgba(0, 0, 0, 0.04);
--color-fourth-background-main: rgba(0, 0, 0, 0.02);
--color-opacity-background-main: rgba(255, 255, 255, 0);
--color-text-main: #000000;
--color-foreground-main: #fff;
--color-secondary-text-main: rgba(0, 0, 0, 0.6);
--color-borders-main: rgba(0, 0, 0, 0.1);
--color-background-main-alternate: #eef1f2;
--color-background-product-card: rgba(0, 0, 0, 0);
--color-background-cart-card: rgba(0, 0, 0, 0);
--color-background-footer: #000000;
--color-text-footer: #eef1f2;
--color-borders-footer: rgba(238, 241, 242, 0.15);
--color-borders-forms-primary: rgba(0, 0, 0, 0.3);
--color-borders-forms-secondary: rgba(0, 0, 0, 0.6);
--border-width-cards: px;
--border-radius-cards: 0px;
--border-width-buttons: 1px;
--border-radius-buttons: 30px;
--border-width-forms: 1px;
--border-radius-forms: 5px;
--border-radius-widgets: 20px;
--border-radius-product-card: 20px;
--color-background-cards: var(--color-background-main);
--color-text-cards: var(--color-text-main);
--color-foreground-cards: var(--color-foreground-main);
--color-secondary-text-cards: var(--color-secondary-text-main);
--color-accent-cards: var(--color-text-main);
--color-foreground-accent-cards: var(--color-foreground-main);
--color-borders-cards: var(--color-borders-main);
```

### Spacing

```css
--base-headings-spacing: 0.01em;
--grid-gap-original-base: 32px;
--container-vertical-space-base: 150px;
--image-fit-padding: 0%;
--button-padding: 0.875rem 0.9375rem;
--input-padding: 0.75rem;
--header-vertical-space: 30px;
--container-vertical-space: var(--container-vertical-space-base);
--grid-gap: var(--grid-gap-original-base);
```

### Typography

```css
--font-weight-menu: var(--font-weight-body-primary-medium);
--font-weight-buttons: var(--font-weight-body-primary-medium);
```

### Other

```css
--base-headings-line: 1.2;
--base-body-line: 1.5;
--theme-max-width: 1920px;
--window-height: 800px;
--window-width: 1280px;
--gutter-small: 15px;
--gutter-regular: 25px;
--gutter-large: 50px;
--gutter-xlarge: 80px;
--gutter-container: 40px;
--gutter-breadcrumbs: -35px;
--sidebar-width: 420px;
--sidebar-gutter: 30px;
--full-height: 100vh;
--button-product: 3.75rem;
```

### Dependencies

```css
--font-weight-menu: --font-weight-body-primary-medium;
--font-weight-buttons: --font-weight-body-primary-medium;
--container-vertical-space: --container-vertical-space-base;
--grid-gap: --grid-gap-original-base;
--color-background-cards: --color-background-main;
--color-text-cards: --color-text-main;
--color-foreground-cards: --color-foreground-main;
--color-secondary-text-cards: --color-secondary-text-main;
--color-accent-cards: --color-text-main;
--color-foreground-accent-cards: --color-foreground-main;
--color-borders-cards: --color-borders-main;
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
| xs     | 320px  | min-width |
| xs     | 374px  | max-width |
| sm     | 474px  | max-width |
| sm     | 475px  | min-width |
| sm     | 640px  | min-width |
| md     | 750px  | max-width |
| md     | 767px  | min-width |
| md     | 768px  | min-width |
| lg     | 1023px | max-width |
| lg     | 1024px | min-width |
| xl     | 1280px | max-width |
| xl     | 1281px | min-width |
| 1366px | 1366px | min-width |
| 1920px | 1920px | max-width |
| 1921px | 1921px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`

**Durations:** `0.1s`, `0.55s`, `0.175s`, `0.25s`, `0.04s`, `0.08s`, `0.35s`, `0.3s`

### Common Transitions

```css
transition: all;
transition: 0.1s linear;
transition: 0.55s;
transition: 0.175s linear;
transition: 0.25s;
transition:
  opacity 0.1s linear 0.04s,
  visibility 0.1s linear 0.04s;
transition: 0.08s linear;
transition:
  opacity 0.35s,
  transform 0.175s linear;
transition: transform 0.3s ease-in-out;
transition: opacity 0.35s ease-out;
```

### Keyframe Animations

**reveal-image**

```css
@keyframes reveal-image {
  0% {
    clip-path: polygon(0px 0px, 100% 0px, 100% 0px, 0px 0px);
    transform: translateY(-0.625rem);
  }
  100% {
    clip-path: polygon(0px 0px, 100% 0px, 100% 100%, 0px 100%);
    transform: translateY(0px);
  }
}
```

**reveal-opacity**

```css
@keyframes reveal-opacity {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

**circle-bounce**

```css
@keyframes circle-bounce {
  0% {
    border-width: 2px;
    opacity: 0.5;
  }
  100% {
    border-width: 4px;
    opacity: 0.25;
  }
}
```

**rotate**

```css
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
```

**dash**

```css
@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124;
  }
}
```

**move**

```css
@keyframes move {
  0% {
    transform: translateY(0px);
  }
  49% {
    transform: translateY(-200%);
  }
  50% {
    transform: translateY(-200%);
    visibility: hidden;
  }
  51% {
    transform: translateY(200%);
  }
  52% {
    transform: translateY(200%);
    visibility: visible;
  }
  100% {
    transform: translateY(0px);
  }
}
```

**lazy-loading**

```css
@keyframes lazy-loading {
  0% {
    height: 0px;
    top: 0px;
  }
  33% {
    height: 100%;
    top: 0px;
  }
  66% {
    top: 100%;
    height: 0px;
  }
  100% {
    top: 0px;
    height: 0px;
  }
}
```

**lazyanimation**

```css
@keyframes lazyanimation {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(1.05);
  }
  50% {
    opacity: 1;
    transform: translateY(5px) scale(1.025);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) scale(1);
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

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (176 instances)

```css
.button {
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  font-size: 12px;
  font-weight: 500;
  padding-top: 7px;
  padding-right: 12px;
  border-radius: 0px;
}
```

### Cards (19 instances)

```css
.card {
  background-color: rgb(0, 0, 0);
  border-radius: 0px;
  padding-top: 20px;
  padding-right: 0px;
}
```

### Inputs (10 instances)

```css
.input {
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  border-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  font-size: 15px;
  padding-top: 12px;
  padding-right: 12px;
}
```

### Links (236 instances)

```css
.link {
  color: rgb(0, 0, 0);
  font-size: 15px;
  font-weight: 400;
}
```

### Navigation (146 instances)

```css
.navigatio {
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 3px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (1 instances)

```css
.foote {
  color: rgb(0, 0, 0);
  padding-top: 15px;
  padding-bottom: 15px;
  font-size: 15px;
}
```

### Modals (24 instances)

```css
.modal {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Dropdowns (302 instances)

```css
.dropdown {
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
  padding-top: 0px;
}
```

### Badges (1 instances)

```css
.badge {
  background-color: rgb(0, 0, 0);
  color: rgb(255, 255, 255);
  font-size: 10px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 50%;
}
```

### Tooltips (3 instances)

```css
.tooltip {
  color: rgb(0, 0, 0);
  font-size: 16px;
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 12px;
font-weight: 500;
```

### Button — 11 instances, 2 variants

**Variant 1** (9 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 500;
```

**Variant 2** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 14px 46px 14px 46px;
border-radius: 30px;
border: 1px solid rgb(255, 255, 255);
font-size: 15px;
font-weight: 500;
```

### Button — 139 instances, 3 variants

**Variant 1** (127 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 0px;
font-weight: 500;
```

**Variant 2** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 500;
```

**Variant 3** (10 instances)

```css
background: rgb(255, 255, 255);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 100%;
border: 0px none rgb(0, 0, 0);
font-size: 15px;
font-weight: 400;
```

### Button — 11 instances, 2 variants

**Variant 1** (5 instances)

```css
background: rgb(0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 4px 0px 4px;
border-radius: 3px;
border: 0px none rgb(255, 255, 255);
font-size: 10.3125px;
font-weight: 400;
```

**Variant 2** (6 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 15px;
font-weight: 500;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 500;
```

### Card — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
background: rgb(0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 400;
```

### Card — 59 instances, 1 variant

**Variant 1** (59 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 20px 0px 20px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 15px;
font-weight: 400;
```

### Card — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 20px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 400;
```

### Card — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 35px 35px 35px 35px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 400;
```

### Card — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 15px;
font-weight: 400;
```

## Layout System

**35 grid containers** and **815 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 1920px    | 40px    |
| 100%      | 0px     |

### Grid Column Patterns

| Columns   | Usage Count |
| --------- | ----------- |
| 3-column  | 7x          |
| 2-column  | 6x          |
| 36-column | 2x          |
| 4-column  | 1x          |
| 1-column  | 1x          |
| 12-column | 1x          |
| 19-column | 1x          |
| 46-column | 1x          |
| 35-column | 1x          |
| 37-column | 1x          |
| 39-column | 1x          |
| 59-column | 1x          |
| 34-column | 1x          |
| 22-column | 1x          |
| 24-column | 1x          |
| 57-column | 1x          |
| 11-column | 1x          |
| 45-column | 1x          |
| 29-column | 1x          |
| 32-column | 1x          |
| 40-column | 1x          |
| 25-column | 1x          |
| 38-column | 1x          |

### Grid Templates

```css
grid-template-columns: 570px 285px 285px;
gap: 30px;
grid-template-columns: 570px 285px 285px;
gap: 30px;
grid-template-columns: 570px 285px 285px;
gap: 30px;
grid-template-columns: 380px 380px 380px;
gap: 30px;
grid-template-columns: 570px 285px 285px;
gap: 30px;
```

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| row/wrap       | 5x    |
| row/nowrap     | 775x  |
| column/nowrap  | 35x   |

**Gap values:** `16px`, `20px`, `25.6px`, `30px`, `normal 20px`

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 10px      | No          | 0           | No        | 812px       |
| tablet (768px)   | 15px      | Yes         | 4           | Yes       | 5028px      |
| desktop (1280px) | 15px      | Yes         | 4           | No        | 5621px      |
| wide (1920px)    | 15px      | Yes         | 4           | No        | 6887px      |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- Body font size: `10px` → `15px`
- H1 size: `18px` → `23.3333px`
- Nav visibility: `hidden` → `visible`
- Hamburger menu: `hidden` → `shown`
- Max grid columns: `0` → `4`
- Page height: `812px` → `5028px`

**768px → 1280px** (tablet → desktop):

- H1 size: `23.3333px` → `25px`
- Hamburger menu: `shown` → `hidden`
- Page height: `5028px` → `5621px`

**1280px → 1920px** (desktop → wide):

- Page height: `5621px` → `6887px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 185 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio   | Level |
| ---------- | ---------- | ------- | ----- |
| `#000000`  | `#ffffff`  | 21:1    | AAA   |
| `#ffffff`  | `#000000`  | 21:1    | AAA   |
| `#000000`  | `#fefefe`  | 20.82:1 | AAA   |

## Design System Score

**Overall: 82/100 (Grade: B)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 85/100  |
| Typography Consistency    | 70/100  |
| Spacing System            | 80/100  |
| Shadow Consistency        | 80/100  |
| Border Radius Consistency | 65/100  |
| Accessibility             | 100/100 |
| CSS Tokenization          | 100/100 |

**Strengths:** Tight, disciplined color palette, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**

- No clear primary brand color detected
- 12 distinct font sizes — consider a tighter type scale
- 183 !important rules — prefer specificity over overrides
- 75% of CSS is unused — consider purging
- 1842 duplicate CSS declarations

## Gradients

**1 unique gradients** detected.

| Type   | Direction | Stops | Classification |
| ------ | --------- | ----- | -------------- |
| linear | to right  | 2     | brand          |

```css
background: linear-gradient(to right, rgb(0, 0, 0), rgb(0, 0, 0));
```

## Z-Index Map

**9 unique z-index values** across 4 layers.

| Layer    | Range     | Elements                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modal    | 1001,1001 | announcement-bar, sidebar-drawer.s.i.d.e.b.a.r. .s.i.d.e.b.a.r.-.-.r.i.g.h.t                                                                                                                                                                                                                                                                                                                                                                                  |
| dropdown | 100,999   | span.b.u.t.t.o.n._._.i.c.o.n, span.b.u.t.t.o.n._._.i.c.o.n, span.b.u.t.t.o.n._._.i.c.o.n                                                                                                                                                                                                                                                                                                                                                                      |
| sticky   | 10,99     | div.h.e.a.d.e.r.-.c.o.n.t.a.i.n.e.r. .h.e.a.d.e.r.-.c.o.n.t.a.i.n.e.r.-.-.b.o.t.t.o.m. .n.o.-.h.e.a.d.e.r.-.b.l.o.c.k.s, ul.s.u.b.m.e.n.u. .m.e.g.a.-.m.e.n.u, ul.s.u.b.m.e.n.u. .m.e.g.a.-.m.e.n.u                                                                                                                                                                                                                                                           |
| base     | 1,9       | div.m.o.d.a.l.-.r.e.d.i.r.e.c.t, div.s.u.b.m.e.n.u.-.h.o.l.d.e.r. .c.o.n.t.a.i.n.e.r.-.-.l.a.r.g.e. .s.u.b.m.e.n.u.-.h.o.l.d.e.r.-.-.p.r.o.m.o.t.i.o.n.-.w.i.d.t.h.-.f.o.u.r.t.h. .s.u.b.m.e.n.u.-.h.o.l.d.e.r.-.-.p.r.o.m.o.t.i.o.n.-.b.o.t.h, div.s.u.b.m.e.n.u.-.h.o.l.d.e.r. .c.o.n.t.a.i.n.e.r.-.-.l.a.r.g.e. .s.u.b.m.e.n.u.-.h.o.l.d.e.r.-.-.p.r.o.m.o.t.i.o.n.-.w.i.d.t.h.-.f.o.u.r.t.h. .s.u.b.m.e.n.u.-.h.o.l.d.e.r.-.-.p.r.o.m.o.t.i.o.n.-.b.o.t.h |

## SVG Icons

**11 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
| ---------- | ----- |
| xs         | 3     |
| md         | 8     |

**Icon colors:** `#000`, `#010101`, `black`, `white`

## Font Files

| Family  | Source      | Weights       | Styles |
| ------- | ----------- | ------------- | ------ |
| Figtree | self-hosted | 400, 500, 600 | normal |

## Image Style Patterns

| Pattern   | Count | Key Styles                                          |
| --------- | ----- | --------------------------------------------------- |
| general   | 1764  | objectFit: cover, borderRadius: 0px, shape: square  |
| thumbnail | 13    | objectFit: fill, borderRadius: 0px, shape: square   |
| gallery   | 3     | objectFit: cover, borderRadius: 0px, shape: square  |
| hero      | 2     | objectFit: cover, borderRadius: 0px, shape: square  |
| avatar    | 1     | objectFit: fill, borderRadius: 50%, shape: circular |

**Aspect ratios:** 4:3 (1753x), 3:4 (15x), 1:1 (8x), 3:2 (6x), 2:1 (1x)

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Figtree` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
