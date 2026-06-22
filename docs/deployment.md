# Production Deployment Guide — Postgres + RLS

MosRev currently uses PostgreSQL as the active Prisma datasource. Production deployments are designed around three database URLs and row-level-security (RLS) roles so tenant data fails closed by default.

This guide supersedes older SQLite-era notes. Do not switch `prisma/schema.prisma` back to SQLite for production.

## 1. Create a Postgres database

Create a managed or self-hosted PostgreSQL database and keep the owner/superuser connection string available for initial setup and migrations.

Recommended operational requirements:

- automated backups and point-in-time restore if the host provides it;
- TLS-enabled connections in production;
- a stable database URL for the app runtime;
- permission to create login roles before the first migration.

Connection string shape:

```text
postgresql://user:***@host:port/dbname?schema=public
```

## 2. Provision the RLS roles before migrations

Run `prisma/rls-roles.sql` once as the database owner/superuser before the first `prisma migrate deploy`.

The script creates the two application roles used by `.env.example`:

- `mosrev_app` — least-privilege runtime role. It is RLS-enforced and should be used by `DATABASE_URL`.
- `mosrev_admin` — `BYPASSRLS` admin role. It is used only by `DATABASE_URL_ADMIN` for signup provisioning, invite-token resolution, cross-org membership lookups, and Stripe webhooks.

Replace the placeholder passwords in `prisma/rls-roles.sql` before running it:

```sql
CREATE ROLE mosrev_app   LOGIN PASSWORD 'REPLACE_WITH_APP_PASSWORD';
CREATE ROLE mosrev_admin LOGIN PASSWORD 'REPLACE_WITH_ADMIN_PASSWORD' BYPASSRLS;
```

The `ALTER DEFAULT PRIVILEGES` statements in that file are load-bearing: migrations create tables as the owner, and future tables must still be readable/writable by the app/admin roles.

## 3. Configure environment variables

Use `.env.example` as the source of truth for required variables:

```env
DATABASE_URL="postgresql://mosrev_app:***@host:5432/mosrev?schema=public"
DATABASE_URL_ADMIN="postgresql://mosrev_admin:***@host:5432/mosrev?schema=public"
DIRECT_URL="postgresql://owner:***@host:5432/mosrev?schema=public"
SESSION_SECRET="change-me-to-a-random-32-char-string-mosrev"
NEXT_PUBLIC_BASE_URL="https://your-domain.example"
```

Database URL responsibilities:

| Variable | Role | Used for |
|---|---|---|
| `DATABASE_URL` | `mosrev_app` / least privilege / RLS-enforced | Normal Prisma app traffic through `prisma` and `withOrg()` |
| `DATABASE_URL_ADMIN` | `mosrev_admin` / `BYPASSRLS` | Provisioning, cross-org membership lookup, invite-token resolution, Stripe webhooks |
| `DIRECT_URL` | owner/superuser | Prisma migrations and DDL only |

Production must set `DATABASE_URL_ADMIN`. If it is missing at runtime, `src/lib/db.ts` falls back to the least-privilege app role and admin/cross-org operations will fail closed.

`SESSION_SECRET` must stay at least 32 characters. Generate a fresh value per environment.

Optional integrations:

- `RESEND_API_KEY` and `MOSREV_EMAIL_FROM` enable real workflow email.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` enable Stripe billing.
- Leave Stripe variables unset to keep billing disabled for self-hosted installs.
- `DEMO_MODE="true"` is for disposable demos only. Never enable demo mode alongside real production keys.

## 4. Install dependencies and generate the Prisma client

```bash
npm install
npx prisma generate
```

If deploying from a lockfile-controlled environment, prefer the host's reproducible install command, such as `npm ci`, when appropriate.

## 5. Run migrations

Run migrations with `DIRECT_URL` available so Prisma can perform DDL through the owner/superuser connection:

```bash
npx prisma migrate deploy
```

The package `start` script already runs migrations before serving the app:

```bash
npm start
# runs: prisma migrate deploy && next start
```

Keep the role-provisioning step separate from migrations. `prisma/rls-roles.sql` must be applied before migrations on a fresh database.

## 6. Seed demo data only when intentional

```bash
npx prisma db seed
```

Skip seeding for a clean production instance without demo credentials or demo organizations.

## 7. Build and start

```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_BASE_URL` to the real public origin before sending invitation, booking, billing, or notification links.

## 8. Verify deployment

Minimum smoke checks:

- `GET /` returns the landing page, or redirects an already-authenticated browser to `/dashboard`.
- Registration/onboarding can create an organization.
- Login returns a session cookie.
- An authenticated org route can read only the active org's data.
- Public mosque directory and booking pages load only published/active data.

RLS trust check after setup:

```bash
set -a
source .env
set +a
npx tsx scripts/rls-isolation-check.ts
```

Run the RLS check only against a safe database where temporary organizations may be created and deleted. Expected success ends with:

```text
ALL PASS — RLS isolation holds
```

If this check fails, stop deployment and investigate before serving real tenant data.

## Rollback / recovery

Do not roll production back to SQLite. For production recovery, restore the prior Postgres backup or redeploy the previous application version against the existing Postgres database.

If a migration fails partway through, use Prisma's migration recovery guidance for `prisma migrate resolve` only after inspecting the actual database state and backup status.

## Stripe webhook outage (paywall runbook)

`isSubscriptionActive` fails closed: an `active`/`trialing` org whose
`currentPeriodEnd` is more than 3 days in the past is treated as a missed
renewal webhook and loses access. If Stripe confirms a prolonged webhook
outage (approaching 72 hours), keep paying orgs alive by extending their
recorded period end until deliveries resume:

```sql
-- run as the admin (BYPASSRLS) role; affects only already-paying orgs
UPDATE "Organization"
SET "currentPeriodEnd" = now() + interval '7 days'
WHERE "subscriptionStatus" IN ('active', 'trialing')
  AND "stripeSubscriptionId" IS NOT NULL
  AND "currentPeriodEnd" < now();
```

Stripe replays missed webhooks for up to 3 days automatically; for longer
gaps, resend events from the Stripe dashboard (Developers → Webhooks →
endpoint → Resend) so real state overwrites the manual extension. The
`lastStripeEventAt` guard already ignores out-of-order replays.
