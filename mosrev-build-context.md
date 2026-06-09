# MosRev — multi-tenant build context

> Plan doc + builder input. Read this and `AGENTS.md` before any edit.
> Last verified against the live environment: 2026-06-09.

## Environment facts (verified 2026-06-09 — read before trusting the manifest)
- **DB today is SQLite.** `prisma/schema.prisma` → `provider = "sqlite"`; `.env` `DATABASE_URL="file:..."`.
- **No Postgres is provisioned for MosRev.** Nothing listens on :5432. Two dockerized
  Postgres 16 containers are up but belong to OTHER projects — do NOT reuse them:
  `imqa-pg` (host :5544), `hydrax-pg-test` (host :5433).
- **Phase 1/2 require a dedicated Postgres + owner rights.** `CREATE ROLE ... BYPASSRLS`
  needs superuser/owner on the target DB. Cleanest path: a fresh dockerized Postgres for
  MosRev (e.g. `mosrev-pg` on a free host port) where we own the `postgres` superuser.
  Put its URLs in `.env` as `DATABASE_URL` (mosrev_app role) and `DATABASE_URL_ADMIN`
  (mosrev_admin BYPASSRLS role). DO NOT commit real credentials.
- **If running via Hermes:** the correct invocation is `hermes -z "PROMPT" --yolo`
  (optionally `-t hermes-cli`, `--worktree`, `--skills ...`), run from this directory.
  There is NO `hermes run` subcommand and NO `--context-file/--non-interactive/--no-stream`
  flags — pass the context by telling the prompt to read this file. Hermes is authed via
  the shared OpenAI Codex pool; heavy multi-hour runs draw down that quota.

## Target
Productize the existing halalflow codebase into MosRev: a multi-tenant SaaS
masjid platform (Islamic-finance approval workflows). Workflow-engine-first.
NOT a two-sided marketplace in this MVP — that is deferred.

## Stack (do not change)
Next.js 16 (App Router, Turbopack), Prisma 6, iron-session, Tailwind v4, Zod,
bcryptjs. READ node_modules/next/dist/docs/ before writing route/middleware code —
this Next 16 differs from training data (see AGENTS.md). Verify current Prisma 6
RLS + datasources patterns before trusting any DB code below.

## Current state (already built — do not rebuild)
Organization, OrgMember (roles), org-scoped WorkflowTemplate/Workflow/Invitation,
org-switching, invite tokens, rate-limit, CSRF, email, landing page. Session
carries orgId + orgRole. Tenancy exists at the data layer via shared-schema + orgId,
enforced today by hand-written `where: { orgId }` in every route. SQLite.

## What "world-class multi-tenant" adds (the work)
1. SQLite → Postgres (the real scale blocker)
2. RLS as the isolation backstop so a forgotten orgId filter fails closed
3. Subscription gating + signup provisioning
4. Tenant routing by slug
5. Rebrand halalflow → MosRev

## Load-bearing decisions
- Shared schema + orgId column + Postgres RLS. NOT schema-per-tenant.
- Defense in depth: keep app-layer `where:{orgId}` AND add RLS policies.
- Denormalize orgId onto TemplateStep/Approval/Comment/AuditLog so RLS stays a
  flat `org_id = current_setting('app.current_org_id', true)` — no join subqueries.
- TWO Postgres roles: app role (RLS-enforced, DATABASE_URL) and a BYPASSRLS admin
  role (DATABASE_URL_ADMIN) used ONLY for signup provisioning and Stripe webhooks.
  This resolves the bootstrap problem: provisioning creates an org before any
  app.current_org_id exists, so it must bypass RLS.

## src/lib/db.ts — dual client
- export `prisma` (app role) and `prismaAdmin` (BYPASSRLS role).
- export `withOrg(orgId, fn)` that opens a transaction, runs
  `SELECT set_config('app.current_org_id', $orgId, true)`, then runs fn(tx).
- All tenant reads/writes go through withOrg. Provisioning + webhooks use prismaAdmin.

## Postgres roles (run once as DB owner / superuser on the MosRev instance)
CREATE ROLE mosrev_app   LOGIN PASSWORD '...';
CREATE ROLE mosrev_admin LOGIN PASSWORD '...' BYPASSRLS;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO mosrev_app, mosrev_admin;
ALTER TABLE "<each org-scoped table>" FORCE ROW LEVEL SECURITY;

## Phase manifest (one commit per phase, npm run build green before each)
1. chore: move datastore to postgres
   provision dedicated Postgres for MosRev (see Environment facts);
   schema.prisma provider → postgresql; rm -rf prisma/migrations; migrate dev; db:seed
2. feat: isolate tenant data with row-level security
   add orgId to TemplateStep/Approval/Comment/AuditLog (backfill in migration);
   raw-SQL migration ENABLE + FORCE RLS + USING/WITH CHECK policies per table;
   db.ts dual client + withOrg
2b. feat: scope all queries to the active org
   wrap every tenant query in src/app/api/**/route.ts with withOrg
3. feat: route and guard tenants by slug
   src/middleware.ts (auth-cookie guard only — Prisma can't run on edge);
   src/lib/require-org.ts (server-side OrgMember-by-slug check → 403 if not a member)
4. feat: gate org access behind subscription
   Organization += stripeCustomerId/stripeSubscriptionId/subscriptionStatus(default
   "trialing")/currentPeriodEnd; src/app/api/webhooks/stripe/route.ts (raw body,
   constructEvent, prismaAdmin); expand register route to provision new org
   (org + owner member + seeded default templates) in one prismaAdmin transaction,
   then create Stripe customer AFTER commit; add orgName field to RegisterForm
   (shown only when no inviteToken); src/lib/default-templates.ts as single source
5. feat: rebrand platform to MosRev
   session cookie name → mosrev_session; manifest.ts; landing copy; .env
   (HALALFLOW_EMAIL_FROM → MOSREV_EMAIL_FROM, base URL); package.json name

## Verification (must pass per phase)
- Phase 2: an org-A session requesting an org-B workflow id returns empty/404, NOT
  the row. If it returns the row, RLS is not wired — stop and fix.
- Phase 3: org-A user hitting /t/<orgB-slug> → 403.
- Phase 4: unpaid org is paywalled; `stripe trigger customer.subscription.updated`
  restores access; webhook updates subscriptionStatus.
- Every phase: npm run build green before commit.

## Discipline
One concern per commit. No commit > 15 files. Lead messages with the outcome.
Deferred (do NOT build): two-sided marketplace, vendor/donor roles, custom domains,
payouts, mobile, "super app" breadth. Log them, don't implement.
