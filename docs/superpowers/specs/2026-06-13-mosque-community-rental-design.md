# Mosque Community + Facility Rental — Design

Date: 2026-06-13
Branch: `mosrev/community-rental`
Status: approved by Naim (design + vitest sign-off in session)

## Context

mosrev today is a multi-tenant approval-workflow SaaS with a demo mode (PR #4) that runs the real
trial/billing lifecycle without Stripe/Resend keys. This feature expands the demo into the mosque
super-app story: the flagship module is **facility/space rental** (the mosque's core self-revenue),
plus thin community satellites (Ramadan directory, visitor info, charity pantry) that tell the
network story.

Research basis (17-agent verified sweep, 2026-06-13):

- Mosque facility booking in Malaysia is essentially unserved — paper forms at the office counter,
  availability in one AJK member's phone, "Bayaran secara atas talian tidak disediakan" at the
  flagship KL mosque. No aggregator exists.
- Mosque money is segregated by *tabung* (fund) as a religious requirement (FT Mufti Bayan Linnas
  218); rental income is the formal category *sewaan*. Only ~72 of ~418 Selangor mosques met the
  decreed financial-statement deadline for FY2023 — audit pain is regulatory.
- Two-tier pricing is universal: *ahli kariah* vs *awam* (e.g., RM700 vs RM1,500).
- Real bookings are request → office approval → deposit/payment, with cash/bank-transfer payment.
- 14 state regimes differ on deadlines/thresholds — never hardcode a state.
- Community directories die of staleness; listings must be mosque-owned with freshness signals.
- No app aggregates iftar/moreh/terawih info across mosques.

## Goals

1. Public, no-login mosque directory + per-mosque profile with facility rate cards, Ramadan
   programs, visitor info, and pantry info.
2. Public booking-request flow: request → admin approve → payment recorded → completed.
3. Rental payments auto-post to a fund-segregated (*tabung*) ledger with CSV penyata export.
4. Admin surfaces to manage facilities, the booking queue, finances, and the public listing.
5. Rich demo seed: a small network of mosques so the directory feels alive on the demo deployment.
6. Modern look: free-license mosque photography, existing Phosphor icon system.

## Non-goals (deferred, logged)

- AI voice-to-task generation (deferred by Naim in this session).
- Online payment for bookings (real practice is cash/transfer; demo records payments).
- Multi-payee payment splits; Ramadan sponsorship slot calendar with checkout.
- PDF penyata (CSV only for now; pdf-lib receipt pattern exists for later).
- Tauliah/speaker compliance tracking; per-state rule packs; WhatsApp notifications.
- Maps/geolocation (address + state text only).

## Data model

Five new Prisma models. All are org-scoped with the existing RLS `org_isolation` policy and
denormalized `orgId` (copy the policy + grant pattern from
`prisma/migrations/20260609162150_add_org_scope_rls`). Money is stored as **integer sen**, rendered
with `Intl.NumberFormat('ms-MY', { currency: 'MYR' })`. Migration name:
`20260613000000_add_community_rental`.

### MosqueProfile (1:1 Organization)

- `orgId` (unique), public listing rides on `Organization.slug`
- `displayName`, `description`, `address`, `city`, `state` (Malaysian state/FT — 13 states + 3
  federal territories, String column validated by a zod enum), `phone`, `whatsapp`, `photoUrl`
- Visitor info: `visitorsWelcome` bool, `visitorHours`, `dressCode`, `tourAvailable` bool, `tourNote`
- Pantry info: `pantryAvailable` bool, `pantryType` (`open` = infaq-funded, open to all |
  `asnaf` = council-verified eligibility), `pantryHours`, `pantryNote`
- `published` bool (public pages only ever read `published: true`)
- `createdAt`, `updatedAt` (updatedAt drives "Dikemaskini X hari lalu" freshness stamps)

### Facility

- `orgId`, `name`, `type` (`dewan` | `bilik_mesyuarat` | `bilik_kuliah` | `khemah` | `dapur`),
  `capacity` int, `description`, `photoUrl`
- `rateKariah` int (sen), `rateAwam` int (sen), `deposit` int (sen), `rateNote` (e.g., "per day")
- `rules` text (syariah/house rules shown at booking), `active` bool

### FacilityBooking

- `orgId`, `facilityId`
- `eventType` (`kenduri` | `akad_nikah` | `mesyuarat` | `kelas` | `kursus` | `lain_lain`)
- `eventDate` (DateTime, date-level), `startTime`, `endTime` (strings "HH:MM"), `pax` int, `notes`
- Applicant: `applicantName`, `applicantPhone`, `applicantEmail?`, `isKariah` bool (self-declared;
  office verifies — research: salary slip/IC verification today)
- `status`: `requested` | `approved` | `paid` | `completed` | `declined` | `cancelled`
- `quotedAmount?` int, `depositAmount?` int, `declineReason?`
- `decidedById?`, `decidedAt?`, `paidAt?`, `paymentNote?`, `createdAt`, `updatedAt`
- Indexes: `[orgId, status]`, `[orgId, eventDate]`, `[facilityId]`

### LedgerEntry

- `orgId`, `fund` (`sewaan` | `infaq` | `kutipan_jumaat` | `khairat` | `wakaf` | `qurban` |
  `ramadan`), `direction` (`in` | `out`), `amount` int (sen), `description`
- `refType?` (`booking`), `refId?`, `entryDate` (DateTime), `createdById?`, `createdAt`
- Recording a booking payment creates `{ fund: 'sewaan', direction: 'in', refType: 'booking' }`
  inside the same `withOrg` transaction that flips the booking to `paid`.
- Indexes: `[orgId, fund]`, `[orgId, entryDate]`

### RamadanProgram

- `orgId`, `type` (`iftar` | `moreh` | `terawih` | `tadarus` | `qiyamullail` | `bubur_lambuk`),
  `title?`, `description`, `time` (string), `schedule` (string, e.g., "Setiap malam" / "Jumaat
  sahaja"), `isFree` bool, `sponsorName?`, `updatedAt`
- Index: `[orgId, type]`

## State machine (unit-tested)

`src/lib/bookings.ts` exports a pure transition table:

```
requested → approved (set quotedAmount, optional depositAmount)
requested → declined (declineReason required)
approved  → paid     (records LedgerEntry; paymentNote optional)
approved  → cancelled
requested → cancelled
paid      → completed
```

Anything else is rejected with a 400. Admin transitions require org role `admin`+ (via
`roleSatisfies`), happen through one endpoint, and stamp `decidedById`/`decidedAt`/`paidAt`.

## Public surface (no login)

Reads use `prismaAdmin` through a dedicated `src/lib/public-directory.ts` that selects ONLY public
fields and always filters `published: true` + `active: true`. Rationale: RLS scoping is per-org via
`app.current_org_id`; the public directory is a cross-tenant read of published-only data. The
helper is the single funnel — no page touches `prismaAdmin` directly.

- `/masjid` — directory. Cards: photo, name, city/state, badges (Dewan untuk disewa · Iftar
  percuma · Pelawat dialu-alukan · Pantri komuniti). Filter by `state` and badge via query params.
- `/masjid/[slug]` — profile. Hero photo, about, then sections: **Sewaan Fasiliti** (rate cards
  showing kariah/awam rates + deposit + rules, "Mohon Tempahan" CTA), **Program Ramadan**,
  **Ziarah / Visit** (hours, dress code, tour note), **Pantri Komuniti** (type, hours — never any
  beneficiary identity, per research privacy rule). Freshness stamp from `updatedAt`.
- `/masjid/[slug]/book?facility=<id>` — booking request form (client component). Fields: facility
  (preselected), event type, date, start/end, pax, name, phone, email?, isKariah checkbox, notes.
  Submits to the public API; confirmation panel: "Pejabat masjid akan menghubungi anda."
- `/ramadan` — cross-mosque directory grouped by program type, filter by state. Sourced from
  published profiles' programs.
- Public Navbar variant gains links: **Direktori Masjid**, **Ramadan**. Landing page gets one
  community section linking to the directory (small, surgical edit).
- These pages are SEO-indexable (unlike `/t/[slug]`), added to `sitemap.ts`.

## Admin surface (login, org-scoped, subscription-gated like workflows)

- `/facilities` — list + create/edit. Photo chosen from the bundled image set (select) or URL.
- `/bookings` — queue, filter by status (default `requested`). Detail panel per booking with
  context-correct actions: Approve (quote + deposit inputs) / Decline (reason) / Record payment
  (amount prefilled from quote; creates ledger entry) / Complete / Cancel.
- `/finance` — per-tabung balance cards, entries table (filter by fund), manual entry form
  (so non-rental funds are usable), **Export CSV** (penyata-style: date, fund, direction,
  description, amount, reference).
- `/community` — edit MosqueProfile (listing, visitor, pantry, published toggle) + RamadanProgram
  CRUD.
- Navbar (authenticated) gains: Bookings, Facilities, Finance, Community. Mobile menu handles
  overflow; flat list, no dropdown for the demo.

## API routes

Admin routes follow the exact existing pattern (iron-session guard → orgId → `isOrgSubscribed` →
CSRF on mutations → zod → `withOrg` → `{ data }` / `{ error }`, `Cache-Control: no-store`,
`X-CSRF-Token` rotation):

- `GET/POST /api/facilities`, `PATCH/DELETE /api/facilities/[id]`
- `GET /api/bookings?status=&page=` (paginated like workflows)
- `POST /api/bookings/[id]/transition` — body `{ action, quotedAmount?, depositAmount?,
  declineReason?, paymentAmount?, paymentNote? }`; state machine enforces legality; `record_payment`
  writes the LedgerEntry in-transaction
- `GET /api/ledger?fund=&page=`, `POST /api/ledger` (manual entry), `GET /api/ledger/export` (CSV)
- `GET/PUT /api/community/profile`, `GET/POST /api/community/ramadan`,
  `PATCH/DELETE /api/community/ramadan/[id]`

Public route:

- `POST /api/public/bookings` — no session. zod-validated, **rate-limited** (reuse
  `checkRateLimit`, keyed by IP), resolves org by slug + `published: true`, facility must be
  `active`, inserts via `prismaAdmin` with explicit `orgId`, status `requested`. Returns a short
  reference code (booking id prefix). 404 for unpublished/unknown slugs.

## Demo seed

`prisma/seed.ts` extension (idempotent, same upsert/skip style):

- Primary org `al-noor-trust` gets a published profile (Selangor), 3 facilities (Dewan Serbaguna,
  Bilik Mesyuarat, Khemah), bookings in all six states, ledger entries across ≥4 funds, Ramadan
  programs, pantry (open rail).
- Two additional directory-only orgs (no admin memberships needed): `masjid-ar-rahman`
  (WP Kuala Lumpur) and `surau-an-nur` (Pulau Pinang), each with profile + facilities + programs so
  `/masjid` and `/ramadan` show a real network.
- Mosque-network orgs and demo bookings are seeded only when `DEMO_MODE=true`, matching the
  existing demo-workflow seeding gate.

## Images

~8 free-license photos (Unsplash/Pexels — licenses permit commercial use without attribution)
downloaded at implementation time, optimized to ≤300KB each, committed to `public/images/`
(`mosque-*.jpg`). Source URLs recorded in `docs/demo-mode.md` asset note. Used by landing section,
directory cards, profile heroes, and seed `photoUrl`s.

## Testing & verification

- **New dev dependency (approved): `vitest`.** `npm test` script. Unit tests for:
  `src/lib/bookings.ts` (every legal/illegal transition), ledger fund-total helper, CSV row builder.
- `npm run lint` + `npm run build` green per commit (Stop hook also type-checks).
- Playwright walkthrough of the demo script: directory → profile → book → admin approve → record
  payment → finance shows sewaan entry → CSV export.
- Seed run locally + on the `mosrev` Railway demo deployment.

## Phasing (one branch, layered commits, ≤15 files each)

1. `chore(test): vitest harness` — infra alone, per discipline
2. `feat(db): community + rental schema with RLS`
3. `feat(lib): booking state machine and tabung ledger posting` (+ tests)
4. `feat(api): facility CRUD, booking pipeline, ledger, community endpoints`
5. `chore(assets): free-license mosque imagery`
6. `feat(public): mosque directory, profile, booking request, Ramadan pages`
7. `feat(admin): facilities, bookings queue, finance, community editor + nav`
8. `feat(seed): demo mosque network` + `docs: runbook update`

## Risks honored from research

- No state-specific constants anywhere (deadlines/thresholds out of scope entirely).
- Fund segregation modeled from day one; no flat transaction table.
- Freshness stamps on all public listings; mosque-owned data only.
- Pantry view collects no beneficiary identity; open-rail wording inclusive (BM + English gloss).
- Booking T&Cs surface facility `rules` text in the request form (syariah rules visible pre-submit).
- Mosque-level identity (org), never personal accounts, so AJK handover survives.
