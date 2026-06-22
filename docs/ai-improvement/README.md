# MosRev / halalflow — AI Improvement Baseline

Last updated: 2026-06-22 19:48 MPST (+0800)
Run type: recurring improvement baseline + verification baseline + narrow lint fixes + dependency audit triage + cron/operator doc alignment + landing image optimization + dynamic image policy note + pure-helper characterization tests + local-ahead dirty-tree handoff refresh + remote-clean verification checkpoint + source-review metrics packet + post-metrics verification checkpoint refresh

Code changes this run: none. This run refreshed the docs-only post-metrics verification checkpoint for the existing local-ahead dirty tree instead of creating a duplicate metrics packet or adding runtime work. `git fetch --prune` kept `main...origin/main [ahead 1]`; merge-base `a7b8d034c0c69de409be8c9f6c963ee82649d96a`; `originChangedPathCount=0`; `trackedDirtyPathCount=13`; `untrackedPathCount=1`; `dirtyPathCount=14`; and `dirtyOriginOverlapCount=0`. The unchanged dirty lanes remain: local commit `a2a5447` (AI docs plus pure-helper tests), source/runtime + lockfile lane (`6` files / `65` insertions / `34` deletions), operator-doc lane (`3` files / `167` insertions / `78` deletions), and AI tracking/status docs plus the untracked metrics packet. Fresh verification remained green: `package.json` parse, `npm test` passed `12` files / `83` tests in `946ms`, `npm run lint` exited `0` with the known four dynamic image warnings, `npx tsc --noEmit` exited `0`, `npm run build` exited `0` after compiling in `3.5s` and finishing TypeScript in `9.7s` with the known local missing-`DATABASE_URL` Prisma page-data warning, and focused source/test/config `pygount` reported `202` files / `12,845` code / `759` comments. Metrics and green checks remain review aids only; they do not approve, push, deploy, or prove the accumulated local diffs behavior-preserving.

## Executive Summary

MosRev is a Next.js 16 / Prisma 6 multi-tenant SaaS for masjid and Islamic community organizations. Its core value is a transparent approval workflow and audit trail for money-related decisions, extended with a public mosque directory, facility rental requests, manual bank-transfer receipt flow, trial/billing lifecycle, demo mode, and fund-segregated finance records.

The repository is already beyond a simple MVP: it includes org membership, role-gated approvals, row-level-security architecture, Stripe subscription hooks, demo-mode email outbox, public booking/token status pages, receipt image upload infrastructure, Bahasa Malaysia customer flows, and a growing set of pure-domain Vitest tests.

First-run inspection found no existing `docs/ai-improvement/` folder, so the initial safe action was to create this baseline. The next recurring run completed the highest-value documentation/DX increment: `README.md` and `docs/deployment.md` now reflect PostgreSQL, RLS role provisioning, `DATABASE_URL`, `DATABASE_URL_ADMIN`, `DIRECT_URL`, and the live RLS verification script. The following run repaired the reproducible dependency path: `npm ci` initially failed because `package-lock.json` was stale, `npm install` synced the lockfile, subsequent `npm ci` succeeded, 57 Vitest tests passed, and TypeScript `--noEmit` passed. The lint-focused runs removed the morph progress hook's React refs blocker, the theme toggle's synchronous set-state-in-effect blocker, and the language toggle's cookie-write immutability blocker without changing public behavior. Current verification: `npm run lint` exits 0 with four remaining `@next/next/no-img-element` warnings, 83 Vitest tests pass, TypeScript `--noEmit` passes, and the last recorded `npm run build` baseline exits 0 while still printing the pre-existing missing-`DATABASE_URL` Prisma page-data warning. The 2026-06-18 08:15 run added a docs-only dependency audit triage artifact: full audit remains red with 5 low/moderate findings, runtime audit remains red on Next's nested PostCSS path, and `npm audit fix --force` remains explicitly blocked because npm proposes a breaking `next@9.3.3` downgrade. The 2026-06-18 11:41 run aligned `docs/cron.md` so operators no longer see the old SQLite-volume/5-minute-default cron guidance as the active Railway path. The 2026-06-18 16:11 and 18:15 runs continued image-warning polish by moving two static landing image surfaces to `next/image` without changing visible copy, layout intent, routes, data, or dependencies. The 2026-06-18 21:33 run documented the dynamic tenant/directory image policy decision surface before any remaining `photoUrl` rendering changes, because those sources can be local bundled images or arbitrary `https://` URLs and `next.config.ts` has no image remote allowlist. The 2026-06-18 23:52, 2026-06-19 03:06, and 2026-06-19 05:02 runs expanded pure-helper coverage with money-formatting/parsing, role-hierarchy, and API-error-message characterization tests, bringing the full Vitest baseline to 12 files / 83 tests. The 2026-06-19 06:16 run did not add more code; it created a source-diff stabilization handoff because the working tree now contains accumulated uncommitted docs/source/lockfile/test lanes that should be reviewed before new runtime work.

