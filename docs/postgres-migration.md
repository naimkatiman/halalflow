# PostgreSQL Migration Guide

This guide explains how to migrate the HalalFlow database from SQLite to PostgreSQL.

## Prerequisites

- A running PostgreSQL 14+ instance
- `pgloader` (optional, for automated migration)
- `psql` or a database management tool

## 1. Update Environment Variables

Update your `.env` file with a PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/halalflow?schema=public"
```

For production with connection pooling (e.g., PgBouncer or Supabase):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/halalflow?schema=public&connection_limit=20"
```

## 2. Create the Database

```bash
createdb halalflow
```

## 3. Run Prisma Migrations

Generate the Prisma client for PostgreSQL and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

## 4. Export SQLite Data (Optional)

If you have existing SQLite data to migrate, you have two options:

### Option A: Using pgloader (Recommended)

```bash
pgloader sqlite://./dev.db postgresql://user:password@localhost/halalflow
```

### Option B: Manual SQL Dump

1. Export SQLite data to SQL:

```bash
sqlite3 dev.db .dump > dump.sql
```

2. Edit `dump.sql` to fix PostgreSQL incompatibilities:
   - Replace `AUTOINCREMENT` with `SERIAL` or remove it (Prisma uses `cuid()`)
   - Replace SQLite-specific syntax with PostgreSQL equivalents
   - Remove `BEGIN TRANSACTION;` and `COMMIT;` wrappers if present

3. Import into PostgreSQL:

```bash
psql -U user -d halalflow -f dump.sql
```

### Option C: Prisma DB Pull (Schema introspection)

If you want to introspect an existing SQLite database before migration:

```bash
# Temporarily point back to SQLite
DATABASE_URL="file:./dev.db" npx prisma db pull

# Then switch to PostgreSQL and migrate
```

## 5. Verify the Migration

```bash
npx prisma db seed
npm run build
npm run dev
```

## 6. Production Connection Pooling

For production deployments, configure connection pooling to prevent exhausting the database connection limit:

### Using PgBouncer

Set the connection string with the `pgbouncer` mode:

```bash
DATABASE_URL="postgresql://user:password@pgbouncer-host:6432/halalflow?schema=public&connection_limit=10"
```

### Recommended Pool Settings

| Environment | Pool Size | Notes |
|-------------|-----------|-------|
| Development | 1-5 | Low concurrency, local DB |
| Staging | 5-10 | Moderate load testing |
| Production | 10-20 | Per application instance |
| Serverless | 1-2 + External pooler | Use Supabase/Neon/Vercel Postgres pooler |

Prisma automatically manages a connection pool. The `connection_limit` parameter in the connection string controls the maximum number of connections Prisma will open.

### Additional Production Tuning

For high-throughput environments, consider:

- **PgBouncer** in transaction mode for serverless deployments
- **Supabase Pooler** or **Neon serverless driver** if using those platforms
- Setting `?pgbouncer=true` in the connection string when using PgBouncer

## 7. Rollback Plan

If you need to rollback to SQLite:

1. Revert `prisma/schema.prisma` to `provider = "sqlite"`
2. Restore the `DATABASE_URL="file:./dev.db"` in `.env`
3. Run `npx prisma generate`

## Troubleshooting

### "relation does not exist" errors

Ensure migrations have been applied: `npx prisma migrate deploy`

### Connection limit exceeded

Reduce `connection_limit` in the connection string or add an external pooler.

### Migration fails due to existing data

Use `npx prisma migrate resolve --applied <migration_name>` if a migration was partially applied.
