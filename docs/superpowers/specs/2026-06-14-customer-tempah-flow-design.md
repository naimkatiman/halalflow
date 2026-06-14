# Customer "Tempah" End-to-End Booking Flow — Design

Date: 2026-06-14
Status: Approved (design), pending implementation plan
Branch base: `main` (worktree `worktree-customer-tempah-flow`)
Owner: Naim

## Goal

Ship the first production end-to-end customer journey: a member of the public finds a
mosque, books ("tempah") a facility through a guided wizard, pays by manual bank transfer
against an admin-provided QR/account, uploads a receipt, and the mosque office confirms the
payment to secure the slot. This journey is the priority distribution; all other modules are
secondary.

## Context — what already exists (do not rebuild from scratch)

The community/rental module already ships a working, if thin, flow:

- Public directory `/masjid` -> mosque page `/masjid/[slug]` -> single-page form
  `/masjid/[slug]/book` -> `POST /api/public/bookings` creates `FacilityBooking` at status
  `requested`.
- Tenant side: `/facilities` (post facilities), `/community` (mosque profile + publish),
  `/bookings` + `/api/bookings/[id]/transition` (status machine).
- Status machine (`src/lib/bookings.ts`): `requested -> approved -> paid -> completed`,
  with `declined`/`cancelled` terminal. Approve sets `quotedAmount`; `record_payment` posts a
  `sewaan` ledger entry. Transitions use a compare-and-swap `updateMany` (409 on conflict).
- Seed (with `DEMO_MODE=true`) ships tenant "Masjid Al-Noor" (slug `al-noor-trust`), 3
  facilities, published profile, sample bookings across every status.
- Conventions: Next.js 16 (params/searchParams are awaited Promises), Tailwind v4 tokens,
  emerald accent, `@phosphor-icons/react` (duotone), Bahasa Malaysia copy, money stored as
  integer sen (`formatMYR`/`parseRmToSen`), zod at API boundaries, inline error/success (no
  toast lib), public POST protected by IP rate-limit (no CSRF), RLS via `withOrg`, public reads
  via `prismaAdmin`.

### Gaps this design closes

1. No double-booking / availability check — two customers can secure the same slot.
2. No notifications — customer and office both get nothing on submit; on-screen copy promises a
   callback that nothing triggers.
3. No price feedback to the customer; `isKariah` collected but rate never shown.
4. Reference is a non-recoverable 8-char cuid slice; no status lookup.
5. No capacity guard; weak abuse protection.
6. No payment leg at all (the core of this request): no QR/bank instructions, no receipt, no
   customer-visible quote.

## Decisions (locked with user)

- Booking model: manual bank transfer. Customer requests -> admin approves with a quotation
  and a "pay now" amount -> customer transfers to the mosque's DuitNow QR / bank account ->
  customer uploads receipt -> admin verifies against the bank and confirms -> slot booked.
  No online payment gateway (Stripe stays for subscription billing only).
- UX: multi-step wizard (Fasiliti -> Tarikh & Masa -> Maklumat -> Semak & Sahkan).
- Notifications: email (existing `sendEmail` + demo outbox) AND WhatsApp deep-links (`wa.me`).
- Payment proof: customer uploads a receipt image in-app.
- Amount model: admin decides the "pay now" amount per booking (deposit or full).
- Receipt + QR storage: image bytes in Postgres (`UploadedImage`), served via a route. No
  external object store, no new dependency, no new credentials. Validation: `image/jpeg|png|webp`,
  <= 5 MB, magic-byte sniff. Swappable to object storage later behind the same serving route.
- Status-page access: unguessable `publicToken` in the URL (emailed + shown on confirmation),
  no login. The short human `reference` is for phone/quoting only and never grants access.
- Availability: competing `requested` bookings may overlap (office arbitrates); the hard block
  is at approve/confirm time — a slot already held by an `approved`/`payment_review`/`paid`
  booking cannot be double-approved (409).

## State machine (extended)

