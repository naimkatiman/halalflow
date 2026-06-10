# MosRev completion + UI/UX uplift → PR

> Plan doc for the integration branch `worktree-mosrev-integration`.
> Base = local `main` (44 commits ahead of origin) + cherry-picked mosrev Phases 1–2.
> Goal: finish MosRev multi-tenancy (2b, 3, 4-code, 5), polish UI/UX, ship to a reviewable PR.
> Hold the production DB cutover for explicit human go-ahead (irreversible).

## State at start (verified 2026-06-10)
- DB: dockerized Postgres `mosrev-pg` :5455, volume `mosrev-pg-data` intact. Roles
  `mosrev_app` (RLS) + `mosrev_admin` (BYPASSRLS) exist; passwords reset this session,
  stored only in the ephemeral job dir. 2 migrations applied, schema up to date.
- Phases 1–2 done: Postgres + RLS + `src/lib/db.ts` (`prisma`, `prismaAdmin`, `withOrg`).
- App is **non-functional** until 2b: the app role is RLS-enforced, so any query not run
  through `withOrg` returns zero rows (fails closed).

## Phase 2b — scope every query to the active org (CRITICAL PATH)
Canonical transform (gold reference = `src/app/api/workflows/route.ts`):
wrap DB calls in `withOrg(session.orgId, async (tx) => { ... })`, `prisma.` → `tx.`,
keep CSRF/zod/auth guards OUTSIDE the transaction. Keep existing app-layer
`where: { orgId }` filters as defense-in-depth.

### Query categorization (load-bearing — do NOT guess per-file)
| Category | Client | Files |
|---|---|---|
| **A — org-scoped, id from `session.orgId`** | `withOrg(session.orgId, tx => …)` | templates/* + workflows/* APIs; dashboard, templates (list/detail), workflows (list/detail) pages |
| **B — cross-org / pre-context** | `prismaAdmin` (scope by userId/token in app layer) | `auth/login` (membership lookup), `auth/register` (provisioning), `orgs` GET+POST, `invites/[token]` route + page |
| **C — org id is a path param ≠ session** | `withOrg(id, tx => …)` (membership query becomes the RLS-gated auth check) | `orgs/[id]`, `orgs/[id]/switch`, `orgs/[id]/members` |
| **mixed** | per-query | `settings/page.tsx`: org queries → `withOrg(session.orgId)`; the `orgMember.findMany({where:{userId}})` switcher query → `prismaAdmin` |
| **no change** | `prisma` (raw, no RLS table) | `health` (`SELECT 1`) |

B, C, and mixed files are done inline (subtle). Pure-A files are fanned out to a
fable-5 workflow with the gold reference + a cross-org escape hatch, then verified.

### Verification (the only proof that counts)
- Live isolation: an org-A session requesting an org-B id returns 404/empty, NOT the row.
- `npm run build` green.

## Phase 3 — slug tenant routing
- `src/middleware.ts`: auth-cookie guard only (Prisma can't run on edge).
- `src/lib/require-org.ts`: server-side OrgMember-by-slug check → 403 if not a member.
- Verify: org-A user hitting `/t/<orgB-slug>` → 403.

## Phase 4 — subscription gating (code-complete, verification-deferred)
- `Organization` += `stripeCustomerId/stripeSubscriptionId/subscriptionStatus`
  (default `trialing`)/`currentPeriodEnd`.
- `src/app/api/webhooks/stripe/route.ts`: raw body, `constructEvent`, `prismaAdmin`.
- Register route provisions org (org + owner member + seeded default templates) in one
  `prismaAdmin` transaction; `src/lib/default-templates.ts` single source.
- **Paywall is a no-op when `STRIPE_SECRET_KEY` is unset** — build stays green, prod not
  locked out. `stripe trigger` verification deferred (needs the owner's Stripe account).

## Phase 5 — rebrand halalflow → MosRev
- Session cookie `halalflow_session` → `mosrev_session`; `manifest.ts`; landing copy;
  `.env` (`HALALFLOW_EMAIL_FROM` → `MOSREV_EMAIL_FROM`, base URL); `package.json` name.

## UI/UX uplift (bounded surface list — nothing outside this goes in the diff)
Routes: landing, login, register, onboarding, dashboard, workflows (list/new/detail),
templates (list/new/detail), settings, invites. Forms: login, register, onboarding,
invite-member, new-template, new-workflow, comment. Cross-cutting: empty/loading/error
states, responsive, a11y (focus, labels, contrast), consistent design tokens, Navbar.

## Deferred (do NOT build) — carried from mosrev-build-context.md
Two-sided marketplace, vendor/donor roles, custom domains, payouts, mobile,
"super app" breadth. Stripe live verification (needs owner account).

## Status (end of session 2026-06-10)
- **Phase 2b — DONE & verified.** All 25 tenant queries scoped (withOrg / prismaAdmin /
  withOrg(id)). Proof: `scripts/rls-isolation-check.ts` (5/5, fails closed), green build,
  live HTTP — login + org-scoped reads return real data; cross-org reads denied
  (`orgs/[id]`=404, `members`=403, `switch`=403); 401 on anon.
- **Phase 3 — DONE & verified.** `/t/<slug>` membership routing + nodejs `proxy` auth
  guard. Live: non-member → access-denied, no data leak, no session change; unknown → 404.
- **UI/UX — DONE (bounded).** Layout-matching loading skeletons (dashboard/workflows/
  templates), `:focus-visible` rings, Skeleton/EmptyState primitives. The app already had
  error/global-error/not-found boundaries, strong a11y, responsive nav — left intact.
- **Phase 4 (Stripe) — DEFERRED.** Needs (a) approval to add the `stripe` dependency and
  (b) the owner's Stripe account to verify `stripe trigger`. Design unchanged: schema
  fields + webhook (prismaAdmin) + register provisioning + paywall that no-ops when
  `STRIPE_SECRET_KEY` is unset.
- **Phase 5 (rebrand) — DEFERRED (decision).** HalalFlow→MosRev is a product-identity call
  (~28 files, own domain). One mechanical commit when confirmed; cookie at `session.ts`.
- **Production cutover — HELD.** Irreversible SQLite→Postgres switch awaits explicit go.

## Discipline
One concern per commit. Split commits >15 files by layer (API vs pages). Lead messages
with the outcome. Hold the production SQLite→Postgres cutover for explicit go-ahead.
