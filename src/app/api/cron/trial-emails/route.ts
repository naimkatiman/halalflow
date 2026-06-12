import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isBillingEnabled } from "@/lib/demo";
import { isEmailConfigured } from "@/lib/notifications/email";
import { runTrialEmailSweep } from "@/lib/trial-email-sweep";

export const dynamic = "force-dynamic";

// Constant-time bearer check: hashing both sides gives timingSafeEqual
// equal-length inputs and leaks nothing about where a mismatch occurred.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const provided = crypto.createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const expected = crypto.createHash("sha256").update(`Bearer ${secret}`).digest();
  return crypto.timingSafeEqual(provided, expected);
}

export async function GET(request: NextRequest) {
  // A single 401 for both "no secret configured" and "wrong secret" — callers
  // can't fingerprint the deployment's configuration state.
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Without billing (real Stripe or demo) there is no paywall, so trials never
  // end — nothing to announce.
  if (!isBillingEnabled()) {
    return NextResponse.json({ ok: true, skipped: "billing-disabled" });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, skipped: "email-unconfigured" });
  }

  try {
    const { reminders, winbacks, failures } = await runTrialEmailSweep();

    if (failures.length > 0) {
      console.error("trial-emails cron failures:", failures);
    }

    return NextResponse.json({
      ok: failures.length === 0,
      reminders,
      winbacks,
      failures: failures.length,
    });
  } catch (error) {
    console.error("GET /api/cron/trial-emails error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
