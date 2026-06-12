# Demo mode — live demo runbook

## What demo mode is

Demo mode runs the entire product — trial countdown, reminder emails, paywall lockout, checkout, subscription activation, win-back — on a deployment with no Stripe and no Resend keys. Billing is simulated (checkout marks the org subscribed directly) and every outgoing email is captured to an in-app outbox at `/demo/outbox` instead of being sent. Everything else is real: the paywall, the trial math, the email sweep, workflows, approvals, and PDF receipts all run the same code paths as production.

Real keys take precedence. If `STRIPE_SECRET_KEY` is set, real Stripe billing runs; if `RESEND_API_KEY` and `MOSREV_EMAIL_FROM` are set, emails actually send. Never enable demo mode alongside real keys in production.

## How to enable

Locally:

```bash
# .env
DEMO_MODE="true"
```

Then seed with demo mode on — the seed creates four demo workflows (approved, in-progress, pending, rejected) in the demo org:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Railway: open the `halalflow` service → Variables → add `DEMO_MODE=true` → redeploy. Run the seed once against the deployed database with `DEMO_MODE=true` set so the demo workflows exist.

You know it is on when the amber "Demo mode — payments and emails are simulated." banner appears on every page and "Outbox" shows in the navbar.

## The demo script

A presenter follows this click-path live. Total time: about 8 minutes.

1. Log in as `admin@halalflow.app` / `changeme123`.
2. Dashboard tour: point out the seeded workflows — one approved Expense Approval, an in-progress Zakat Distribution, a pending Donation Acknowledgment, and a rejected Expense Approval.
3. Open the in-progress **Zakat Distribution** workflow (step 1 of 3 already approved).
4. Approve the current step. Add a short note.
5. Open **Outbox** in the navbar — the decision email for that approval is at the top. Expand it to show the rendered HTML.
6. Go back to Workflows and open the fully **approved Expense Approval**.
7. Download the PDF receipt.
8. Open **Billing** — show the trial countdown (30-day trial, counting from org creation).
9. In the **Demo time machine** card, click **Day 23** — the org is now 23 days old, mid-trial.
10. Click **Run email sweep** — the toast reports one reminder sent.
11. Open **Outbox** — the day-23 trial reminder email is at the top.
12. Back on Billing, click **Day 31** — the trial is now expired.
13. Click **Dashboard** in the navbar — the paywall redirects straight back to Billing.
14. Click **Subscribe** — the simulated checkout page opens, prefilled with test card 4242 4242 4242 4242, labeled "Simulated checkout — no real payment".
15. Click pay — back on Billing with the subscription active.
16. Click **Dashboard** — access is restored.
17. (Optional) Demonstrate win-back: on Billing, click **Day 37**, then **Run email sweep**, then open **Outbox** — the win-back email is there. Note: Day 37 resets the org to an expired trial, so the paywall is active again until you re-subscribe or reset.
18. Finish with **Reset** on the time machine — the org returns to a fresh 30-day trial.

## Going live for real

1. Set the real keys: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `RESEND_API_KEY`, `MOSREV_EMAIL_FROM`.
2. Remove `DEMO_MODE` (or set it empty).
3. Redeploy.

What changes: Subscribe goes to real Stripe Checkout, emails send through Resend, and the demo surfaces disappear — the banner, the Outbox nav item, the time machine card, and the simulated checkout page are gone; the demo API endpoints return 404. The real keys alone are enough to disable the simulations (they take precedence even if `DEMO_MODE` is still set), but remove the variable anyway so the demo banner and outbox do not appear on a production deployment.

## Caveats

- Demo endpoints (`/api/billing/demo-checkout`, `/api/billing/demo-controls`, `/demo/outbox`) return 404 outside demo mode. Without `DEMO_MODE`, behavior is identical to a build without the feature.
- The outbox is global, not tenant-scoped. Every captured email from every org on the deployment is visible to anyone who can open `/demo/outbox`. Use demo mode only on throwaway demo deployments with seeded data.
- The time machine works by mutating `organization.createdAt` (the trial clock is anchored to org creation). Day 23 / Day 31 / Day 37 also reset the org to a default trial state and clear the relevant email sent-stamps so sweeps can re-send. Reset sets `createdAt` to now. Do not point it at an org whose real creation date matters.

## Community + rental demo script

A presenter follows this click-path to show the mosque community module. Total time: about 5 minutes. Run after the main billing demo or standalone.

1. Open `/masjid` — the public mosque directory loads three published mosques.
2. Click the **Selangor** state filter pill — only Masjid Al-Noor remains.
3. Click the **Masjid Al-Noor** card — the full profile opens: photo, description, facilities, Ramadan programs, visitor info, and pantri komuniti sections.
4. Click **Mohon Tempahan** on the Dewan Serbaguna card — the booking request form opens pre-selected on that facility.
5. Fill in the form: select event type Kenduri, pick a date two weeks out, enter 08:00–17:00, pax 200, your name, phone. Submit. A reference number is shown — note it.
6. Log in as `admin@halalflow.app` / `changeme123`.
7. Open **Bookings** in the navbar — the new request appears at the top of the queue with status "Requested".
8. Open the booking detail. Click **Lulus** (Approve): enter quoted amount RM 1,500.00, deposit RM 300.00. Confirm. Status changes to "Approved".
9. Click **Rekod Bayaran** (Record payment): enter amount RM 1,500.00. Confirm. Status changes to "Paid".
10. Open **Finance** in the navbar — a new "Sewaan: [your name] (Kenduri)" entry appears in the Sewaan fund, timestamped now.
11. Click **Eksport CSV** — the browser downloads `penyata-<date>.csv` containing all ledger entries.
12. Open **Community** in the navbar — the mosque profile form shows all the seeded fields. Toggle a field and save to show the PUT round-trip.
13. Open `/ramadan` in a new tab — the Ramadan directory groups programs by type across all three seeded mosques.

What to point at during the demo:
- Step 5: the facility rules amber info box in the booking form.
- Step 7: the BookingStatusBadge color coding (amber = requested, blue = approved, emerald = paid).
- Step 10: the fund totals cards at the top of Finance showing Sewaan, Wakaf, Kutipan Jumaat, and Infaq balances.
- Step 13: the grouped Ramadan directory with Iftar / Terawih / Moreh / Tadarus sections.

## Demo imagery

Free-license photos bundled for the community/rental demo (`public/images/`):

| File | Source | Photographer | License |
|---|---|---|---|
| mosque-hero.jpg | https://unsplash.com/photos/gyKmF0vnfBs | Fahrul Azmi | Unsplash License |
| mosque-exterior-1.jpg | https://unsplash.com/photos/7_COgbItdkQ | Esmonde Yong | Unsplash License |
| mosque-exterior-2.jpg | https://unsplash.com/photos/ZADioNn1XKw | Terrence Low | Unsplash License |
| mosque-interior-1.jpg | https://unsplash.com/photos/5C0e03S-2UI | SR | Unsplash License |
| mosque-interior-2.jpg | https://unsplash.com/photos/5ztvgeVTT1E | Ahmed Farook | Unsplash License |
| mosque-hall.jpg | https://unsplash.com/photos/PHQqesqU3PY | Yazid N | Unsplash License |
| mosque-community.jpg | https://unsplash.com/photos/r0HlondEF0A | Alim | Unsplash License |
| mosque-study.jpg | https://unsplash.com/photos/PsEXbDsSlV4 | Rumman Amin | Unsplash License |
