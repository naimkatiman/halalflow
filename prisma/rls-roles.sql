-- MosRev row-level-security role provisioning.
--
-- Run ONCE as a superuser/owner on the target database BEFORE the first
-- `prisma migrate deploy`, replacing the two placeholder passwords. Idempotent
-- enough for fresh databases; on re-run, DROP the roles first or guard with DO
-- blocks.
--
-- Role model (defense in depth alongside app-layer `where: { orgId }`):
--   mosrev_app   - least privilege, RLS-ENFORCED. The runtime app connects as
--                  this role (DATABASE_URL). Always reach it through withOrg().
--   mosrev_admin - BYPASSRLS. Used ONLY for signup provisioning, cross-org
--                  membership lookups, invite-token resolution, and Stripe
--                  webhooks (DATABASE_URL_ADMIN). Scope by userId/token in code.
--   owner/superuser - runs `prisma migrate` via DIRECT_URL (DDL); owns tables.
--
-- The ALTER DEFAULT PRIVILEGES lines are load-bearing: migrations create tables
-- as the owner, so without them each new table would be inaccessible to the app
-- role until manually granted.

CREATE ROLE mosrev_app   LOGIN PASSWORD 'REPLACE_WITH_APP_PASSWORD';
CREATE ROLE mosrev_admin LOGIN PASSWORD 'REPLACE_WITH_ADMIN_PASSWORD' BYPASSRLS;

GRANT USAGE ON SCHEMA public TO mosrev_app, mosrev_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO mosrev_app, mosrev_admin;
GRANT USAGE, SELECT             ON ALL SEQUENCES IN SCHEMA public TO mosrev_app, mosrev_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO mosrev_app, mosrev_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT             ON SEQUENCES TO mosrev_app, mosrev_admin;