## Product Thesis

Masjid committees, treasurers, secretaries, and AJK members need a simple shared system of record for approvals, receipts, facility bookings, rental income, and handover continuity. Today those flows often live across WhatsApp, paper forms, informal bank-transfer notes, and volunteer memory. MosRev can win by being the boring, trustworthy operating layer for community-org accountability:

- **For treasurers and secretaries:** fewer missing receipts, clearer approvals, easier reporting.
- **For committee members and approvers:** mobile-first status visibility and fast decisions.
- **For the public:** easier facility discovery, transparent request/payment status, and fewer office-counter trips.
- **For donors/auditors/state bodies:** better auditability and institutional memory.
- **For the business:** a focused hosted SaaS path for Malaysian masjids while preserving free self-hosting.

The strongest near-term wedge is not a broad super-app. It is the facility-rental and approval/audit workflow where the value is immediate: income capture, slot coordination, payment proof, and finance records.

## Current Repo Map

### Product/documentation sources

- `README.md` — public overview, stack, quickstart, current feature list.
- `docs/PRD.md` — living product requirements and explicit non-goals.
- `docs/ROADMAP.md` — 7-year roadmap through 2033.
- `docs/demo-mode.md` — demo runbook, billing simulation, tempah customer journey.
- `docs/deployment.md` — production deployment guide aligned on 2026-06-18 with the current Postgres/RLS three-URL implementation.
- `docs/cron.md` — Railway cron guide aligned on 2026-06-18 with the live `/api/cron/trial-emails` route, daily schedule, source-of-truth files, and Postgres/RLS deployment posture.
- `docs/ai-improvement/dependency-audit-triage.md` — docs-only 2026-06-18 audit map for current `npm audit` findings, non-force dry-run preview, risk interpretation, and owner/Fatin approval boundaries.
- `docs/ai-improvement/image-surface-decision-note.md` — docs-only 2026-06-18 decision note for the four remaining dynamic `photoUrl` image-warning surfaces, Next image constraints, provider/remote-pattern options, and owner/Fatin approval boundaries.
- `docs/ai-improvement/uncommitted-source-verification-handoff.md` — docs-only 2026-06-22 03:48 handoff checkpoint for the local ahead commit, remaining dirty working tree, source-review metrics packet, and remote-clean merge-base/overlap evidence.
- `docs/ai-improvement/source-review-metrics.md` — docs-only 2026-06-22 review packet/checkpoint with dirty-path overlap, local-ahead path set, source/runtime churn, operator-doc churn, source/test/config `pygount` metrics, and review sequencing.
- `docs/ai-improvement/verification-command-matrix.md` — docs-only 2026-06-22 03:48 command matrix for reviewing local ahead commit `a2a5447`, the current uncommitted source/docs/lockfile/tracking lanes, the metrics packet, and remote-clean evidence before new runtime work.
- `docs/superpowers/specs/*` and `docs/superpowers/plans/*` — detailed feature design/implementation notes.
- `mosrev-build-context.md` — older build context; useful for intent, but contains clearly stale environment facts from 2026-06-09.

