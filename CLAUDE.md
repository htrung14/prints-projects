@AGENTS.md

## Harness: At-Tamassok Print Shop

**Goal:** Coordinate full-stack development (design, frontend, backend, QA, alerting) for the At-Tamassok print shop using a spec-gated fan-out pipeline.

**Trigger:** For any build/implement/fix/deploy task, use the `print-shop-orchestrator` skill. For simple questions or small edits, respond directly.

**PAL Integration:** Use PAL MCP tools as the primary workhorse — `/pal:planner` for task decomposition, `/pal:thinkdeep` for architecture, `/pal:apilookup` for API reference, `/pal:challenge` for stress testing, `/pal:consensus` for multi-model decisions, `/pal:codereview` for code review.

**Change Log:**
| Date | Change | Target | Reason |
|------|--------|--------|--------|
| 2026-04-20 | Initial harness setup | All | Full-stack pipeline with 5 agents + 6 skills |
