---
name: design-system
description: "Manages the At-Tamassok visual language: tokens, themes, typography, and layout. Triggers on: design, tokens, colors, fonts, layout, theme, spacing, visual, CSS, style"
---

# Design System Management

Codifies the visual rules for the At-Tamassok print shop.

## Color System

- Paper: `--bg` -> `#faf9f6`
- Ink: `--ink` -> `rgba(12,11,10,1)`
- Accent: `--btn-accent` -> `#0072BB` (Pantone French Blue)
- Accent Active: `--btn-accent-active` -> `#005a94`
- Essay BG: `#E2E052` (acid yellow)
- Info BG: `#0072BB` (French Blue)
- No raw hex in components — always use CSS variables from `globals.css`

## Typography

- Sans: `--font-sans` -> Favorit
- Serif/Mono: `--font-serif`, `--font-mono` -> Suisse Intl
- Header: Suisse Intl, 17px, 600 weight
- Body: Favorit, 14px, 400 weight
- Price: 30px, standalone
- All sentence case — no `text-transform: uppercase`

## Page Themes

- Default (`/`, `/photos/*`): warm paper bg, ink text
- `/info`: French Blue bg, white text
- `/essay`: acid yellow bg, dark text, paper grain texture
- Header/Footer adapt colors per route

## Layout Rules

- Hero: full-bleed `100dvh`, `object-position: center 30%`
- Photo grid: CSS Grid, hover-reveal price on desktop, always visible on mobile
- Info page: Von Steiner staggered layout
- BuyUI: no breadcrumbs, no paper pills, description always open