### App/runtime structure

- `package.json` — Next.js app scripts: `dev`, `build`, `start`, `lint`, `test`, Prisma migrate/seed, and `postinstall` client generation.
- `src/app/` — Next.js 16 App Router pages and route handlers.
  - Public: landing, `/masjid`, `/masjid/[slug]`, `/masjid/[slug]/book`, `/masjid/[slug]/tempah/[token]`, `/ramadan`.
  - Authenticated: dashboard, workflows, templates, settings, facilities, bookings, finance, community, billing, demo outbox.
  - API: auth, orgs, workflows, templates, facilities, bookings, public bookings, ledger, community, uploads, billing, Stripe webhook, cron trial emails, health, CSRF.
- `src/components/` — shared nav/theme/logo/UI primitives plus landing and morph icon components.
- `src/lib/` — core domain and infrastructure helpers:
  - `db.ts` dual Prisma clients and `withOrg()` RLS transaction context.
  - `session.ts`, `csrf.ts`, `roles.ts`, `require-subscription.ts` auth/session/security gates.
  - `bookings.ts`, `availability.ts`, `booking-pricing.ts`, `booking-codes.ts`, `ledger.ts`, `upload.ts` domain helpers.
  - `notifications/*` email builders and demo outbox-backed sending path.
  - `i18n/*` dictionaries and locale provider.
- `prisma/` — schema, seed, RLS role provisioning, and migrations.
- `scripts/rls-isolation-check.ts` — live RLS isolation script using real `withOrg`, `prisma`, and `prismaAdmin` helpers.
- `src/**/*.test.ts` — Vitest coverage for booking transitions, availability, booking codes, pricing, ledger, upload validation, i18n, notifications, morph interpolation, money formatting/parsing, and role hierarchy checks.

### Codebase size snapshot

Measured with `pygount 3.2.0` on 2026-06-19 18:55 MPST, excluding dependency/build folders:

| Language | Files | Code | Comment |
|---|---:|---:|---:|
| TSX | 85 | 7,193 | 170 |
| TypeScript | 99 | 5,076 | 437 |
| YAML | 1 | 1,488 | 0 |
| Transact-SQL | 9 | 381 | 134 |
| CSS+Lasso | 1 | 113 | 18 |
| JSON | 2 | 61 | 0 |
| JavaScript | 2 | 11 | 3 |
| XML | 1 | 11 | 1 |
| TOML | 1 | 8 | 0 |
| Markdown | 30 | 0 | 2,740 |
| Total | 254 | 14,342 | 3,503 |

## Detected Patterns

- **Next.js 16 App Router:** server components by default; client interactions opt into `"use client"`. Feature specs note awaited `params`/`searchParams` for Next 16 route/page conventions.
- **Security headers at framework edge:** `next.config.ts` disables the powered-by header and sets frame, content-type, referrer, permissions, HSTS, and CSP headers.
- **Tenant isolation:** app traffic uses least-privilege `prisma`; all tenant-scoped work is expected to happen inside `withOrg(orgId, fn)`, which sets `app.current_org_id` transaction-locally. Cross-org provisioning, invites, public directory reads, and Stripe webhooks use `prismaAdmin` with application-layer scoping.
- **Defense-in-depth org filters:** even with RLS, route handlers commonly include explicit `where: { orgId: session.orgId }` filters.
- **Authenticated API mutation pattern:** iron-session guard → active org guard → subscription check → CSRF validation/rotation → zod parse → `withOrg` transaction → JSON result with `Cache-Control: no-store`.
- **Public booking pattern:** no login/CSRF; uses public token/status URLs, rate limiting/honeypot, zod validation, `prismaAdmin`, and explicit published/active filters.
- **Billing philosophy:** Stripe/subscription logic is optional; self-hosters should not be locked out when billing keys are absent. Demo mode simulates billing/email paths without real Stripe/Resend keys.
- **Money model:** integer sen in the database; MYR formatting/parsing in helpers.
- **Domain logic placement:** business-rule-heavy state machines and validators live in pure `src/lib/*` modules with Vitest tests.
- **Copy/user flow:** newer customer-facing booking work is Bahasa Malaysia-first; main product has an i18n foundation and English/Malay dictionaries.
- **Docs-before-large-work culture:** feature specs/plans are detailed and explicitly track goals, non-goals, risks, and phasing.

