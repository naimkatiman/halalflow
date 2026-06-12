import { isStripeConfigured } from "@/lib/stripe";

/**
 * Whether the deployment is running in demo mode (`DEMO_MODE=true`). Demo mode
 * simulates billing and email so the full trial lifecycle can be shown live
 * without Stripe or Resend keys.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE?.trim().toLowerCase() === "true";
}

/**
 * Whether billing is being simulated. Real keys always win: the moment
 * STRIPE_SECRET_KEY is set, the simulation turns itself off and the real
 * Stripe integration takes over — no code change to go live.
 */
export function isDemoBilling(): boolean {
  return isDemoMode() && !isStripeConfigured();
}

/**
 * Whether the paywall/trial logic should run at all: true with real Stripe
 * keys or with demo billing. Gates that used to check isStripeConfigured()
 * check this instead, so demo mode exercises the real subscription code paths.
 */
export function isBillingEnabled(): boolean {
  return isStripeConfigured() || isDemoBilling();
}

/**
 * Whether outgoing email is being captured to the demo outbox instead of sent.
 * Reads RESEND_API_KEY / MOSREV_EMAIL_FROM directly rather than importing
 * email.ts (which imports this module — avoids an import cycle). Real keys
 * always win: setting both disables the capture.
 */
export function isDemoEmail(): boolean {
  return (
    isDemoMode() &&
    !(process.env.RESEND_API_KEY?.trim() && process.env.MOSREV_EMAIL_FROM?.trim())
  );
}
