---
name: print-shop-orchestrator
description: "Coordinates multi-agent workflows for the At-Tamassok print shop. Use for any task involving building, fixing, or updating features. Triggers on: build feature, implement, add page, fix bug, update, deploy, print shop, at-tamassok, redesign, refactor"
---

# Print Shop Orchestrator

Coordinates Design, Frontend, Backend, QA, and Alerting agents for the At-Tamassok print shop. The main orchestrator (Claude) has final say on all decisions, but delegates heavy lifting to PAL tools.

## Execution Model

**I (Claude) am the orchestrator.** I use PAL MCP tools as the primary workhorse:

- `/pal:planner` — break down complex tasks into agent-ready work items
- `/pal:thinkdeep` — reason through architectural decisions
- `/pal:apilookup` — look up Stripe, Supabase, Next.js APIs
- `/pal:challenge` — stress-test proposed implementations
- `/pal:consensus` — get multi-model opinions on design/architecture decisions
- `/pal:codereview` — review generated code before committing

## Phase 0: Context & Scoping

1. Analyze the user's request
2. Check for existing `_workspace/` directory (partial rerun?)
3. Read latest `docs-ai/session-handoff-*.md` for context
4. Use `/pal:planner` to decompose the task into agent work items

## Phase 1: Design Spec Gate

1. Engage Design Agent to produce/update specs
2. Artifacts: `docs-ai/specs/design/tokens.md`, `page-themes.md`
3. Gate: specs contain all necessary info for the task

## Phase 2: Contract Gate

1. Engage Backend Agent to define API contracts
2. Use `/pal:apilookup` for Stripe/Supabase API shapes
3. Artifact: files in `src/contracts/`
4. Gate: typed contract exists for every data boundary

## Phase 3: Fan-Out (Parallel Implementation)

- **Frontend:** builds UI components and pages
- **Backend:** implements server-side logic
- Both work against the contracts from Phase 2
- Use `/pal:chat` to delegate implementation to external models

## Phase 4: QA Verification Loop

1. QA Agent runs verification suite
2. Contract matching, design token compliance, data consistency
3. Build/lint/type checks
4. Use `/pal:codereview` on all new code
5. Loop: issues → route back to agent → re-verify (max 3 loops)

## Phase 5: Alerting Sweep

1. Alerting Agent performs full health check
2. Data drift, env var leaks, stale dependencies
3. Use `/pal:challenge` to stress-test edge cases
4. High-severity alerts block completion

## Error Handling

- Gate failure: halt and report missing prerequisite
- QA loop > 3x: escalate for user review
- Use `/pal:consensus` for ambiguous architectural decisions

## Test Scenarios

**Happy path:** User requests "add a new product page" → Design spec → Contract → Frontend + Backend → QA pass → Alert sweep clean
**Error path:** Contract drift detected in Phase 4 → Backend fixes → QA re-runs → passes on second loop