## Guardrail Assessment

### Safe autonomous work

- Update or add docs, runbooks, repo maps, backlog items, and implementation logs.
- Add or refine small tests around pure helpers where the existing Vitest pattern is clear.
- Improve comments, error messages, and developer-experience docs without changing business behavior.
- Make tiny type-safety or validation fixes only after reading current Next.js 16 docs and existing adjacent patterns.

### Approval required before implementation

- Prisma schema changes, migrations, RLS policy changes, or seed behavior changes.
- Auth/session/authorization, CSRF, public-token access rules, upload privacy, or payment/billing changes.
- Stripe, Resend, production env var, deployment target, Railway/service, or cron/scheduler changes.
- Business-rule changes to booking status transitions, payment confirmation, trial enforcement, role hierarchy, pricing, or public booking rules.
- New large dependencies, object-storage adoption, online booking payments, CAPTCHA/Turnstile, broad refactors, file renames, UI redesigns, or framework upgrades.
- Anything the PRD/specs list as a non-goal or deferred item, such as two-sided marketplaces, payouts, native mobile apps, or custom domains.

## Risks and Technical Debt

1. **Active local-ahead/source-diff stabilization required:** the 2026-06-22 03:48 post-metrics checkpoint found `main...origin/main [ahead 1]` via local commit `a2a5447` (AI docs plus pure-helper tests), 13 tracked modified files, and one untracked review artifact (`docs/ai-improvement/source-review-metrics.md`). `git fetch --prune` plus merge-base probing still found `origin/main` changed-path count `0` and dirty/origin overlap `0`, so the next review can focus on local-lane decisions rather than remote-conflict triage. `docs/ai-improvement/source-review-metrics.md` and `docs/ai-improvement/uncommitted-source-verification-handoff.md` remain the controlling review aids; do not layer new runtime work until owner/Fatin or a maintainer reviews, splits, pushes, commits, adjusts, or reverts the accumulated lanes.
2. **Verification baseline is currently green but not a substitute for review:** current checks pass (`package.json` parse: exit 0; `npm test`: 12 files / 83 tests in 1.07s; `npm run lint`: exit 0 with 4 known image warnings; `npx tsc --noEmit`: exit 0; `npm run build`: exit 0 with the pre-existing local missing-`DATABASE_URL` Prisma page-data warning; focused source/test/config `pygount`: 202 files / 12,845 code / 759 comments). These commands prove the current local-ahead dirty tree still builds locally and is easier to size for review; they do not prove the full diff is behavior-preserving or ready to push.
3. **Lint baseline is green with warnings:** the 2026-06-18 03:11, 04:51, and 06:36 runs removed the three React lint errors from `src/lib/morph/useMorph.ts`, `src/components/ThemeToggle.tsx`, and `src/components/LanguageToggle.tsx`. The 2026-06-18 16:11 and 18:15 runs replaced the two static public landing image `<img>` surfaces with `next/image`. Full `npm run lint` now exits 0 and reports 4 remaining `@next/next/no-img-element` warnings in authenticated facility cards and public masjid directory/profile image surfaces; `docs/ai-improvement/image-surface-decision-note.md` maps why those dynamic `photoUrl` surfaces need a provider/remote-pattern/no-op decision before code changes.
4. **Dependency audit is triaged but not remediated:** `docs/ai-improvement/dependency-audit-triage.md` records `npm audit --audit-level=low` exit 1 with 5 vulnerabilities (2 low, 3 moderate) across `@babel/core`, `esbuild`, `js-yaml`, nested `postcss`, and `next`; `npm audit --omit=dev --audit-level=low` remains red on the production Next/PostCSS path. The non-force dry-run previews 25 package changes, but the forced PostCSS remediation still proposes a breaking `next@9.3.3` downgrade, so do not run `npm audit fix --force` autonomously.
5. **Residual stale historical docs:** `README.md`, `docs/deployment.md`, and `docs/cron.md` were aligned on 2026-06-18 with the current Postgres/RLS three-URL architecture and Railway cron posture, but older context files such as `mosrev-build-context.md` may still preserve stale environment facts. Treat `.env.example`, `prisma/schema.prisma`, `prisma/rls-roles.sql`, `src/lib/db.ts`, `docs/deployment.md`, and `docs/cron.md` as the current setup source of truth.
6. **RLS is load-bearing:** `withOrg()` and RLS policy coverage are central to trust. The live isolation script exists, but the package scripts do not expose it as an obvious check.
7. **Public booking/payment is trust-sensitive:** token access, receipt image serving, overlap guards, office payment confirmation, and ledger posting all touch user trust. Changes here need narrow tests and likely owner approval if rules change.
8. **Demo mode can be dangerous if misused:** docs correctly warn that the demo outbox is global and should be throwaway-only. Production environment controls must keep demo mode out of real deployments.
9. **Postgres byte image storage is acceptable for v1 but not infinite:** `UploadedImage` keeps QR/receipt bytes in the database. This preserves self-hosting and avoids credentials, but a later object-storage abstraction may be needed when volume grows.
10. **Brand/name drift:** repo path `halalflow`, package name `mosrev`, docs mention both MosRev and HalalFlow. Intent appears to be MosRev productization, but brand consistency should be tightened carefully.
11. **Next.js version sensitivity:** AGENTS.md and specs warn that this is Next.js 16 with changed conventions. Any route/page/middleware code edits must read local `node_modules/next/dist/docs/` first.

