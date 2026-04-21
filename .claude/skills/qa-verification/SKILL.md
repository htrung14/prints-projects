---
name: qa-verification
description: "Runs checks to ensure quality, consistency, and correctness across the full stack. Triggers on: QA, test, verify, check, validate, regression, consistency, build, lint, type-check"
---

# QA Verification Suite

## Build & Lint

- Run: `npm run build && npm run lint`
- Output: PASS/FAIL in QA report with error logs on failure

## Contract Verification

- Compare frontend fetch call types against `src/contracts/` definitions
- Flag any mismatches with file paths and line numbers
- Check that all API routes return shapes matching their contracts

## Data Consistency Sweep

- Cross-reference prices, edition counts, sizes between:
  - `src/data/photos.fixture.json`
  - Supabase tables (if accessible)
  - Stripe products (if accessible)
- Report discrepancies as a table

## Next.js 16 Convention Check

- Verify `src/proxy.ts` exists (not middleware.ts)
- Verify export function name is `proxy` (not `middleware`)
- Check route handlers follow App Router patterns

## Report Format

- Location: `docs-ai/reports/qa-report-YYYY-MM-DD-HHMMSS.md`
- Structure: Overall Status, Summary, Build/Lint, Contracts, Data, Actionable Items
