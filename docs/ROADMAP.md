# MosRev — 7-Year Roadmap (2026–2033)

Created 2026-06-11 from `docs/PRD.md`. This is the single long-range plan;
update it in place. Each year has a theme, concrete deliverables, and an exit
gate — the gate must be true before the next year's bets get real investment.
Quarters are only detailed for the current year; later years are themes, not
promises.

Operating rules: revenue features before breadth, fail-closed security always,
nothing ships that breaks self-hosting, and deferred items stay deferred until
their gate year.

## Year 1 — 2026–2027: First paying masjids

Theme: turn the shipped product into a paid product with real organizations.

Q3 2026
- Rotate seeded prod admin credentials (change-password shipped 2026-06-11; rotate
  via Settings after deploy); set `RESEND_API_KEY` so invites really send.
- Live Stripe decision (own account vs shared tradeclaw account), durable
  dashboard API key, real price on the live product (RM/MYR pricing decision —
  Malaysian masjids are the beachhead market).
- Trial lifecycle complete: expiry enforced (done 2026-06-11), reminder email
  at day 23 + win-back at day 37 (code shipped 2026-06-11; live once the
  Railway cron service and `RESEND_API_KEY` exist — see docs/cron.md).
- Onboard 5 pilot masjids by hand. Sit with a treasurer; watch them use it.

Q4 2026
- Fix what the pilots break. Their friction list outranks this document.
- Receipts/audit export pack (ZIP of PDFs + CSV audit log) — the auditor story.
- Billing portal (Stripe customer portal link) so card updates self-serve.
- Bahasa Melayu localization of the core flows (UI copy is the product here).

2027 H1
- Self-serve onboarding good enough that a masjid activates without a call.
- Email digests: pending-approval nudges (approvals stall when nobody is told).
- Workflow attachments (quotes, invoices, receipts as evidence on steps).

Exit gate: 25 paying organizations, activation ≥ 40%, churn < 3%/mo.

## Year 2 — 2027–2028: The treasurer's operating system

Theme: own the money trail end-to-end inside one masjid.

- Budgets per category with spend-against-budget visible on every approval.
- Recurring workflows (monthly utilities, salaries) that self-create.
- Financial-year close: one-click annual report a committee can table at AGM.
- Read-only auditor seat (login, sees everything, touches nothing).
- Mobile-first approval surface (PWA, not native): approve from WhatsApp link.

Exit gate: 100 paying orgs; ≥ 60% of orgs run ≥ 4 workflows/month (retention
metric from PRD holds at scale).

## Year 3 — 2028–2029: Money in, not just money out

Theme: donations and collections enter the system the spending leaves from.

- Donation intake (QR/DuitNow/FPX first, cards second) recorded against funds.
- Funds/jars model: wakaf, zakat-amil, general, building — separated balances
  feeding the existing approval and audit trail.
- Pledge tracking for building campaigns with public progress page per org.
- This is the custom-domains gate year: org subdomains (`masjid.mosrev.app`)
  ship; full custom domains only if ≥ 20 orgs ask.

Compliance note: money movement (actual payouts) stays out until Year 4's
licensing review — recording money is not moving money.

Exit gate: 300 paying orgs; donation volume recorded through MosRev exceeds
RM 1M/year across tenants.

## Year 4 — 2029–2030: Trust infrastructure

Theme: become the thing auditors, state religious councils, and donors cite.

- Payouts/disbursement rails decision after a real licensing/eMoney review
  (Malaysia: BNM; defer any market where this is heavy).
- Donor receipts with tax-deduction references where applicable.
- Council/federation view: a state body sees aggregate compliance posture of
  member masjids that opt in (read-only, org-controlled sharing).
- SOC2-style controls documentation; penetration test; public security page.
- API (read-only first) for accountants' tools.

Exit gate: 700 paying orgs; first federation/council deal signed.

## Year 5 — 2030–2031: The network

Theme: orgs stop being islands.

- Vendor directory (the deferred two-sided marketplace, now gated open):
  suppliers masjids actually reuse — caterers, contractors, printers — with
  quote requests flowing into approval workflows.
- Inter-org templates: a council publishes a template pack; member masjids
  subscribe to updates.
- Benchmarks: "masjids your size spend X% on utilities" from opted-in data.

Exit gate: 1,500 paying orgs; ≥ 10% of new signups arrive via network referral
(template packs, vendor links, council onboarding).

## Year 6 — 2031–2032: Beyond the masjid

Theme: same trust engine, adjacent buyers.

- Surau, Islamic schools (sekolah agama/tahfiz), NGOs and waqf bodies as
  first-class org types with their own template libraries.
- Regional expansion past Malaysia (Indonesia, Singapore, Brunei first —
  language and payment rails decide order, not ambition).
- Native mobile apps only if PWA data says notifications/offline are the
  blocker (this is the mobile gate year; it has been deferred since v1).

Exit gate: 3,000 paying orgs; ≥ 25% of revenue from outside the original
masjid segment or outside Malaysia.

## Year 7 — 2032–2033: Institution

Theme: MosRev outlives its founders' attention.

- Open standard for community-org audit trails (export format other tools read).
- Partner/reseller program for accountants and state bodies.
- Self-hosted enterprise tier (the free self-host stays; this adds SSO,
  retention policies, support SLA).
- Succession-proof ops: runbooks, on-call rotation, zero bus-factor-one systems.

Exit gate: 5,000+ paying orgs, default-alive P&L (revenue covers a small
full-time team without new funding), and a churn story dominated by "masjid
dissolved", not "product failed".

## Standing backlog (pull forward only with evidence)

- Webhook-outage runbook automation (manual procedure documented in
  `docs/deployment.md`).
- Framework/dependency refresh cadence: quarterly `npm audit` review; the
  known moderate postcss advisory inside next's vendored copy rides the next
  Next.js upgrade.
- Anything cut from a quarter lands here with the reason, dated.
