# Design Language: Aperture | Photography

> Extracted from `https://aperture.org` on April 18, 2026
> 3696 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role    | Hex       | RGB            | HSL                 | Usage Count |
| ------- | --------- | -------------- | ------------------- | ----------- |
| Primary | `#0000ff` | rgb(0, 0, 255) | hsl(240, 100%, 50%) | 5           |

### Neutral Colors

| Hex       | HSL              | Usage Count |
| --------- | ---------------- | ----------- |
| `#000000` | hsl(0, 0%, 0%)   | 6658        |
| `#ffffff` | hsl(0, 0%, 100%) | 622         |
| `#888888` | hsl(0, 0%, 53%)  | 62          |
| `#555555` | hsl(0, 0%, 33%)  | 32          |
| `#bdbdbd` | hsl(0, 0%, 74%)  | 29          |
| `#333333` | hsl(0, 0%, 20%)  | 12          |
| `#f2f2f2` | hsl(0, 0%, 95%)  | 5           |
| `#e5e5e5` | hsl(0, 0%, 90%)  | 3           |

### Background Colors

Used on large-area elements: `#f2f2f2`, `#ffffff`, `#000000`

### Text Colors

Text color palette: `#000000`, `#555555`, `#888888`, `#333333`, `#0000ff`, `#020202`, `#ffffff`, `#020000`, `#b5b5b5`

### Full Color Inventory

| Hex       | Contexts                 | Count |
| --------- | ------------------------ | ----- |
| `#000000` | text, border, background | 6658  |
| `#ffffff` | background, text, border | 622   |
| `#888888` | text, border             | 62    |
| `#555555` | text, border             | 32    |
| `#bdbdbd` | border, text             | 29    |
| `#333333` | text, border             | 12    |
| `#f2f2f2` | background               | 5     |
| `#0000ff` | text, border             | 5     |
| `#e5e5e5` | border                   | 3     |

## Typography

### Font Families

