import { redirect } from "next/navigation";
import { prismaAdmin } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { isSubscriptionActive } from "@/lib/subscription";

/**
 * Server-component guard: redirect to /billing when the active org's
 * subscription is not in good standing. No-ops entirely (and skips the DB read)
 * when Stripe is unconfigured, so deployments without billing are never gated.
 * Call after the auth/orgId guards in protected content pages.
 */
export async function requireActiveSubscription(orgId: string): Promise<void> {
  if (await isOrgSubscribed(orgId)) return;
  redirect("/billing");
}

/**
 * Boolean form for API route handlers (which return a 402 instead of
 * redirecting). Always true when Stripe is unconfigured (paywall off).
 */
export async function isOrgSubscribed(orgId: string): Promise<boolean> {
  if (!isStripeConfigured()) return true;
  const org = await prismaAdmin.organization.findUnique({
    where: { id: orgId },
    select: { subscriptionStatus: true },
  });
  return isSubscriptionActive(org?.subscriptionStatus);
}
