---
name: designlang-tokens
description: Use when styling UI for www.lemaire.fr — references the extracted design system tokens instead of inventing colors, spacing, or typography.
---

# designlang tokens

Source: https://www.lemaire.fr/
Extracted by designlang v7.0.0 on 2026-04-19T17:58:10.473Z

## Semantic tokens (use these)

- color.action.primary: #100a0d
- color.surface.default: #fdfbf9
- color.text.body: #000000
- radius.control: 4px
- typography.body.fontFamily: BrownStd

## Regions

- nav
- nav
- nav
- content
- content
- hero
- content
- content
- content
- content
- pricing
- footer

## How to use

- Prefer `semantic.*` tokens over `primitive.*`.
- Never invent new tokens or hex values; reuse the ones above.
- When a value is missing, pick the closest existing semantic token and flag the gap.
- Reference tokens by their dotted path (e.g. `semantic.color.action.primary`).