```
requested ──approve(total + amountDue)──▶ approved
approved  ──customer uploads receipt─────▶ payment_review
payment_review ──admin record_payment (paidAmount + ledger)──▶ paid   (slot BOOKED)
approved ──admin record_payment (manual, no receipt)──▶ paid          (offline payers)
payment_review ──admin reject_receipt──▶ approved                     (re-upload)
paid ──────────event done────────────────▶ completed
requested ──▶ declined | cancelled
approved | payment_review ──▶ cancelled
```

New status: `payment_review`. Transitions: `approved -> [payment_review, paid, cancelled]`,
`payment_review -> [paid, approved, cancelled]`. The existing `record_payment` action is KEPT
(more surgical than renaming): it now fires from both `approved` and `payment_review`, still
posts the `sewaan` ledger entry, and now also stores `paidAmount` on the booking (closing the
gap where the paid amount lived only in the ledger). New action `reject_receipt`
(`payment_review -> approved`, optional note). Receipt upload transitions
`approved -> payment_review` via the public token route (not an admin action). Keeping the
direct `approved -> paid` path lets the office mark offline/cash/WhatsApp payers paid without a
customer upload.

Customer-facing Bahasa labels: `requested`=Menunggu, `approved`=Diluluskan (Sila Bayar),
`payment_review`=Menyemak Bayaran, `paid`=Telah Ditempah, `completed`=Selesai,
`declined`=Ditolak, `cancelled`=Dibatalkan.

## Data model (one migration)

`FacilityBooking` — add:
- `reference String @unique` — short human code (e.g. 6–8 chars, unambiguous alphabet), shown
  in emails and for phone quoting.
- `publicToken String @unique` — long random token, drives the status URL.
- `amountDue Int?` — sen; the "pay now" figure the admin sets at approval.
- `paidAmount Int?` — sen; what the admin confirms was received (closes the existing gap where
  the paid amount lived only in the ledger).
- `receiptImageId String?` — FK -> `UploadedImage`.
- `receiptUploadedAt DateTime?`.
- `status` gains the `payment_review` value (string column; no enum change needed).

`MosqueProfile` — add org-level payment account:
- `bankName String?`, `bankAccountNo String?`, `bankAccountHolder String?`,
  `paymentInstructions String?`, `paymentQrImageId String?` (FK -> `UploadedImage`).

`UploadedImage` (new, org-scoped, RLS `org_isolation` like the other community tables):
- `id, orgId, mime, sizeBytes Int, data Bytes, createdAt`. Holds the org payment QR and
  per-booking receipts. Indexed by `orgId`.

Notes:
- `reference`/`publicToken` are generated server-side at booking creation. Reference uses a
  collision-resistant short code (retry-on-unique-violation); token uses crypto random.
- Backfill: existing rows need `reference`/`publicToken`. Migration generates them for any
  existing bookings (or the seed is re-run). The columns are added nullable then populated then
  marked unique, or populated in the same migration step.

## Surfaces

New customer-facing:
- `/masjid/[slug]/book` — rebuilt as a 4-step wizard. Server page loads facilities + slug;
  client wizard holds step state. Step 2 fetches availability; Step 4 shows an estimate from the
  facility rate (kariah vs awam) + deposit, with copy that the office confirms the final quote.
- `/masjid/[slug]/tempah/[token]` — status + payment page. Shows current status, the quote +
  `amountDue` once approved, the mosque QR + bank details + instructions, a receipt upload
  control, and a WhatsApp-office button. Re-renders state after upload.
- `GET /api/public/bookings/availability?facilityId=&date=` — returns occupied time ranges for
  that facility/date (bookings in `approved`/`payment_review`/`paid`/`completed`), so the wizard
  can surface/disable conflicts. `prismaAdmin`, no-store.
- `POST /api/public/bookings/[token]/receipt` — multipart receipt upload; validates image,
  writes `UploadedImage`, links it, transitions `approved -> payment_review`, stamps
  `receiptUploadedAt`, notifies office. Rate-limited; token-gated.
