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
