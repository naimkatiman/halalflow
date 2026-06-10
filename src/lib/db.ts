import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdmin: PrismaClient | undefined;
};

/**
 * App client — connects as the least-privilege `mosrev_app` role, which is
 * subject to row-level security. Never query tenant tables through this client
 * directly: use `withOrg()` so `app.current_org_id` is set on the connection.
 * Without it, RLS makes every org-scoped table return zero rows (fail closed).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

/**
 * Admin client — connects as the `mosrev_admin` BYPASSRLS role. Use ONLY for
 * operations that must cross or precede an org context: signup provisioning,
 * cross-org membership lookups (which orgs a user belongs to), invite-token
 * resolution, and Stripe webhooks. Always scope these by userId / token in the
 * application layer, since RLS is not enforcing isolation here.
 */
const adminUrl = process.env.DATABASE_URL_ADMIN;
if (
  !adminUrl &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  // Falling back to the RLS-enforced app role means provisioning, Stripe
  // webhooks, and cross-org lookups will fail closed. Surface it loudly.
  console.warn(
    "DATABASE_URL_ADMIN is not set — prismaAdmin is using the least-privilege app role; admin/cross-org operations will not work.",
  );
}
export const prismaAdmin =
  globalForPrisma.prismaAdmin ??
  new PrismaClient({
    ...(adminUrl ? { datasourceUrl: adminUrl } : {}),
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdmin = prismaAdmin;
}

/**
 * Run `fn` against the database scoped to a single organization.
 *
 * Opens an interactive transaction (which pins one pooled connection) and sets
 * `app.current_org_id` as a TRANSACTION-LOCAL setting on that connection, so
 * the RLS policies see the right org for every query inside `fn`. This must be
 * an interactive transaction: a session-level `SET` would leak across pooled
 * connections and silently break isolation.
 *
 * All reads/writes inside `fn` must use the provided `tx` client. INSERTs into
 * org-scoped tables must still set `orgId` explicitly (the WITH CHECK policy
 * rejects mismatches, and the column is NOT NULL).
 */
export async function withOrg<T>(
  orgId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { timeout?: number; maxWait?: number },
): Promise<T> {
  if (!orgId) {
    throw new Error("withOrg requires a non-empty orgId");
  }
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_org_id', ${orgId}, true)`;
      return fn(tx);
    },
    { maxWait: options?.maxWait ?? 5_000, timeout: options?.timeout ?? 10_000 },
  );
}