- `GET /api/uploads/[id]` — serves an `UploadedImage`. Payment QR is public (any visitor on the
  mosque page/status page). Receipt requires either the matching booking `publicToken` (query
  param) or an authenticated admin of the owning org. Returns bytes + content-type, no-store.

Changed admin-facing:
- `POST /api/bookings/[id]/transition` — `approve` captures `quotedAmount` (total) + `amountDue`
  (pay now); extend `record_payment` (now also from `payment_review`; stores `paidAmount`, posts
  ledger, overlap guard) and add `reject_receipt` (-> `approved`, optional note). Overlap guard
  added to `approve` and `record_payment`: reject (409) if another booking already holds the same
  facility/date/time in `approved`/`payment_review`/`paid`/`completed`.
- `/community` profile form (`ProfileForm` + `PUT /api/community/profile`) — add bank details +
  DuitNow QR upload (writes `UploadedImage`, links `paymentQrImageId`).
- `/bookings/[id]` detail + `BookingActions` — show `reference`, the receipt image (when
  present), a payment-claim banner at `payment_review`, and Confirm/Reject controls; approve form
  gains the `amountDue` field; show `paidAmount`.

## Notifications

Email builders added to `src/lib/notifications/` (mirroring invite/trial email modules), sent via
`sendEmail` (writes to `DemoEmail` outbox in demo mode):
- submit -> customer (reference + status link) and office (new request + admin link).
- approve -> customer (quote + `amountDue` + status link to pay).
- receipt uploaded -> office (verify payment + admin link).
- confirm -> customer (booked / disahkan).

WhatsApp: client-side `wa.me` deep-links prefilled with reference + key details, on the
confirmation screen and the status page (customer -> office). Office number from
`MosqueProfile.whatsapp`.

## Non-goals / deferred

- Online card payment / Stripe for bookings. Deferred.
- Object storage for images (Postgres bytes for v1). Deferred if volume grows.
- Customer self-reschedule/edit after submit (office cancels/re-books). Deferred.
- Bilingual (ms/en) + dark-mode variants for the new pages: `feat/i18n-dark-mode` is adding an
  i18n + theme foundation on a separate unmerged branch. New pages are built Bahasa-inline on the
  current `main` patterns; whoever merges i18n bilingual-izes them. Deferred (integration note).
- Captcha/Turnstile and a distributed (Redis) rate limiter. Deferred; v1 keeps the existing
  IP limiter plus a honeypot field on the public form.
- No Ramadan/ziarah/pantry/finance changes beyond the existing booking ledger entry.

## Verification

- Vitest unit/integration per layer: state-machine transitions + `validateActionInput`
  (`bookings.test.ts` extended), availability/overlap detection, reference/token generation
  (uniqueness + format), upload validation (mime/size/magic-byte), public submit + receipt
  routes, email builders.
- Manual end-to-end against the seed (`al-noor-trust`): wizard submit -> office email -> admin
  approve with amount -> status page shows QR + amount -> upload receipt -> office email ->
  admin confirm -> `paid` + ledger entry in `/finance`.
- Gate before any PR: `npx tsc --noEmit` clean and `npm test` green.

## Build phasing (one commit per layer; none > 15 files)

1. migration + schema (`FacilityBooking` fields + `payment_review`, `UploadedImage`,
   `MosqueProfile` payment fields).
2. domain logic + tests: extended state machine, overlap/availability, reference/token gen,
   client-side price estimate helper.
3. upload infra + tests: `UploadedImage` access helpers, multipart validation, serving route.
4. public API + tests: availability endpoint, extended submit (reference/token, capacity guard,
   honeypot), receipt upload route.
5. notifications + tests: email builders + wiring at each transition.
6. admin: profile payment fields + QR upload, transition extensions (`amountDue`,
   `confirm_payment`, `reject_receipt`, overlap), booking detail receipt view.
7. customer wizard UI (4 steps) + confirmation screen.
8. customer status/payment page UI (quote, QR, receipt upload, WhatsApp).
9. seed + docs + demo script (payment details, QR, a booking at `approved`/`payment_review`).
