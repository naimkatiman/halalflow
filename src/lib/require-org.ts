import { prismaAdmin } from "@/lib/db";

export interface TenantResolution {
  org: { id: string; name: string; slug: string };
  /** The caller's role in the org, or null if they are not a member. */
  role: string | null;
}

/**
 * Resolve a tenant by slug and report the caller's membership.
 *
 * Slug routing can target ANY org (not just the caller's active one), so this
 * runs on the BYPASSRLS admin client and scopes membership by userId in the
 * application layer. Returns null when no org owns the slug; otherwise returns
 * the org plus the caller's role (null = authenticated but not a member). The
 * caller decides how to treat each outcome (404 vs access-denied vs enter).
 */
export async function resolveTenant(userId: string, slug: string): Promise<TenantResolution | null> {
  const org = await prismaAdmin.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      members: { where: { userId }, select: { role: true }, take: 1 },
    },
  });
  if (!org) return null;
  return {
    org: { id: org.id, name: org.name, slug: org.slug },
    role: org.members[0]?.role ?? null,
  };
}
