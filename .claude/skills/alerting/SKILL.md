---
name: alerting
description: "Performs health checks and sweeps for critical issues like regressions, data drift, and security risks. Triggers on: alert, monitor, sweep, audit, check health, regression, drift, security scan"
---

# Alerting & Monitoring Sweep

## Build Monitoring

- Check latest build status on main branch
- Alert if main branch build is failing

## Type Error Detection

- Run `npm run build` and analyze for new type errors
- Alert if error count has increased since last successful run

## Contract Drift Detection

- Compare frontend fetch types against backend `src/contracts/` definitions
- Alert if any drift detected (could indicate breaking change)

## Data Consistency (Critical)

- Cross-reference prices, editions, sizes between fixture, Supabase, Stripe
- Alert format: "CRITICAL: Price mismatch for AT-025. Fixture: $300, Stripe: $350"

## Env Var Audit

- Scan codebase for hardcoded keys (`sk_live_`, `pk_test_`)
- Check `NEXT_PUBLIC_` vars don't contain secrets
- Alert on any finding

## Dependency Health

- Run `npm outdated` for stale dependencies
- Flag major version differences

## Report Location

- `docs-ai/reports/alert-sweep-YYYY-MM-DD.md`
