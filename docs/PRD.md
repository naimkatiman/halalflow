# MosRev — Product Requirements Document

Status: living document. Created 2026-06-11, derived from the shipped v1 product
(`docs/plans/2026-06-10-mosrev-completion-uiux.md`) and the pre-pivot roadmaps.
The 7-year plan that builds on this PRD lives in `docs/ROADMAP.md`.

## One-line

MosRev is a multi-tenant SaaS that gives masjid and Islamic community
organizations a clear, auditable approval workflow for their money and
decisions — who asked, who approved, where the receipt is.

## Problem

Masjid committees run on volunteer treasurers, WhatsApp threads, and paper
receipts. Spending approvals are informal, records are scattered, and handover
between committee generations loses the institutional memory. Donors and
auditors ask "who approved this?" and the answer is a shrug.

## Users

| Persona | Role in product | What they need |
|---|---|---|
| Treasurer / secretary | Org owner or admin | Set up templates, approve steps, export receipts, invite members |
| Committee member (AJK) | Member | Submit requests, see status without chasing people |
| Imam / chairman | Admin or approver | Approve on their phone with full context, in seconds |
| Auditor / donor (indirect) | Not a login (v1) | Receive PDF receipts and audit trails produced by the system |

## What v1 ships (live since 2026-06-11)

- **Multi-tenant orgs** — Postgres row-level security, every tenant query scoped
  through `withOrg`; cross-org access fails closed. `/t/<slug>` workspace routing.
- **Workflow engine** — templates with ordered steps, role-gated approvals
  (owner > admin > member hierarchy), comments, audit log, resubmit-on-reject.
- **Template library** — 6 seeded masjid templates on signup/onboarding,
  JSON import/export, delete with in-use guard.
- **Membership** — email invites (token + 7-day expiry, copy-link fallback),
  role management, multi-org switching.
- **PDF receipts** for approved workflows.
- **Billing** — Stripe subscription, $29/mo placeholder price, 30-day card-free
  trial enforced from org creation; paywall no-ops entirely when Stripe is
  unconfigured so self-hosters are never locked out.
- **Ops** — Railway deploy that self-migrates, health endpoint, seeded demo org.

## Non-goals for v1 (explicitly deferred, do not build casually)

Two-sided marketplace, vendor/donor accounts, custom domains, payouts/money
movement, native mobile apps, "super app" breadth. These appear on the roadmap
with their own gates; none are prerequisites for revenue.

## Success metrics

- Primary: paying organizations (target trajectory in `docs/ROADMAP.md`).
- Activation: org completes ≥1 real approval within 14 days of signup.
- Retention: org runs ≥4 workflows/month after month 3.
- Trust: zero cross-tenant data incidents (RLS isolation check stays in CI).

## Pricing

One plan, $29/mo per organization (placeholder until live-Stripe decision),
30-day free trial without a card. Self-hosted stays free and unrestricted —
the hosted product sells convenience, not artificial limits.

## Constraints and principles

- **Fail closed.** RLS denies by default; unknown orgs are not billable orgs;
  expired trials lose access rather than silently staying free.
- **Honest UI.** No invented statuses, no fake urgency; copy states what the
  system actually did (e.g. whether an invite email was really delivered).
- **Boring stack.** Next.js + Prisma + Postgres + Stripe. New dependencies need
  a reason that survives review.
- **Self-hostable.** Every billing/email integration must no-op cleanly when
  its key is absent.
