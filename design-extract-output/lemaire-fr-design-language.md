# Design Language: Official Online Store | LEMAIRE

> Extracted from `https://www.lemaire.fr/` on April 19, 2026
> 4362 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role      | Hex       | RGB                | HSL               | Usage Count |
| --------- | --------- | ------------------ | ----------------- | ----------- |
| Primary   | `#100a0d` | rgb(16, 10, 13)    | hsl(330, 23%, 5%) | 6001        |
| Secondary | `#fdfbf9` | rgb(253, 251, 249) | hsl(30, 50%, 98%) | 121         |
| Accent    | `#fdfbf9` | rgb(253, 251, 249) | hsl(30, 50%, 98%) | 121         |

### Neutral Colors

| Hex       | HSL               | Usage Count |
| --------- | ----------------- | ----------- |
| `#000000` | hsl(0, 0%, 0%)    | 2564        |
| `#77716e` | hsl(20, 4%, 45%)  | 50          |
| `#383d41` | hsl(207, 7%, 24%) | 9           |
| `#333333` | hsl(0, 0%, 20%)   | 7           |
| `#e5e5e5` | hsl(0, 0%, 90%)   | 5           |
| `#242121` | hsl(0, 4%, 14%)   | 3           |

### Background Colors

Used on large-area elements: `#fdfbf9`, `#ffffff`, `#242121`

### Text Colors

Text color palette: `#000000`, `#100a0d`, `#ffffff`, `#77716e`, `#fdfbf9`, `#ff4500`, `#333333`, `#383d41`

### Full Color Inventory

| Hex       | Contexts                 | Count |
| --------- | ------------------------ | ----- |
| `#100a0d` | text, border             | 6001  |
| `#000000` | text, border, background | 2564  |
| `#fdfbf9` | background, text, border | 121   |
| `#77716e` | text, border             | 50    |
| `#ff4500` | background, text, border | 13    |
| `#383d41` | text, border             | 9     |
| `#333333` | text, border             | 7     |
| `#e5e5e5` | background               | 5     |
| `#242121` | background               | 3     |
| `#dad5d0` | border                   | 2     |
| `#e83737` | border                   | 1     |
| `#f4f0ed` | border                   | 1     |
| `#121f36` | background               | 1     |
| `#bee5eb` | border                   | 1     |

## Typography

### Font Families