- **ApertureTextRegularWEB** — used for body (2451 elements)
- **Aperture Sans** — used for all (629 elements)
- **ApertureTextBoldWEB** — used for all (472 elements)
- **sans-serif** — used for all (114 elements)
- **originalgaramondbt-italic** — used for body (16 elements)
- **Ultimate-Icons** — used for body (9 elements)
- **Font Awesome 6 Brands** — used for body (2 elements)
- **Font Awesome 6 Free** — used for body (1 elements)
- **icomoon** — used for body (1 elements)
- **Aperture Serif** — used for headings (1 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                  |
| --------- | ---------- | ------ | ----------- | -------------- | ------------------------ |
| 40px      | 2.5rem     | 300    | 40px        | normal         | svg, path                |
| 32px      | 2rem       | 700    | 40px        | normal         | h1                       |
| 24px      | 1.5rem     | 400    | 24px        | normal         | button, i, span          |
| 20px      | 1.25rem    | 700    | 24px        | 0.3px          | h2, a, span, h3          |
| 18px      | 1.125rem   | 700    | 18px        | 0.3px          | div, svg, rect, a        |
| 16px      | 1rem       | 300    | 20.8px      | normal         | body, script, a, div     |
| 15px      | 0.9375rem  | 300    | 15px        | normal         | input, i                 |
| 14px      | 0.875rem   | 300    | 18.2px      | normal         | div, meta, a, img        |
| 13px      | 0.8125rem  | 400    | 20px        | normal         | button, span, svg, rect  |
| 12px      | 0.75rem    | 700    | 12px        | 0.3px          | ul, li, a, div           |
| 11px      | 0.6875rem  | 300    | 14.3px      | 1px            | div, span, script        |
| 10px      | 0.625rem   | 400    | normal      | normal         | html, head, meta, script |
| 0px       | 0rem       | 300    | 0px         | normal         | ul                       |

### Heading Scale

```css
h1 {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
}
h2 {
  font-size: 20px;
  font-weight: 700;
  line-height: 24px;
}
h3 {
  font-size: 16px;
  font-weight: 300;
  line-height: 20.8px;
}
h6 {
  font-size: 14px;
  font-weight: 300;
  line-height: 18.2px;
}
```

### Body Text

```css
body {
  font-size: 16px;
  font-weight: 300;
  line-height: 20.8px;
}
```

### Font Weights in Use

`300` (2453x), `700` (923x), `400` (313x), `100` (6x), `900` (1x)

## Spacing

**Base unit:** 2px

| Token       | Value | Rem       |
| ----------- | ----- | --------- |
| spacing-2   | 2px   | 0.125rem  |
| spacing-20  | 20px  | 1.25rem   |
| spacing-30  | 30px  | 1.875rem  |
| spacing-40  | 40px  | 2.5rem    |
| spacing-50  | 50px  | 3.125rem  |
| spacing-60  | 60px  | 3.75rem   |
| spacing-65  | 65px  | 4.0625rem |
| spacing-75  | 75px  | 4.6875rem |
| spacing-80  | 80px  | 5rem      |
| spacing-85  | 85px  | 5.3125rem |
| spacing-100 | 100px | 6.25rem   |

## Border Radii

| Label | Value | Count |
| ----- | ----- | ----- |
| xs    | 2px   | 1     |
| xl    | 20px  | 1     |
| full  | 50px  | 4     |
| full  | 90px  | 1     |

## Box Shadows

**sm** — blur: 5px

```css
box-shadow: rgb(128, 128, 128) 0px 0px 5px 0px;
```

**lg** — blur: 20px

```css
box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 20px 0px;
```

## CSS Custom Properties

### Spacing

```css
--wp--preset--font-size--normal: 16px;
--wp--preset--font-size--huge: 42px;
```

### Typography

```css
--fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
--fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
--fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
```

### Other

```css
--drawer-width: 480px;
--neg-drawer-width: calc(var(--drawer-width) * -1);
--fa-style-family-classic: "Font Awesome 6 Free";
--fa-style-family-brands: "Font Awesome 6 Brands";
```

### Dependencies

```css
--neg-drawer-width: --drawer-width;
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
| sm     | 420px  | max-width |
| sm     | 450px  | max-width |
| sm     | 480px  | max-width |
| sm     | 481px  | min-width |
| sm     | 490px  | max-width |
| sm     | 510px  | max-width |
| 550px  | 550px  | max-width |
| sm     | 600px  | max-width |
| sm     | 601px  | min-width |
| sm     | 640px  | max-width |
| sm     | 700px  | max-width |
| md     | 767px  | max-width |
| md     | 768px  | max-width |
| md     | 769px  | min-width |
| md     | 781px  | max-width |
| md     | 782px  | max-width |
| md     | 783px  | max-width |
| md     | 797px  | max-width |
| md     | 800px  | max-width |
| 900px  | 900px  | max-width |
| lg     | 960px  | max-width |
| lg     | 991px  | max-width |
| lg     | 992px  | min-width |
| lg     | 993px  | min-width |
| lg     | 1023px | max-width |
| lg     | 1024px | min-width |
| 1100px | 1100px | max-width |
| 1134px | 1134px | min-width |
| 1145px | 1145px | max-width |
| 1160px | 1160px | max-width |
| 1168px | 1168px | min-width |
| 1175px | 1175px | max-width |
| 1180px | 1180px | max-width |
| 1199px | 1199px | max-width |
| 1200px | 1200px | max-width |
| xl     | 1250px | max-width |
| xl     | 1290px | min-width |
| xl     | 1326px | max-width |
| 1439px | 1439px | max-width |
| 1440px | 1440px | min-width |
| 2xl    | 1500px | min-width |
| 1680px | 1680px | max-width |
| 1681px | 1681px | min-width |
| 1715px | 1715px | max-width |
| 1919px | 1919px | max-width |
| 1920px | 1920px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`

**Durations:** `0.5s`, `0.3s`, `0.2s`, `0.4s`, `0.15s`

### Common Transitions

```css
transition: all;
transition: 0.5s linear;
transition: height 0.5s;
transition: 0.3s linear;
transition: 0.2s linear 0.2s;
transition:
  opacity 0.3s ease-in,
  visibility 0.3s ease-in;
transition: 0.4s;
transition: 0.2s;
transition: 0.15s ease-in-out;
transition:
  color 0.2s,
  background 0.2s;
```

### Keyframe Animations

**turn-on-visibility**

```css
@keyframes turn-on-visibility {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

**turn-off-visibility**

```css
@keyframes turn-off-visibility {
  0% {
    opacity: 1;
    visibility: visible;
  }
  99% {
    opacity: 0;
    visibility: visible;
  }
  100% {
    opacity: 0;
    visibility: hidden;
  }
}
```

**lightbox-zoom-in**

```css
@keyframes lightbox-zoom-in {
  0% {
    transform: translate(
        calc(
          (-100vw + var(--wp--lightbox-scrollbar-width)) / 2 +
            var(--wp--lightbox-initial-left-position)
        ),
        calc(-50vh + var(--wp--lightbox-initial-top-position))
      )
      scale(var(--wp--lightbox-scale));
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}
```

**lightbox-zoom-out**

```css
@keyframes lightbox-zoom-out {
  0% {
    transform: translate(-50%, -50%) scale(1);
    visibility: visible;
  }
  99% {
    visibility: visible;
  }
  100% {
    transform: translate(
        calc(
          (-100vw + var(--wp--lightbox-scrollbar-width)) / 2 +
            var(--wp--lightbox-initial-left-position)
        ),
        calc(-50vh + var(--wp--lightbox-initial-top-position))
      )
      scale(var(--wp--lightbox-scale));
    visibility: hidden;
  }
}
```

**overlay-menu\_\_fade-in-animation**

```css
@keyframes overlay-menu__fade-in-animation {
  0% {
    opacity: 0;
    transform: translateY(0.5em);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
}
```

**fadein**

```css
@keyframes fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

**fadein**

```css
@keyframes fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

**slidein**

```css
@keyframes slidein {
  0% {
    transform: translateX(0px);
  }
  100% {
    transform: translateX(max(-100%, var(--neg-drawer-width)));
  }
}
```

**slidein**

```css
@keyframes slidein {
  0% {
    transform: translateX(0px);
  }
  100% {
    transform: translateX(max(-100%, var(--neg-drawer-width)));
  }
}
```

**rtlslidein**

```css
@keyframes rtlslidein {
  0% {
    transform: translateX(0px);
  }
  100% {
    transform: translateX(min(100%, var(--drawer-width)));
  }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (17 instances)

```css
.button {
  background-color: rgba(255, 255, 255, 0);
  color: rgb(0, 0, 0);
  font-size: 16px;
  font-weight: 700;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Inputs (3 instances)

```css
.input {
  background-color: rgb(252, 252, 252);
  color: rgb(2, 2, 2);
  border-color: rgb(0, 0, 0);
  border-radius: 4px;
  font-size: 15px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (394 instances)

```css
.link {
  color: rgb(0, 0, 0);
  font-size: 16px;
  font-weight: 700;
}
```

### Navigation (9 instances)

```css
.navigatio {
  background-color: rgb(242, 242, 242);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 20px 0px;
}
```

### Footer (2 instances)

```css
.foote {
  background-color: rgb(242, 242, 242);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 16px;
}
```

### Modals (5 instances)

```css
.modal {
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Dropdowns (415 instances)

```css
.dropdown {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 20px 0px;
  border-color: rgb(0, 0, 0);
  padding-top: 0px;
}
```

### Badges (1 instances)

```css
.badge {
  color: rgb(255, 255, 255);
  font-size: 15px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Tabs (3 instances)

```css
.tab {
  background-color: rgb(0, 0, 0);
  color: rgb(0, 0, 0);
  font-size: 16px;
  font-weight: 700;
  padding-top: 10px;
  padding-right: 15px;
  border-color: rgb(0, 0, 0);
  border-radius: 0px;
}
```

### Accordions (23 instances)

```css
.accordion {
  background-color: rgb(0, 0, 0);
  color: rgb(255, 255, 255);
  font-size: 16px;
  padding-top: 0px;
  padding-right: 0px;
  border-color: rgb(255, 255, 255);
}
```

### Switches (47 instances)

```css
.switche {
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 4 instances, 1 variant

**Variant 1** (4 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 300;
```

### Button — 4 instances, 2 variants

**Variant 1** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 300;
```

**Variant 2** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 16px;
font-weight: 300;
```

### Button — 3 instances, 2 variants

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 300;
```

**Variant 2** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 16px;
font-weight: 300;
```

### Button — 3 instances, 3 variants

**Variant 1** (1 instance)

```css
background: rgba(255, 255, 255, 0);
color: rgb(0, 0, 255);
padding: 12px 24px 12px 24px;
border-radius: 90px;
border: 1px solid rgb(0, 0, 255);
font-size: 16px;
font-weight: 700;
```

**Variant 2** (1 instance)

```css
background: rgba(255, 0, 0, 0);
color: rgb(2, 0, 0);
padding: 12px 24px 12px 24px;
border-radius: 0px;
border: 0px none rgb(0, 0, 255);
font-size: 16px;
font-weight: 700;
```

**Variant 3** (1 instance)

```css
background: rgba(255, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 12px 24px 12px 24px;
border-radius: 20px;
border: 1px solid rgb(255, 255, 255);
font-size: 16px;
font-weight: 700;
```

### Button — 3 instances, 3 variants

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 255);
font-size: 16px;
font-weight: 700;
```

**Variant 2** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(2, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(2, 0, 0);
font-size: 16px;
font-weight: 700;
```

**Variant 3** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 255, 255);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 16px;
font-weight: 700;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 300;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(255, 255, 255, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 24px;
font-weight: 400;
```

### Button — 4 instances, 1 variant

**Variant 1** (4 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 0px 0px 0px 0px;
border-radius: 3px;
border: 0px none rgb(0, 0, 0);
font-size: 20px;
font-weight: 300;
```

## Layout System

**13 grid containers** and **330 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 1110px    | 0px     |
| 1130px    | 0px     |
| 1360px    | 0px     |
| 100%      | 0px     |

### Grid Column Patterns

| Columns  | Usage Count |
| -------- | ----------- |
| 2-column | 12x         |
| 1-column | 1x          |

### Grid Templates

```css
grid-template-columns: 564px;
gap: 5px normal;
grid-template-columns: 155px 409px;
gap: 5px normal;
grid-template-columns: 0px 376px;
gap: 5px normal;
grid-template-columns: 155px 221px;
gap: 5px normal;
grid-template-columns: 155px 221px;
gap: 5px normal;
```

### Flex Patterns

| Direction/Wrap | Count |
| -------------- | ----- |
| row/nowrap     | 205x  |
| row/wrap       | 14x   |
| column/nowrap  | 111x  |

**Gap values:** `5px normal`

## Responsive Design

### Viewport Snapshots

| Viewport         | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
| ---------------- | --------- | ----------- | ----------- | --------- | ----------- |
| mobile (375px)   | 16px      | Yes         | 0           | Yes       | 6677px      |
| tablet (768px)   | 16px      | Yes         | 2           | Yes       | 8114px      |
| desktop (1280px) | 16px      | Yes         | 2           | No        | 4399px      |
| wide (1920px)    | 16px      | Yes         | 2           | No        | 4651px      |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):

- H1 size: `28px` → `32px`
- Max grid columns: `0` → `2`
- Page height: `6677px` → `8114px`

**768px → 1280px** (tablet → desktop):

- Hamburger menu: `shown` → `hidden`
- Page height: `8114px` → `4399px`

**1280px → 1920px** (desktop → wide):

- Page height: `4399px` → `4651px`

## Interaction States

### Button States

**"Search"**

```css
/* Focus */
border-color: rgb(0, 0, 0) → rgba(0, 0, 0, 0);
outline: rgb(0, 0, 0) none 3px → rgb(0, 0, 0) none 0px;
```

**""**

```css
/* Hover */
color: rgb(0, 0, 0) → rgb(255, 255, 255);
border-color: rgb(0, 0, 0) → rgb(255, 255, 255);
outline: rgb(0, 0, 0) none 3px → rgb(255, 255, 255) none 3px;
```

```css
/* Focus */
color: rgb(0, 0, 0) → rgb(255, 255, 255);
border-color: rgb(0, 0, 0) → rgb(255, 255, 255);
outline: rgb(0, 0, 0) none 3px → rgb(255, 255, 255) none 3px;
```

**""**

```css
/* Hover */
color: rgb(0, 0, 0) → rgb(255, 255, 255);
border-color: rgb(0, 0, 0) → rgb(255, 255, 255);
outline: rgb(0, 0, 0) none 3px → rgb(255, 255, 255) none 3px;
```

```css
/* Focus */
color: rgb(0, 0, 0) → rgb(255, 255, 255);
border-color: rgb(0, 0, 0) → rgb(255, 255, 255);
outline: rgb(0, 0, 0) none 3px → rgb(255, 255, 255) none 3px;
```

### Link Hover

```css
outline: rgb(136, 136, 136) none 3px → rgb(136, 136, 136) none 0px;
```

### Input Focus

```css
outline: rgb(0, 0, 0) none 3px → rgb(0, 0, 0) none 0px;
```

## Accessibility (WCAG 2.1)

**Overall Score: 97%** — 113 passing, 4 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio | Level | Used On  |
| ---------- | ---------- | ----- | ----- | -------- |
| `#b5b5b5`  | `#f0f0f0`  | 1.8:1 | FAIL  | svg (4x) |

### Passing Color Pairs

| Foreground | Background | Ratio   | Level |
| ---------- | ---------- | ------- | ----- |
| `#000000`  | `#ffffff`  | 21:1    | AAA   |
| `#ffffff`  | `#000000`  | 21:1    | AAA   |
| `#000000`  | `#f2f2f2`  | 18.76:1 | AAA   |
| `#020202`  | `#fcfcfc`  | 20.22:1 | AAA   |

## Design System Score

**Overall: 78/100 (Grade: C)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 85/100  |
| Typography Consistency    | 40/100  |
| Spacing System            | 80/100  |
| Shadow Consistency        | 100/100 |
| Border Radius Consistency | 85/100  |
| Accessibility             | 97/100  |
| CSS Tokenization          | 75/100  |

**Strengths:** Tight, disciplined color palette, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**

- 10 font families — consider limiting to 2 (heading + body)
- 13 distinct font sizes — consider a tighter type scale
- 4 WCAG contrast failures
- 1827 !important rules — prefer specificity over overrides
- 95% of CSS is unused — consider purging
- 21418 duplicate CSS declarations

## Z-Index Map

**6 unique z-index values** across 3 layers.

| Layer    | Range   | Elements                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dropdown | 100,100 | div.m.i.n.i.-.c.a.r.t.-.h.e.a.d.e.r. .e.m.p.t.y                                                                                                                                                                                                                                                                                                                                   |
| sticky   | 10,16   | ul.s.u.b.-.m.e.n.u, ul.s.u.b.-.m.e.n.u, ul.s.u.b.-.m.e.n.u                                                                                                                                                                                                                                                                                                                        |
| base     | 1,9     | div.p.p.-.c.o.n.t.e.n.t.-.p.o.s.t.s.-.i.n.n.e.r. .o.w.l.-.c.a.r.o.u.s.e.l. .o.w.l.-.t.h.e.m.e. .o.w.l.-.l.o.a.d.e.d. .o.w.l.-.d.r.a.g, div.f.l.-.m.o.d.u.l.e. .f.l.-.m.o.d.u.l.e.-.h.e.a.d.i.n.g. .f.l.-.n.o.d.e.-.g.b.a.i.t.5.c.2.0.z.v.e, div.p.p.-.c.o.n.t.e.n.t.-.p.o.s.t.s.-.i.n.n.e.r. .o.w.l.-.c.a.r.o.u.s.e.l. .o.w.l.-.t.h.e.m.e. .o.w.l.-.l.o.a.d.e.d. .o.w.l.-.d.r.a.g |

## SVG Icons

**2 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
| ---------- | ----- |
| xl         | 2     |

**Icon colors:** `currentColor`, `rgb(0, 0, 0)`

## Font Files

| Family                        | Source      | Weights       | Styles |
| ----------------------------- | ----------- | ------------- | ------ |
| dashicons                     | self-hosted | 400           | normal |
| Ultimate-Icons                | self-hosted | normal        | normal |
| icomoon                       | self-hosted | normal        | normal |
| Font Awesome 6 Brands         | self-hosted | 400           | normal |
| Font Awesome 6 Free           | self-hosted | 400, 900      | normal |
| Font Awesome 5 Brands         | self-hosted | 400           | normal |
| Font Awesome 5 Free           | self-hosted | 400, 900      | normal |
| FontAwesome                   | self-hosted | 400, normal   | normal |
| ApertureTextBold-ItalicWEB    | self-hosted | 400           | normal |
| ApertureTextBoldWEB           | self-hosted | 400           | normal |
| ApertureTextLight-ItalicWEB   | self-hosted | 400           | normal |
| ApertureTextLightWEB          | self-hosted | 400           | normal |
| ApertureTextRegular-ItalicWEB | self-hosted | 400           | normal |
| ApertureTextRegularWEB        | self-hosted | 400           | normal |
| Aperture Serif Italic         | self-hosted | 300, 400, 700 | normal |
| Aperture Serif                | self-hosted | 300, 400, 700 | normal |
| Aperture Sans Italic          | self-hosted | 400, 700      | normal |
| Aperture Sans                 | self-hosted | 400, 700      | normal |

## Image Style Patterns

| Pattern   | Count | Key Styles                                          |
| --------- | ----- | --------------------------------------------------- |
| general   | 78    | objectFit: cover, borderRadius: 0px, shape: square  |
| thumbnail | 14    | objectFit: fill, borderRadius: 0px, shape: square   |
| avatar    | 4     | objectFit: fill, borderRadius: 50%, shape: circular |

**Aspect ratios:** 4:3 (73x), 16:9 (9x), 3:4 (7x), 1:1 (5x), 4.6:1 (2x)

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `ApertureTextRegularWEB` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
