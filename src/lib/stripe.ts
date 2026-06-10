import Stripe from "stripe";

let cached: Stripe | null | undefined;

/**
 * Lazily-constructed Stripe client. Returns null when STRIPE_SECRET_KEY is
 * unset, so the rest of the app can treat "Stripe not configured" as a normal,
 * non-fatal state (the paywall no-ops, provisioning skips customer creation).
 */
export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  cached = key ? new Stripe(key) : null;
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
