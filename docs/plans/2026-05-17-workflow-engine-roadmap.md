# HalalFlow Workflow Engine Roadmap — 2026-05-17

> This replaces the closed pre-pivot stock-screener roadmap.
> The hourly Hermes cycle should read this file, pick the **first** unchecked `[ ]` line, implement only that item, verify it, then mark it done and append an execution-log row.
> Target cron: `292210eaf040` (HalalFlow Hourly Build — Claude Code).

## Cycle protocol

1. Read this file top to bottom. Pick the first `[ ]` line.
2. Implement only that one line. Keep the change surgical.
3. Run `npm run build` from `/home/naim/.openclaw/workspace/halalflow`.
4. If green, change `[ ]` → `[x]` on that line and append a row to the execution log.
5. If the change needs >3 files or >150 LOC, split it into a sub-plan first.
6. Do not commit unless a line explicitly says to commit.

## Current product snapshot

HalalFlow is now an Islamic finance workflow engine with these live surfaces:

- Org / membership / session flow
- Workflow templates and ordered template steps
- Workflow instances with approvals, comments, and audit logs
- Template and workflow API routes already in place

## First small improvements

- [x] Add email notifications when a workflow step is approved or rejected.
- [ ] Enforce who may approve a step based on org membership / role rules.
- [ ] Add workflow template import/export as JSON for portability.
- [ ] Add multi-org switching support in the session and UI.
- [ ] Write a deployment guide for production Postgres instead of SQLite.

## Notes for future cycles

- Keep the implementation lane small and leave the closed stock-screener roadmap alone.
- If a task grows beyond the current lane, write a dedicated sub-plan under `docs/plans/` and link it here.
- Prefer shipping one safe workflow-engine improvement per cron run.

---

## Execution log

| Cycle UTC | Item | Status | Notes |
|---|---|---|---|
| 2026-05-17T00:00Z | Create workflow-engine roadmap | done | Fresh roadmap drafted after closing the stock-screener era. First unchecked item is email notifications on approve/reject. |
| 2026-05-17T16:12Z | Add email notifications when a workflow step is approved or rejected. | done | Added Resend-backed optional email helper, wired `/api/workflows/[id]/approve` to notify workflow creator + org admins/owners, documented `RESEND_API_KEY` and `HALALFLOW_EMAIL_FROM`, and verified `npm run build`. |
