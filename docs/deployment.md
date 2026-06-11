# Production Deployment Guide — Postgres

HalalFlow ships with SQLite for local development. For production, migrate to PostgreSQL for concurrent writes, connection pooling, and managed backups.

## 1. Create a Postgres database

**Railway (recommended)**  
Add a **PostgreSQL** service in the same project. Railway sets `DATABASE_URL` automatically — copy its value.

**Other hosts (Render, Supabase, self-hosted)**  
Create a database and note the connection string:
```
postgresql://user:password@host:port/dbname?schema=public
```

## 2. Switch Prisma to PostgreSQL

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> Keep `generator client` exactly as-is.

## 3. Update environment variables

```env
# .env.production  (or Railway Variables)
DATABASE_URL="postgresql://..."
SESSION_SECRET="change-to-a-random-32-char-string"
```

`SESSION_SECRET` must stay at least 32 characters.

## 4. Generate client and run migrations

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

- `generate` rebuilds the Prisma client for Postgres.
- `migrate deploy` applies existing migrations to the new database.

## 5. Seed demo data (optional)

```bash
npx prisma db seed
```

> Skip this if you want a clean production instance without demo credentials.

## 6. Build and start

```bash
npm run build
npm start
```

`npm start` already runs `prisma migrate deploy && next start`, so migrations apply automatically on each deploy.

## 7. Verify

- `GET /` returns the landing page (or redirects to `/dashboard` if logged in).
- `POST /api/auth/login` with demo credentials returns a session cookie.
- `GET /api/templates` returns the organization's templates.

## Rollback

If you need to revert to SQLite locally, change `provider` back to `"sqlite"`, restore the local `DATABASE_URL`, and run `npx prisma generate`.

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
