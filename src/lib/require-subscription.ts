import { redirect } from "next/navigation";
import { prismaAdmin } from "@/lib/db";
import { isBillingEnabled } from "@/lib/demo";
import { isSubscriptionActive } from "@/lib/subscription";

/**
 * Server-component guard: redirect to /billing when the active org's
 * subscription is not in good standing. No-ops entirely (and skips the DB read)
 * when billing is disabled, so deployments without billing are never gated.
 * Call after the auth/orgId guards in protected content pages.
 */
export async function requireActiveSubscription(orgId: string): Promise<void> {
  if (await isOrgSubscribed(orgId)) return;
  redirect("/billing");
}

/**
 * Boolean form for API route handlers (which return a 402 instead of
 * redirecting). Always true when billing is disabled (paywall off).
 */
export async function isOrgSubscribed(orgId: string): Promise<boolean> {
  if (!isBillingEnabled()) return true;
  const org = await prismaAdmin.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      currentPeriodEnd: true,
      createdAt: true,
    },
  });
  // Unknown org fails closed — the paywall is on and there is nothing to bill.
  return org ? isSubscriptionActive(org) : false;
}
