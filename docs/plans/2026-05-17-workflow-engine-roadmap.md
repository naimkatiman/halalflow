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
- [x] Enforce who may approve a step based on org membership / role rules.
- [x] Add workflow template import/export as JSON for portability.
- [x] Add multi-org switching support in the session and UI.
- [x] Write a deployment guide for production Postgres instead of SQLite.

## Next features

- [ ] PDF receipt generation for approved workflows.  
  **Status:** sub-plan drafted at `docs/plans/2026-06-07-pdf-receipt-generation.md`. Hourly cycles should pick Lane 1 first.
- [ ] Hosted SaaS (cloud.halalflow.app).

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
| 2026-05-23T14:15Z | Enforce who may approve a step based on org membership / role rules. | done | Initial enforcement: blocked workflow creators from approving their own workflows (API returns 403, UI hides approval buttons). Future cycles can extend to per-role or per-step assignment rules. |
| 2026-05-23T18:15Z | Add workflow template import/export as JSON for portability. | done | Export already existed; added POST /api/templates/import that accepts the exported JSON shape, validates with zod, and creates a template with steps. Added ImportButton to /templates list page. Verified npm run lint and npm run build green. |
| 2026-05-23T18:15Z | Add multi-org switching support in the session and UI. | done | Already implemented in prior cycles: /api/orgs/[id]/switch updates session orgId/orgRole, and OrgSwitcher UI on /settings lets users switch orgs. Verified present in build output. |
| 2026-05-23T19:15Z | Write a deployment guide for production Postgres instead of SQLite. | done | Added docs/deployment.md with step-by-step Postgres migration, env var changes, migrate/deploy/seed flow, Railway and generic host guidance. Verified npm run lint and npm run build green. |