- **BrownStd** — used for all (2964 elements)
- **EBGaramond** — used for body (792 elements)
- **Arial** — used for body (273 elements)
- **Times** — used for body (239 elements)
- **GaramondPremrPro** — used for body (86 elements)
- **swym-font** — used for body (6 elements)
- **GTStandard-M** — used for body (2 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On                  |
| --------- | ---------- | ------ | ----------- | -------------- | ------------------------ |
| 32px      | 2rem       | 400    | 41.6px      | 0.6px          | h1                       |
| 24px      | 1.5rem     | 400    | 28.8px      | 1.44px         | p                        |
| 20px      | 1.25rem    | 400    | 35px        | normal         | span, button             |
| 18px      | 1.125rem   | 400    | 18px        | normal         | p, h2                    |
| 16px      | 1rem       | 400    | normal      | normal         | body, div, p, span       |
| 15px      | 0.9375rem  | 400    | 18px        | 1px            | a                        |
| 14px      | 0.875rem   | 400    | normal      | normal         | div, form, button, span  |
| 13.3333px | 0.8333rem  | 400    | normal      | normal         | input, button, span, svg |
| 13px      | 0.8125rem  | 400    | 19.5px      | 0.4px          | button, svg, path, div   |
| 12px      | 0.75rem    | 400    | 30px        | normal         | a, i, div, p             |
| 11px      | 0.6875rem  | 400    | 13.2px      | 0.7px          | small, span              |
| 10px      | 0.625rem   | 400    | normal      | normal         | html, head, meta, script |

### Heading Scale

```css
h1 {
  font-size: 32px;
  font-weight: 400;
  line-height: 41.6px;
}
h2 {
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
}
```

### Body Text

```css
body {
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
}
```

### Font Weights in Use

`400` (4134x), `500` (198x), `700` (30x)

## Spacing

**Base unit:** 2px

| Token       | Value | Rem       |
| ----------- | ----- | --------- |
| spacing-1   | 1px   | 0.0625rem |
| spacing-20  | 20px  | 1.25rem   |
| spacing-24  | 24px  | 1.5rem    |
| spacing-30  | 30px  | 1.875rem  |
| spacing-32  | 32px  | 2rem      |
| spacing-34  | 34px  | 2.125rem  |
| spacing-36  | 36px  | 2.25rem   |
| spacing-40  | 40px  | 2.5rem    |
| spacing-45  | 45px  | 2.8125rem |
| spacing-47  | 47px  | 2.9375rem |
| spacing-50  | 50px  | 3.125rem  |
| spacing-80  | 80px  | 5rem      |
| spacing-120 | 120px | 7.5rem    |

## Border Radii

| Label | Value | Count |
| ----- | ----- | ----- |
| sm    | 4px   | 1     |
| md    | 8px   | 200   |
| full  | 50px  | 3     |
| full  | 100px | 1     |

## Box Shadows

**xs (inset)** — blur: 0px

```css
box-shadow:
  rgba(0, 0, 0, 0.13) 1px 0px 0px 0px inset,
  rgba(0, 0, 0, 0.13) -1px 0px 0px 0px inset,
  rgba(0, 0, 0, 0.17) 0px -1px 0px 0px inset,
  rgba(204, 204, 204, 0.5) 0px 1px 0px 0px inset,
  rgba(26, 26, 26, 0.24) 0px 12px 20px -8px;
```

**xs** — blur: 1px

```css
box-shadow: rgba(0, 0, 0, 0.2) 1px 1px 1px 1px;
```

**sm** — blur: 6px

```css
box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 6px 0px;
```

**md** — blur: 8px

```css
box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 8px 0px;
```

**lg** — blur: 25px

```css
box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 25px 0px;
```

**xl** — blur: 80px

```css
box-shadow: rgba(0, 0, 0, 0.2) 0px 26px 80px 0px;
```

## CSS Custom Properties

### Colors

```css
--swiper-theme-color: #000;
--media-border-opacity: 0.05;
--media-border-width: 1px;
--product-card-image-padding: 0rem;
--product-card-corner-radius: 0rem;
--product-card-text-alignment: left;
--product-card-border-width: 0rem;
--product-card-border-opacity: 0.1;
--product-card-shadow-opacity: 0;
--product-card-shadow-visible: 0;
--product-card-shadow-horizontal-offset: 0rem;
--product-card-shadow-vertical-offset: 0.4rem;
--product-card-shadow-blur-radius: 0.5rem;
--collection-card-image-padding: 0rem;
--collection-card-corner-radius: 0rem;
--collection-card-text-alignment: left;
--collection-card-border-width: 0rem;
--collection-card-border-opacity: 0.1;
--collection-card-shadow-opacity: 0;
--collection-card-shadow-visible: 0;
--collection-card-shadow-horizontal-offset: 0rem;
--collection-card-shadow-vertical-offset: 0.4rem;
--collection-card-shadow-blur-radius: 0.5rem;
--blog-card-image-padding: 0rem;
--blog-card-corner-radius: 0rem;
--blog-card-text-alignment: left;
--blog-card-border-width: 0rem;
--blog-card-border-opacity: 0.1;
--blog-card-shadow-opacity: 0;
--blog-card-shadow-visible: 0;
--blog-card-shadow-horizontal-offset: 0rem;
--blog-card-shadow-vertical-offset: 0.4rem;
--blog-card-shadow-blur-radius: 0.5rem;
--popup-border-width: 1px;
--popup-border-opacity: 0.1;
--drawer-border-width: 1px;
--drawer-border-opacity: 0.1;
--text-boxes-border-opacity: 0.1;
--text-boxes-border-width: 0px;
--buttons-border-width: 1px;
--buttons-border-opacity: 1;
--buttons-border-offset: 0px;
--inputs-border-width: 1px;
--inputs-border-opacity: 0.55;
--variant-pills-border-width: 1px;
--variant-pills-border-opacity: 0.55;
--alpha-button-border: 1;
--alpha-badge-border: 0.1;
--color-primary-black: #100a0d;
--color-primary-white: #fdfbf9;
--color-secondary-dark-grey-100: #242121;
--color-secondary-dark-grey-200: #3e3b3b;
--color-secondary-dark-grey-300: #77716e;
--color-secondary-light-grey-100: #f4f0ed;
--color-secondary-light-grey-200: #dad5d0;
--color-secondary-light-grey-300: #afa9a9;
--color-error: #d51f1f;
--color-note: #509b4b;
--overlay-bg: url(./overlay.png);
--swym-remind-cta-bg-color: #00a65a;
--swym-remind-cta-text-color: white;
--swym-remind-cta-bg-color-v2: #000000;
--swym-remind-cta-text-color-v2: white;
--swym-subscribe-success-bg-color: #aee9d1;
--swym-subscribe-success-text-color: #202223;
--swym-storefront-layout-carousel-button-icon-color: #171722;
--swym-storefront-layout-button-color-text-primary: #fff;
--swym-storefront-layout-input-color-text: #171722;
--swym-storefront-layout-notification-warning-text-color: #856404;
--swym-storefront-layout-color-text-sub2: #999ea8;
--swym-storefront-layout-color-text-sub: #b1b7c3;
--swym-storefront-layout-carousel-item-border-color: #b1b7c3;
--swym-storefront-layout-color-text: #1c1c1c;
--swym-storefront-layout-color-text-error: #ea0202;
--swym-storefront-layout-border-color: #b1b7c3;
--swym-storefront-layout-color-text-remove: #ea0202;
--swym-storefront-layout-button-color-text-secondary: #121f36;
--swym-storefront-layout-color-bg: #fff;
--swym-storefront-layout-notification-warning-border-color: #ffeeba;
--swym-storefront-layout-close-button-icon-color: #333333;
--swym-storefront-layout-notification-error-border-color: #f5c6cb;
--swym-storefront-layout-carousel-image-border-color: #17172205;
--swym-storefront-layout-input-color-bg: #fff;
--swym-storefront-layout-color-text-default: #1c1c1c;
--swym-storefront-layout-notification-info-text-color: #ffffff;
--swym-storefront-layout-notification-info-border-color: #bee5eb;
--swym-storefront-layout-notification-success-text-color: #155724;
--swym-storefront-layout-notification-neutral-text-color: #383d41;
--swym-storefront-layout-notification-toast-bg-color: #333333;
--swym-storefront-layout-ui-text-color: #000;
--swym-storefront-layout-notification-warning-bg-color: #fff3cd;
--swym-storefront-layout-notification-toast-text-color: #ffffff;
--swym-storefront-layout-notification-error-bg-color: #f8d7da;
--swym-storefront-layout-carousel-button-bg-color: #ffffff;
--swym-storefront-layout-notification-error-text-color: #721c24;
--swym-storefront-layout-notification-neutral-bg-color: #ffffff;
--swym-storefront-layout-ui-border-radius: 10px;
--swym-storefront-layout-carousel-image-bg-color: #0000000d;
--swym-storefront-layout-button-color-bg-secondary: #e6f7f4;
--swym-storefront-layout-color-border: #b1b7c3;
--swym-storefront-layout-close-button-bg-color: #fff;
--swym-storefront-layout-ui-bg-color: #fff;
--swym-storefront-layout-notification-neutral-border-color: #d6d8db;
--swym-storefront-layout-notification-success-bg-color: #d4edda;
--swym-storefront-layout-button-border-radius: 19px;
--swym-storefront-layout-notification-success-border-color: #c3e6cb;
--swym-storefront-layout-notification-info-bg-color: #121f36;
--swym-storefront-layout-button-color-bg-primary: #000;
--swym-storefront-layout-notification-toast-border-color: #434343;
--swym-p-border-radius-100: 4px;
--swym-p-border-radius-050: 2px;
```

### Spacing

```css
--swiper-navigation-size: 13px;
--media-padding: px;
--page-width-margin: 0rem;
--spacing-sections-desktop: 0px;
--spacing-sections-mobile: 0px;
--grid-desktop-vertical-spacing: 8px;
--grid-desktop-horizontal-spacing: 8px;
--grid-mobile-vertical-spacing: 4px;
--grid-mobile-horizontal-spacing: 4px;
--inputs-margin-offset: 0px;
--space-xxs: 4px;
--space-xs: 8px;
--space-sm: 16px;
--space-md: 24px;
--space-lg: 40px;
--space-xl: 80px;
--space-xxl: 120px;
--space-xxxl: 160px;
--col-gap: 2px;
--swym-p-space-400: 16px;
--swym-p-space-800: 32px;
--swym-storefront-layout-font-size-text: 13px;
--swym-storefront-layout-font-size-heading: 14px;
--swym-storefront-layout-font-size-sub-text: 12px;
--swym-p-space-100: 4px;
--swym-p-space-500: 20px;
--swym-storefront-layout-font-size-header: 20px;
--swym-storefront-layout-font-size-login-heading: 16px;
--swym-p-space-300: 12px;
--swym-p-space-200: 8px;
--swym-p-space-600: 24px;
--swym-p-space-150: 6px;
```

### Typography

```css
--font-body-family: "BrownStd", sans-serif;
--font-body-style: normal;
--font-body-weight: 400;
--font-body-weight-bold: 700;
--font-heading-family: "GaramondPremrPro", serif;
--font-heading-style: normal;
--font-heading-weight: 400;
--font-body-scale: 1;
--font-heading-scale: 1;
--text-boxes-radius: 0px;
--text-boxes-shadow-opacity: 0;
--text-boxes-shadow-visible: 0;
--text-boxes-shadow-horizontal-offset: 0px;
--text-boxes-shadow-vertical-offset: 4px;
--text-boxes-shadow-blur-radius: 5px;
--font-sans: "BrownStd", sans-serif;
--font-serif: "GaramondPremrPro", serif;
```

### Shadows

```css
--media-shadow-opacity: 0;
--media-shadow-horizontal-offset: 0px;
--media-shadow-vertical-offset: 4px;
--media-shadow-blur-radius: 5px;
--media-shadow-visible: 0;
--popup-shadow-opacity: 0.05;
--popup-shadow-horizontal-offset: 0px;
--popup-shadow-vertical-offset: 4px;
--popup-shadow-blur-radius: 5px;
--drawer-shadow-opacity: 0;
--drawer-shadow-horizontal-offset: 0px;
--drawer-shadow-vertical-offset: 4px;
--drawer-shadow-blur-radius: 5px;
--buttons-shadow-opacity: 0;
--buttons-shadow-visible: 0;
--buttons-shadow-horizontal-offset: 0px;
--buttons-shadow-vertical-offset: 4px;
--buttons-shadow-blur-radius: 5px;
--inputs-shadow-opacity: 0;
--inputs-shadow-horizontal-offset: 0px;
--inputs-shadow-vertical-offset: 4px;
--inputs-shadow-blur-radius: 5px;
--variant-pills-shadow-opacity: 0;
--variant-pills-shadow-horizontal-offset: 0px;
--variant-pills-shadow-vertical-offset: 4px;
--variant-pills-shadow-blur-radius: 5px;
--focused-base-box-shadow:
  0 0 0 0.3rem rgb(var(--color-background)), 0 0 0.5rem 0.4rem rgba(var(--color-foreground), 0.3);
```

### Radii

```css
--media-radius: 0px;
--badge-corner-radius: 4rem;
--popup-corner-radius: 0px;
--buttons-radius: 0px;
--buttons-radius-outset: 0px;
--inputs-radius: 0px;
--inputs-radius-outset: 0px;
--variant-pills-radius: 40px;
```

### Other

```css
--page-width: 160rem;
--alpha-button-background: 1;
--alpha-link: 0.85;
--focused-base-outline: 0.2rem solid rgba(var(--color-foreground), 0.5);
--focused-base-outline-offset: 0.3rem;
--duration-short: 100ms;
--duration-default: 200ms;
--duration-announcement-bar: 250ms;
--duration-medium: 300ms;
--duration-long: 500ms;
--duration-extra-long: 600ms;
--duration-extra-longer: 750ms;
--duration-extended: 3s;
--ease-out-slow: cubic-bezier(0, 0, 0.3, 1);
--animation-slide-in: slideIn var(--duration-extra-long) var(--ease-out-slow) forwards;
--animation-fade-in: fadeIn var(--duration-extra-long) var(--ease-out-slow);
--gutter-container: 10px;
--grain-opacity: 0.12;
--grain-scale: 140;
--grain-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' seed='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
--swym-recently-viewed-pointer-pos: 92%;
--sparkle: url("./sparkle.gif");
--swym-storefront-layout-side-drawer-width: 300px;
--easter-egg: none;
```

### Dependencies

```css
--focused-base-outline: --color-foreground;
--focused-base-box-shadow: --color-background, --color-foreground;
--animation-slide-in: --duration-extra-long, --ease-out-slow;
--animation-fade-in: --duration-extra-long, --ease-out-slow;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name  | Value  | Type      |
| ----- | ------ | --------- |
| 411px | 411px  | max-width |
| sm    | 436px  | max-width |
| sm    | 480px  | max-width |
| 560px | 560px  | max-width |
| 570px | 570px  | max-width |
| sm    | 620px  | max-width |
| sm    | 650px  | max-width |
| md    | 749px  | max-width |
| md    | 750px  | max-width |
| md    | 768px  | min-width |
| md    | 769px  | max-width |
| md    | 820px  | max-width |
| 860px | 860px  | max-width |
| 899px | 899px  | max-width |
| 900px | 900px  | max-width |
| lg    | 989px  | max-width |
| lg    | 990px  | min-width |
| lg    | 1023px | max-width |
| lg    | 1024px | max-width |
| lg    | 1025px | min-width |
| lg    | 1044px | min-width |
| lg    | 1051px | max-width |
| lg    | 1080px | max-width |
| xl    | 1280px | max-width |
| xl    | 1281px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`, `[object Object]`

**Durations:** `0.1s`, `0.2s`, `0.3s`, `0.4s`, `0.5s`

### Common Transitions

```css
transition: all;
transition: box-shadow 0.1s;
transition: visibility 0.2s;
transition: opacity 0.3s;
transition: transform 0.2s;
transition: color 0.3s cubic-bezier(0.5, 0, 0.6, 1);
transition: 0.3s cubic-bezier(0.5, 0, 0.6, 1);
transition: opacity 0.3s cubic-bezier(0.5, 0, 0.6, 1);
transition: fill 0.3s cubic-bezier(0.5, 0, 0.6, 1);
transition:
  top 0.1s,
  font-size 0.1s;
```

### Keyframe Animations

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

**swiper-preloader-spin**

```css
@keyframes swiper-preloader-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

**translateAnnouncementSlideIn**

```css
@keyframes translateAnnouncementSlideIn {
  0% {
    opacity: 0;
    transform: translateX(var(--announcement-translate-from));
  }
  100% {
    opacity: 1;
    transform: translateX(0px);
  }
}
```

**translateAnnouncementSlideOut**

```css
@keyframes translateAnnouncementSlideOut {
  0% {
    opacity: 1;
    transform: translateX(0px);
  }
  100% {
    opacity: 0;
    transform: translateX(var(--announcement-translate-to));
  }
}
```

**animateMenuOpen**

```css
@keyframes animateMenuOpen {
  0% {
    opacity: 0;
    transform: translateY(-1.5rem);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
}
```

**rotator**

```css
@keyframes rotator {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(270deg);
  }
}
```

**dash**

```css
@keyframes dash {
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

**indeterminateAnimation**

```css
@keyframes indeterminateAnimation {
  0% {
    transform: translateX(-20%) scaleX(0);
  }
  40% {
    transform: translateX(30%) scaleX(0.7);
  }
  100% {
    transform: translateX(100%) scaleX(0);
  }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (30 instances)

```css
.button {
  background-color: rgb(36, 33, 33);
  color: rgb(16, 10, 13);
  font-size: 13.3333px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Cards (21 instances)

```css
.card {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  box-shadow:
    rgba(0, 0, 0, 0.13) 1px 0px 0px 0px inset,
    rgba(0, 0, 0, 0.13) -1px 0px 0px 0px inset,
    rgba(0, 0, 0, 0.17) 0px -1px 0px 0px inset,
    rgba(204, 204, 204, 0.5) 0px 1px 0px 0px inset,
    rgba(26, 26, 26, 0.24) 0px 12px 20px -8px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Inputs (232 instances)

```css
.input {
  background-color: rgb(253, 251, 249);
  color: rgb(0, 0, 0);
  border-color: rgb(0, 0, 0);
  border-radius: 0px;
  font-size: 13.3333px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (341 instances)

```css
.link {
  color: rgb(16, 10, 13);
  font-size: 12px;
  font-weight: 400;
}
```

### Navigation (49 instances)

```css
.navigatio {
  background-color: rgb(253, 251, 249);
  color: rgb(16, 10, 13);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (642 instances)

```css
.foote {
  background-color: rgb(253, 251, 249);
  color: rgb(16, 10, 13);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 16px;
}
```

### Modals (40 instances)

```css
.modal {
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 26px 80px 0px;
  padding-top: 0px;
  padding-right: 0px;
  max-width: 100%;
}
```

### Dropdowns (75 instances)

```css
.dropdown {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  border-color: rgb(16, 10, 13);
  padding-top: 0px;
}
```

### Badges (16 instances)

```css
.badge {
  color: rgb(16, 10, 13);
  font-size: 12px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Tooltips (7 instances)

```css
.tooltip {
  background-color: rgb(255, 255, 255);
  color: rgb(16, 10, 13);
  font-size: 16px;
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
  box-shadow:
    rgba(0, 0, 0, 0.13) 1px 0px 0px 0px inset,
    rgba(0, 0, 0, 0.13) -1px 0px 0px 0px inset,
    rgba(0, 0, 0, 0.17) 0px -1px 0px 0px inset,
    rgba(204, 204, 204, 0.5) 0px 1px 0px 0px inset,
    rgba(26, 26, 26, 0.24) 0px 12px 20px -8px;
}
```

### ProgressBars (7 instances)

```css
.progressBar {
  background-color: rgba(229, 229, 229, 0.5);
  color: rgb(16, 10, 13);
  border-radius: 0px;
  font-size: 16px;
}
```

### Switches (1 instances)

```css
.switche {
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0px;
  border-color: rgb(16, 10, 13);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgb(253, 251, 249);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Button — 2 instances, 2 variants

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 30px 0px 30px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 15px;
font-weight: 400;
```

**Variant 2** (1 instance)

```css
background: rgb(36, 33, 33);
color: rgb(255, 255, 255);
padding: 12px 24px 12px 24px;
border-radius: 0px;
border: 0px none rgb(255, 255, 255);
font-size: 12px;
font-weight: 400;
```

### Button — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 13.3333px;
font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 12px;
font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Input — 3 instances, 2 variants

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 15px 5px 15px 5px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 12px;
font-weight: 400;
```

**Variant 2** (1 instance)

```css
background: rgb(253, 251, 249);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 14px;
font-weight: 400;
```

### Button — 2 instances, 2 variants

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(253, 251, 249);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(253, 251, 249);
font-size: 14px;
font-weight: 400;
```

**Variant 2** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 40px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 14px;
font-weight: 400;
```

### Button — 2 instances, 2 variants

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(253, 251, 249);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(253, 251, 249);
font-size: 14px;
font-weight: 400;
```

**Variant 2** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 14px;
font-weight: 400;
```

### Card — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Card — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Card — 4 instances, 2 variants

**Variant 1** (1 instance)

```css
background: rgb(253, 251, 249);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

**Variant 2** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 10px 10px 10px 10px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Link — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(0, 0, 0);
padding: 4px 4px 4px 4px;
border-radius: 0px;
border: 0px none rgb(0, 0, 0);
font-size: 16px;
font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 16px;
font-weight: 400;
```

### Button — 4 instances, 2 variants

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(255, 69, 0);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(255, 69, 0);
font-size: 16px;
font-weight: 400;
```

**Variant 2** (3 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 50%;
border: 0px none rgb(16, 10, 13);
font-size: 13.3333px;
font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 12px;
font-weight: 400;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 0px 0px 0px 0px;
border-radius: 0px;
border: 0px none rgb(16, 10, 13);
font-size: 12px;
font-weight: 400;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
background: rgba(0, 0, 0, 0);
color: rgb(16, 10, 13);
padding: 10px 15px 10px 15px;
border-radius: 8px;
border: 0px none rgb(16, 10, 13);
font-size: 13.3333px;
font-weight: 400;
```

## Layout System

**280 grid containers** and **823 flex containers** detected.

### Container Widths

| Max Width | Padding |
| --------- | ------- |
| 1280px    | 0px     |
| 100%      | 0px     |
| 400px     | 0px     |

### Grid Column Patterns

| Columns   | Usage Count |
| --------- | ----------- |
| 3-column  | 198x        |
| 6-column  | 57x         |
| 12-column | 20x         |
| 1-column  | 3x          |
| 8-column  | 1x          |
| 2-column  | 1x          |

### Grid Templates

```css
grid-template-columns: 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px 104.828px;
gap: 2px;
grid-template-columns: 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px;
gap: 2px;
grid-template-columns: 104px 104px 104px 104px 104px 104px 104px 104px 104px 104px 104px 104px;
gap: 0px 2px;
grid-template-columns: 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px;
gap: 9px 2px;
grid-template-columns: 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px 103.156px;
gap: 9px 2px;
```

### Flex Patterns

| Direction/Wrap        | Count |
| --------------------- | ----- |
| column/nowrap         | 46x   |
| row/nowrap            | 772x  |
| column/wrap           | 4x    |
| column-reverse/nowrap | 1x    |

**Gap values:** `0px 2px`, `10px`, `12px`, `16px`, `1px`, `2.5px`, `20px`, `24px`, `2px`, `40px`, `4px`, `4px 2px`, `5px`, `6px`, `6px normal`, `80px`, `8px`, `9px 2px`, `normal 5.25px`

## Accessibility (WCAG 2.1)

**Overall Score: 93%** — 52 passing, 4 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio  | Level | Used On   |
| ---------- | ---------- | ------ | ----- | --------- |
| `#100a0d`  | `#000000`  | 1.07:1 | FAIL  | div (3x)  |
| `#ffffff`  | `#ff4500`  | 3.44:1 | FAIL  | span (1x) |

### Passing Color Pairs

| Foreground | Background | Ratio   | Level |
| ---------- | ---------- | ------- | ----- |
| `#100a0d`  | `#fdfbf9`  | 18.99:1 | AAA   |
| `#100a0d`  | `#ffffff`  | 19.6:1  | AAA   |
| `#100a0d`  | `#e5e5e5`  | 15.56:1 | AAA   |
| `#000000`  | `#ffffff`  | 21:1    | AAA   |
| `#ffffff`  | `#242121`  | 15.98:1 | AAA   |
| `#ffffff`  | `#03000c`  | 20.81:1 | AAA   |
| `#ffffff`  | `#000000`  | 21:1    | AAA   |
| `#fdfbf9`  | `#242121`  | 15.48:1 | AAA   |
| `#ffffff`  | `#121f36`  | 16.47:1 | AAA   |
| `#333333`  | `#ffffff`  | 12.63:1 | AAA   |

## Design System Score

**Overall: 76/100 (Grade: C)**

| Category                  | Score   |
| ------------------------- | ------- |
| Color Discipline          | 85/100  |
| Typography Consistency    | 40/100  |
| Spacing System            | 80/100  |
| Shadow Consistency        | 75/100  |
| Border Radius Consistency | 85/100  |
| Accessibility             | 93/100  |
| CSS Tokenization          | 100/100 |

**Strengths:** Tight, disciplined color palette, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**

- 7 font families — consider limiting to 2 (heading + body)
- 12 distinct font sizes — consider a tighter type scale
- 4 WCAG contrast failures
- 861 !important rules — prefer specificity over overrides
- 84% of CSS is unused — consider purging
- 4020 duplicate CSS declarations

## Z-Index Map

**22 unique z-index values** across 4 layers.

| Layer    | Range           | Elements                                                                                                                                                                                                                                                              |
| -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modal    | 1000,2147483647 | div.h.e.a.d.e.r.-.r.e.w.o.r.k.-.w.r.a.p.p.e.r, header.s.h.o.p.i.f.y.-.s.e.c.t.i.o.n. .s.h.o.p.i.f.y.-.s.e.c.t.i.o.n.-.g.r.o.u.p.-.h.e.a.d.e.r.-.g.r.o.u.p.-.r.e.w.o.r.k.e.d. .h.e.a.d.e.r.-.r.e.w.o.r.k. .i.s.B.a.s.e.S.c.r.o.l.l, ul.d.r.o.p.d.o.w.n.-.o.p.t.i.o.n.s |
| dropdown | 100,600         | div.p.r.o.d.u.c.t.-.f.o.c.u.s. .m.d.:.m.t.-.x.l, img.d.e.f.a.u.l.t.-.i.m.a.g.e, img.c.o.u.n.t.r.y.-.s.p.e.c.i.f.i.c.-.i.m.a.g.e                                                                                                                                       |
| sticky   | 10,99           | span.s.w.i.p.e.r.-.b.u.t.t.o.n.-.p.r.e.v, span.s.w.i.p.e.r.-.b.u.t.t.o.n.-.n.e.x.t, div.s.w.i.p.e.r.-.b.u.t.t.o.n.-.n.e.x.t                                                                                                                                           |
| base     | -100,9          | div, div.s.t.o.r.e.-.l.o.c.a.t.i.o.n.s.-.i.m.a.g.e, div.f.i.e.l.d                                                                                                                                                                                                     |

**Issues:**

- [object Object]

## SVG Icons

**12 unique SVG icons** detected. Dominant style: **outlined**.

| Size Class | Count |
| ---------- | ----- |
| xs         | 7     |
| sm         | 3     |
| md         | 1     |
| xl         | 1     |

**Icon colors:** `#100A0D`, `rgb(0, 0, 0)`, `currentColor`

## Font Files

| Family           | Source      | Weights  | Styles |
| ---------------- | ----------- | -------- | ------ |
| swiper-icons     | self-hosted | 400      | normal |
| BrownStd         | self-hosted | 300, 400 | normal |
| GaramondPremrPro | self-hosted | 400      | normal |
| swym-font        | self-hosted | normal   | normal |

## Image Style Patterns

| Pattern   | Count | Key Styles                                         |
| --------- | ----- | -------------------------------------------------- |
| general   | 13    | objectFit: cover, borderRadius: 0px, shape: square |
| thumbnail | 12    | objectFit: cover, borderRadius: 0px, shape: square |
| hero      | 3     | objectFit: cover, borderRadius: 0px, shape: square |
| gallery   | 1     | objectFit: cover, borderRadius: 0px, shape: square |

**Aspect ratios:** 3:4 (26x), 16:9 (1x), 1:1 (1x), 8.78:1 (1x)

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `BrownStd` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