## 30-Year Roadmap

This extends the existing 7-year roadmap without replacing it. The first seven years in `docs/ROADMAP.md` remain the controlling plan; later horizons are strategic direction, not committed scope.

### Years 1–2: Paid pilot trust loop

- Onboard and support first Malaysian masjid pilots by hand.
- Harden facility rental, approval workflows, receipt/audit exports, and subscription operations.
- Make local/deploy verification boring and repeatable.
- Exit signal: paying orgs, real activation, no cross-tenant incidents, and pilot friction list shrinking.

### Years 3–5: Treasurer operating system

- Budgeting, annual reports, read-only auditor seats, pending-approval nudges, and recurring workflows.
- Donation/fund recording without premature money movement.
- Council/template-pack network effects only after single-org value is retained.

### Years 6–10: Regional community finance platform

- Malaysia-first depth, then Singapore/Brunei/Indonesia expansion based on language, payment rails, and compliance cost.
- Optional mobile/PWA notification investments only if usage data proves it is the activation blocker.
- Federation/council dashboards and read-only APIs for accountants/governance partners.

### Years 11–15: Institutional trust infrastructure

- Standardized community-org audit trail exports.
- Public security/compliance posture, penetration testing cadence, and partner ecosystem.
- Enterprise self-host tier with SSO, retention controls, and support SLAs while preserving free self-hosting.

### Years 16–20: Open network and resilient governance

- Interoperability with accounting, council, donation, and donor-reporting systems.
- Open templates and policy packs maintained by trusted institutions.
- Strong succession-proof operations: low bus factor, documented playbooks, and clear data portability.

### Years 21–25: Intelligence layer with human accountability

- Assistive analytics for anomaly detection, late approvals, missing receipts, and fund health.
- AI should draft, reconcile, and explain; humans approve money movement and policy decisions.
- Maintain transparent auditability over opaque automation.

### Years 26–30: Public-good infrastructure

- Become a default accountability substrate for Islamic community organizations and adjacent NGOs.
- Publish durable open standards and archival formats that survive vendor and founder turnover.
- Optimize for trust, continuity, and institutional memory over speculative expansion.

## Prioritized Backlog

