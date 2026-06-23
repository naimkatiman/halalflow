# Scheduled Jobs (Cron)

MosRev deploys on Railway. Cron jobs are modeled as HTTP scheduler calls into the existing Next.js web service, not as a separate application runtime with its own database connection logic. There is no `vercel.json` in this repo; do not add one unless the deployment target is intentionally changed with owner/Fatin approval.

Current data/deploy assumption: the live app uses PostgreSQL plus row-level security (RLS) with the three database URLs documented in `.env.example` and `docs/deployment.md`. Cron setup should call the same web deployment and must not introduce or depend on an old SQLite `/data` volume.

## Source of truth

- Cron route: `src/app/api/cron/trial-emails/route.ts`.
- Sweep logic: `src/lib/trial-email-sweep.ts`.
- Billing/email gates: `src/lib/demo.ts` and `src/lib/notifications/email.ts`.
- Deployment/env setup: `.env.example` and `docs/deployment.md`.

## Live jobs

| Endpoint | Suggested schedule | What it does | Required environment |
|---|---|---|---|
| `/api/cron/trial-emails` | `0 1 * * *` (daily 09:00 MYT) | Day-23 trial reminder plus day-37 win-back to org owners/admins. Idempotent: orgs are stamped (`trialReminderSentAt` / `trialWinbackSentAt`) only after a confirmed real send or demo-outbox capture. | `CRON_SECRET`; billing enabled through Stripe keys or demo mode; email configured through Resend keys or demo mode. |

The route returns JSON skips when billing or email is unavailable:

- `{ ok: true, skipped: "billing-disabled" }` when neither Stripe nor demo billing is active.
- `{ ok: true, skipped: "email-unconfigured" }` when neither Resend nor demo email capture is active.

## Railway cron setup

1. Set `CRON_SECRET` on the Railway web service and on the cron service that will call it. Use the same value; do not paste the value into docs, logs, screenshots, or commits.
2. Create a Railway **Cron** service in the existing `halalflow` project, or update the existing cron service if one is already configured.
3. Use the daily schedule from the live-jobs table unless the operator intentionally wants more frequent retry behavior. A 5-minute cadence is unnecessary for the current trial email sweep.
4. Configure the cron service to send the route's required authorization header derived from `CRON_SECRET`.
5. Start command shape:

   ```sh
   curl -fsS -H "$CRON_AUTH_HEADER" \
     "https://halalflow-production.up.railway.app/api/cron/trial-emails"
   ```

   `CRON_AUTH_HEADER` should be configured as a secret service variable, not committed. If the public origin changes, replace the host with the deployed MosRev origin used for `NEXT_PUBLIC_BASE_URL`.

## Verification

Static/setup checks:

```sh
# Confirm the repo still uses the Railway/App Router cron route.
# There should be no vercel.json unless the deployment target has changed.
```

HTTP smoke checks against a safe environment:

```sh
# Missing/wrong authorization header should be 401.
curl -i "https://halalflow-production.up.railway.app/api/cron/trial-emails"

# Correct authorization header should return 200 JSON, often with a skipped reason if billing/email is disabled.
curl -i -H "$CRON_AUTH_HEADER" \
  "https://halalflow-production.up.railway.app/api/cron/trial-emails"
```

Run the authorized smoke only against a disposable/demo database or when it is acceptable to drain due trial emails. If billing and email are configured and eligible orgs exist, the route may stamp `trialReminderSentAt` / `trialWinbackSentAt` and send or capture emails.

## Why not Vercel cron

The active deployment target is Railway, and the app relies on the PostgreSQL/RLS environment contract documented in `.env.example` and `docs/deployment.md`. Adding Vercel cron would create a second operator path with separate secrets and deployment assumptions. Keep cron on Railway unless a future deployment-target change is explicitly approved.