| Priority | Initiative | Horizon | Type | User Value | Business Value | Technical Value | Risk | Suggested Action | Verification |
|---|---|---|---|---|---|---|---|---|---|
| P0 | Stabilize the current local-ahead commit and remaining source/docs/lockfile/tracking diff before new runtime work | Immediate | Developer Experience / Stability / Governance | Avoids surprise regressions from stacked unreviewed changes | Keeps pilot/readiness work reviewable and commit-ready | Separates the local AI/test commit, docs, lockfile, lint, image, and AI tracking/status lanes for safer review | Medium until reviewed | Use `docs/ai-improvement/source-review-metrics.md`, `docs/ai-improvement/uncommitted-source-verification-handoff.md`, and `docs/ai-improvement/verification-command-matrix.md` to decide `a2a5447` keep/push/amend/reset first, then split keep/adjust/revert/commit decisions for the remaining working tree; do not add new source changes first | `git status --short --branch --untracked-files=all`; `git show --stat HEAD --`; source-review metrics read-back; lane-specific targeted tests/lint/typecheck/build; read-back/static checks |
| P0 | Maintain setup/deployment docs against current Postgres + RLS reality | Immediate | Documentation / Developer Experience | Reduces setup confusion for operators | Lowers deployment/support risk | Prevents stale SQLite/one-URL instructions from causing bad deploys | Low | `README.md` and `docs/deployment.md` were updated on 2026-06-18; only edit again when env/schema changes or stale public setup copy is found | Read-back docs; search README/deployment for stale SQLite/file DB setup references; run exact setup commands when dependencies/DB are available |
| P0 | Maintain reproducible local verification baseline | Immediate | Developer Experience / Stability | Faster safer fixes | Enables daily improvements without guessing | Makes `npm ci`, tests, lint, and typecheck reliable | Low | `package-lock.json` was synced on 2026-06-18 so `npm ci` now passes; keep the lockfile aligned with `package.json` | `npm ci`, `npm test`, and `npx tsc --noEmit` pass |
| P0 | Keep lint baseline green and handle remaining image warnings separately | Immediate | Developer Experience / Stability / Performance | Reduces UI regression risk and page-weight surprises | Keeps CI/review gates usable | Restores ESLint as a reliable guardrail | Low-Medium | The three React lint errors and the two static landing image warnings were fixed on 2026-06-18; the dynamic tenant/directory image decision note now documents remaining `photoUrl` provider/remote-pattern/no-op options before any runtime rendering change | `npm run lint`, targeted UI review, `npm test`, `npx tsc --noEmit`, and `npm run build` when image/component behavior changes |
| P0 | Triage and remediate low/moderate npm audit findings without force downgrades | Immediate | Security / Developer Experience | Reduces exposure in dev/build/runtime dependencies | Improves buyer/operator confidence | Keeps dependency risk visible | Medium | Triage artifact created on 2026-06-18; next run should either keep monitoring or attempt a separate non-force `npm audit fix` maintenance increment with full verification. Never run `npm audit fix --force` because it proposes a breaking Next downgrade | `npm audit --audit-level=low`; `npm audit --omit=dev --audit-level=low`; `npm ci`, lint, tests, typecheck, build after any lockfile change |
| P0 | Maintain Railway cron/operator guide against live Postgres + RLS deployment reality | Immediate | Documentation / Operations | Prevents missed or duplicate trial lifecycle emails | Reduces operator confusion during launch | Keeps cron, env, and deployment assumptions aligned | Low | `docs/cron.md` was aligned on 2026-06-18; only edit again when cron routes, schedules, deployment target, or env gates change | Read-back docs; search active cron docs for stale SQLite/5-minute-default guidance; verify no `vercel.json` unless deployment target changes |
| P1 | Expose RLS isolation check as an obvious script | Near-term | Security / Automation | Protects tenant trust | Reduces catastrophic cross-tenant risk | Keeps live isolation check discoverable | Medium; touches scripts/package | Add package script only after verifying env requirements and owner approval if it affects CI | Run against disposable Postgres; verify PASS output |
| P1 | Audit public booking receipt/upload access paths | Near-term | Security / Stability | Protects customer payment proofs | Reduces privacy/support risk | Confirms token/admin access boundaries | Medium | Read upload route and add focused tests if gaps are pure/helper-level | Unit/integration tests for authorized vs unauthorized image access |
| P1 | Document brand naming decision | Near-term | Product / Documentation | Clearer product identity | Better marketing and onboarding | Reduces contributor confusion | Low | Add a short naming note: repo `halalflow`, product `MosRev`, legacy refs | Docs read-back; search for stale public-facing copy |
| P2 | Make demo-mode production guardrails more explicit | Near-term | Security / Operations | Avoids confusing real users with demo state | Protects brand trust | Clarifies safe demo deployment practices | Low | Add checklist to demo/deployment docs | Read-back; no behavior change |
| P2 | Expand pure-domain tests around authorization, booking, and payment edge cases | Near-term | Stability / Security | Fewer approval/payment surprises | Higher confidence selling rental and approval workflows | Locks critical state-machine and role-gate behavior | Medium if behavior changes; low if characterizing current behavior | `src/lib/money.test.ts`, `src/lib/roles.test.ts`, and `src/lib/api-errors.test.ts` now cover money parsing/formatting, role hierarchy, and Zod error-message rendering; after source-diff stabilization, next characterize another untested pure helper without changing source | `npm test` green; targeted helper test; `npm run lint`; `npx tsc --noEmit` |
| P2 | Add operator runbook for first five pilot masjids | Near-term | Product / Customer Success | Faster onboarding and fewer support calls | Improves activation | Captures repeatable manual process | Low | Create docs/runbook covering profile publish, facilities, QR upload, booking, finance export | Read-back; pilot dry run |
| P3 | Review i18n coverage for public tempah flow | Medium-term | UX / Localization | Better Malay/English fit for diverse users | Improves conversion | Reduces hardcoded copy drift | Medium | Inventory inline Bahasa copy and plan gradual dictionary migration | Static inventory; no UI behavior change |
| P3 | Add analytics/event plan for activation metric | Medium-term | Product Analytics | Helps improve user journey | Measures activation and retention | Defines data before instrumentation | Medium; instrumentation approval needed | Draft tracking plan only first | Docs review; no data collection yet |
| P4 | Object-storage abstraction for uploaded images | Later | Platform / Performance | Faster receipt/QR handling at scale | Lower DB growth risk | Decouples storage backend | High; new infra/credentials | Do not implement without approval and volume evidence | Architecture proposal; load/storage estimate |
| P4 | Online booking payment rails | Later | Payments / Product | Easier customer payments | Potential revenue and conversion upside | Adds settlement complexity | High; payments/compliance | Approval-required discovery only | Legal/compliance/payment-provider review |

## Recommended Next Move

Next safe increment: stabilize the current local-ahead commit and remaining uncommitted working tree before adding more runtime code. The 11:48 post-metrics checkpoint again found no current `origin/main` changed-path conflict with the dirty lanes, but this is not approval of local diffs. Use `docs/ai-improvement/source-review-metrics.md` plus `docs/ai-improvement/uncommitted-source-verification-handoff.md` to decide the disposition of local commit `a2a5447` first, then split the remaining tracked diffs into review lanes (operator docs, lockfile, React lint/source stabilization, static landing image conversions, and AI tracking/status docs) with the commands in `docs/ai-improvement/verification-command-matrix.md`.

Only after that stabilization should autonomous work resume on test coverage or dependency/image-policy lanes. The previous safe candidates remain valid but secondary: characterize another pure helper in `src/lib/`, run an owner/Fatin-approved non-force dependency maintenance increment, or act on `docs/ai-improvement/image-surface-decision-note.md` without changing dynamic image policy autonomously.

If owner/Fatin review is unavailable, keep the next scheduled run docs-only: refresh the metrics/handoff with current status and verification rather than adding source changes on top of the existing local-ahead dirty tree.
