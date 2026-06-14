# Customer "Tempah" End-to-End Booking Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing thin facility-booking flow into a production end-to-end customer journey: guided wizard → request → admin quote + pay-now amount → manual bank transfer against an admin QR/account → customer receipt upload → admin confirms → slot booked, with email + WhatsApp notifications, availability/capacity guards, and a recoverable status page.

**Architecture:** Next.js 16 App Router (server pages with awaited `params`/`searchParams`, client forms with plain `fetch`), Prisma 6 + Postgres with RLS (`withOrg`) for tenant data and `prismaAdmin` (BYPASSRLS) for public/cross-org reads. Money is integer sen. New testable domain logic lives in small `src/lib/*` modules (TDD). Images (admin payment QR, customer receipts) are stored as bytes in a new `UploadedImage` table and served via a route. Spec: `docs/superpowers/specs/2026-06-14-customer-tempah-flow-design.md`.

**Tech Stack:** TypeScript, Next 16, React 19, Prisma 6, Postgres (RLS), zod 4, Tailwind v4, `@phosphor-icons/react`, Vitest, iron-session, Resend (+ demo outbox).

**Conventions (match these exactly):**
- API success envelope `{ data }`, error `{ error: "<flat string>" }`, every response `Cache-Control: no-store`.
- Public endpoints: IP rate-limit via `checkRateLimit`, NO CSRF. Authed endpoints: `validateCsrfToken` + `roleSatisfies(orgRole,"admin")` + `isOrgSubscribed`.
- Money helpers `formatMYR(sen)` / `parseRmToSen(str)` from `@/lib/money`.
- UI: emerald accent, cards `bg-white border border-zinc-200/70 rounded-xl`, inputs `rounded-lg border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`, primary button `bg-emerald-600 hover:bg-emerald-700 ... rounded-lg` + `.tap`, danger/pending tokens, phosphor duotone icons `aria-hidden`, Bahasa Malaysia copy, inline error/success (no toast).
- Next 16: `params`/`searchParams` are Promises — always `await`. Route handlers read multipart via `await request.formData()` (Node runtime).

**Commit discipline:** one commit per phase, none > 15 files, conventional-commit subject leading with the outcome. Run the verify command in each task before committing.

---

## File Structure (what gets created / modified)

**Created — domain logic (`src/lib`)**
- `src/lib/booking-codes.ts` — `generateReference()`, `generatePublicToken()`.
- `src/lib/booking-codes.test.ts`
- `src/lib/availability.ts` — `timeRangesOverlap()`, `BLOCKING_STATUSES`.
- `src/lib/availability.test.ts`
- `src/lib/booking-pricing.ts` — `estimateBooking(facility, isKariah)`.
- `src/lib/booking-pricing.test.ts`
- `src/lib/upload.ts` — `validateImageUpload(bytes, mime)`, `MAX_UPLOAD_BYTES`, `ALLOWED_IMAGE_MIME`.
- `src/lib/upload.test.ts`
- `src/lib/notifications/booking-email.ts` — 5 builders + `bookingStatusUrl()`.
- `src/lib/notifications/booking-email.test.ts`

**Created — API routes**
- `src/app/api/public/bookings/availability/route.ts` — GET occupied slots.
- `src/app/api/public/bookings/[token]/receipt/route.ts` — POST receipt upload.
- `src/app/api/uploads/[id]/route.ts` — GET serve image (QR public, receipt gated).
- `src/app/api/community/payment-qr/route.ts` — POST admin QR upload.

**Created — customer UI**
- `src/app/masjid/[slug]/book/BookingWizard.tsx` — 4-step wizard (replaces `BookingRequestForm.tsx` usage).
- `src/app/masjid/[slug]/book/loading.tsx` — skeleton.
- `src/app/masjid/[slug]/tempah/[token]/page.tsx` — status + payment server page.
- `src/app/masjid/[slug]/tempah/[token]/ReceiptUpload.tsx` — client receipt upload + WhatsApp.

**Modified**
- `prisma/schema.prisma` — `UploadedImage` model; `FacilityBooking` + `MosqueProfile` fields; `payment_review` is data-only.
- `prisma/migrations/<ts>_tempah_payment_flow/migration.sql` — new migration (generated + RLS hand-add).
- `src/lib/bookings.ts` — `payment_review` status, transitions, `reject_receipt` action, `validateActionInput`.
- `src/lib/bookings.test.ts` — extend.
- `src/components/ui/Badge.tsx` — `payment_review` label + color.
- `src/app/api/public/bookings/route.ts` — reference/token, capacity guard, honeypot, return token, customer+office email.
- `src/app/api/bookings/[id]/transition/route.ts` — `amountDue`, `paidAmount`, `reject_receipt`, overlap guard, approve/confirm emails.
- `src/app/bookings/[id]/page.tsx` — show reference, receipt image, amountDue, paidAmount.
- `src/app/bookings/[id]/BookingActions.tsx` — amountDue field, payment_review panel (record/reject).
- `src/app/community/ProfileForm.tsx` — bank fields + QR upload.
- `src/app/api/community/profile/route.ts` — accept bank fields.
- `src/app/masjid/[slug]/book/page.tsx` — render `BookingWizard`.
- `prisma/seed.ts` — al-noor-trust bank details + a booking at `payment_review` + references on existing bookings.
- `docs/demo-mode.md` (or the demo script doc) — extend the demo walkthrough.

---

## Phase 1 — Schema + migration

### Task 1: Add models/fields to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `UploadedImage` model** (after `RamadanProgram`, end of file)

```prisma
model UploadedImage {
  id        String       @id @default(cuid())
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  mime      String
  sizeBytes Int
  data      Bytes
  createdAt DateTime     @default(now())

  @@index([orgId])
}
```

- [ ] **Step 2: Add `uploadedImages UploadedImage[]` to the `Organization` model relation list** (alongside `facilities`, `bookings`, etc. around line 52-55).

- [ ] **Step 3: Add fields to `FacilityBooking`** (after `paymentNote`):

```prisma
  reference         String    @unique
  publicToken       String    @unique
  amountDue         Int?
  paidAmount        Int?
  receiptImageId    String?
  receiptUploadedAt DateTime?
```

- [ ] **Step 4: Add payment fields to `MosqueProfile`** (after `pantryNote`):

```prisma
  bankName            String?
  bankAccountNo       String?
  bankAccountHolder   String?
  paymentInstructions String?
  paymentQrImageId    String?
```

- [ ] **Step 5: Verify schema is valid**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid 🚀"

### Task 2: Create the migration with RLS for UploadedImage and backfill for new unique columns

**Files:**
- Create: `prisma/migrations/<timestamp>_tempah_payment_flow/migration.sql`

The two new columns `reference` and `publicToken` are `@unique` and NOT NULL. Existing rows (seed/demo) need values before the unique+notnull constraint applies. Write the migration by hand (do NOT run `prisma migrate dev` blindly — it will fail on NOT NULL with existing rows). Use the established RLS pattern from `20260613000000_add_community_rental/migration.sql`.

- [ ] **Step 1: Create the migration directory + file** with this SQL:

```sql
-- Tempah payment flow: UploadedImage store, booking reference/token + payment
-- fields, mosque payment-account fields. Adds RLS to UploadedImage matching
-- the org_isolation pattern in 20260613000000_add_community_rental.

-- UploadedImage table (org-scoped, RLS)
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UploadedImage_orgId_idx" ON "UploadedImage"("orgId");
ALTER TABLE "UploadedImage" ADD CONSTRAINT "UploadedImage_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UploadedImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadedImage" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "UploadedImage"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

-- FacilityBooking: add nullable first, backfill, then enforce.
ALTER TABLE "FacilityBooking" ADD COLUMN "reference" TEXT;
ALTER TABLE "FacilityBooking" ADD COLUMN "publicToken" TEXT;
ALTER TABLE "FacilityBooking" ADD COLUMN "amountDue" INTEGER;
ALTER TABLE "FacilityBooking" ADD COLUMN "paidAmount" INTEGER;
ALTER TABLE "FacilityBooking" ADD COLUMN "receiptImageId" TEXT;
ALTER TABLE "FacilityBooking" ADD COLUMN "receiptUploadedAt" TIMESTAMP(3);

-- Backfill existing rows with unique values (md5 of id is deterministic & unique).
UPDATE "FacilityBooking"
  SET "reference" = upper(substr(md5("id"), 1, 8)),
      "publicToken" = md5("id" || 'tok') || md5("id" || 'tok2')
  WHERE "reference" IS NULL;

ALTER TABLE "FacilityBooking" ALTER COLUMN "reference" SET NOT NULL;
ALTER TABLE "FacilityBooking" ALTER COLUMN "publicToken" SET NOT NULL;
CREATE UNIQUE INDEX "FacilityBooking_reference_key" ON "FacilityBooking"("reference");
CREATE UNIQUE INDEX "FacilityBooking_publicToken_key" ON "FacilityBooking"("publicToken");

-- MosqueProfile: payment account fields
ALTER TABLE "MosqueProfile" ADD COLUMN "bankName" TEXT;
ALTER TABLE "MosqueProfile" ADD COLUMN "bankAccountNo" TEXT;
ALTER TABLE "MosqueProfile" ADD COLUMN "bankAccountHolder" TEXT;
ALTER TABLE "MosqueProfile" ADD COLUMN "paymentInstructions" TEXT;
ALTER TABLE "MosqueProfile" ADD COLUMN "paymentQrImageId" TEXT;
```

- [ ] **Step 2: Mark applied / regenerate client.** If a dev DB is available: `npx prisma migrate dev` (it will detect the manual migration). Otherwise: `npx prisma generate` to refresh client types. Expected: Prisma Client regenerated with the new fields.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(tempah): schema for payment flow — uploads, booking reference/token, mosque bank fields"
```

---

## Phase 2 — Domain logic (TDD)

### Task 3: Booking status machine — `payment_review` + `reject_receipt`

**Files:**
- Modify: `src/lib/bookings.ts`
- Test: `src/lib/bookings.test.ts`

- [ ] **Step 1: Write failing tests** — append to `bookings.test.ts`; update the existing `canTransition` legal-set test to add `approved>payment_review`, `payment_review>paid`, `payment_review>approved`, `payment_review>cancelled`:

```ts
describe("payment_review flow", () => {
  it("approved can go to payment_review or paid", () => {
    expect(canTransition("approved", "payment_review")).toBe(true);
    expect(canTransition("approved", "paid")).toBe(true);
  });
  it("payment_review can go to paid, back to approved, or cancelled", () => {
    expect(canTransition("payment_review", "paid")).toBe(true);
    expect(canTransition("payment_review", "approved")).toBe(true);
    expect(canTransition("payment_review", "cancelled")).toBe(true);
  });
  it("reject_receipt resolves to approved", () => {
    expect(resolveAction("reject_receipt")).toBe("approved");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** Run: `npm test -- bookings`. Expected: failures on new transitions / `reject_receipt`.

- [ ] **Step 3: Implement in `src/lib/bookings.ts`:**
  - Add `"payment_review"` to `BOOKING_STATUSES` (after `approved`).
  - Add `"reject_receipt"` to `BOOKING_ACTIONS`.
  - `TRANSITIONS`: `approved: ["payment_review", "paid", "cancelled"]`; add `payment_review: ["paid", "approved", "cancelled"]`.
  - `ACTION_TARGET`: add `reject_receipt: "approved"` (`record_payment` stays `"paid"`).
  - `ActionInput`: add `amountDue?: number;` and `rejectReason?: string;`.
  - `validateActionInput`: keep existing checks; for `approve`, when `amountDue` is provided it must be `> 0` and `<= quotedAmount`:

```ts
if (action === "approve" && typeof input.amountDue === "number") {
  if (input.amountDue <= 0) return { ok: false, error: "Amount due must be positive" };
  if (typeof input.quotedAmount === "number" && input.amountDue > input.quotedAmount) {
    return { ok: false, error: "Amount due cannot exceed the quote" };
  }
}
```

- [ ] **Step 4: Run — expect PASS.** Run: `npm test -- bookings`.

### Task 4: Availability / overlap detection (TDD)

**Files:**
- Create: `src/lib/availability.ts`, `src/lib/availability.test.ts`

- [ ] **Step 1: Write failing test** (`availability.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { timeRangesOverlap, BLOCKING_STATUSES } from "./availability";

describe("timeRangesOverlap", () => {
  it("detects overlap", () => { expect(timeRangesOverlap("09:00","12:00","11:00","13:00")).toBe(true); });
  it("treats touching ranges as non-overlapping", () => { expect(timeRangesOverlap("09:00","12:00","12:00","14:00")).toBe(false); });
  it("detects containment", () => { expect(timeRangesOverlap("08:00","18:00","10:00","11:00")).toBe(true); });
  it("non-overlap when fully before", () => { expect(timeRangesOverlap("09:00","10:00","10:30","11:00")).toBe(false); });
});

describe("BLOCKING_STATUSES", () => {
  it("includes the four confirmed-side statuses", () => {
    expect([...BLOCKING_STATUSES].sort()).toEqual(["approved","completed","paid","payment_review"].sort());
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`npm test -- availability`).

- [ ] **Step 3: Implement `src/lib/availability.ts`:**

```ts
/** HH:MM ranges overlap when each starts before the other ends (touching = no overlap). */
export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

/** A booking in one of these statuses holds the slot; new approvals must not collide. */
export const BLOCKING_STATUSES = new Set(["approved", "payment_review", "paid", "completed"]);
```

- [ ] **Step 4: Run — expect PASS** (`npm test -- availability`).

### Task 5: Price estimate helper (TDD)

**Files:**
- Create: `src/lib/booking-pricing.ts`, `src/lib/booking-pricing.test.ts`

- [ ] **Step 1: Write failing test:**

```ts
import { describe, expect, it } from "vitest";
import { estimateBooking } from "./booking-pricing";
const f = { rateKariah: 70000, rateAwam: 150000, deposit: 30000 };

describe("estimateBooking", () => {
  it("uses kariah rate when isKariah", () => { expect(estimateBooking(f, true)).toEqual({ rate: 70000, deposit: 30000, total: 100000 }); });
  it("uses awam rate otherwise", () => { expect(estimateBooking(f, false)).toEqual({ rate: 150000, deposit: 30000, total: 180000 }); });
  it("falls back to awam when kariah rate is 0", () => { expect(estimateBooking({ rateKariah: 0, rateAwam: 150000, deposit: 0 }, true).rate).toBe(150000); });
});
```

- [ ] **Step 2: Run — expect FAIL** (`npm test -- booking-pricing`).

- [ ] **Step 3: Implement `src/lib/booking-pricing.ts`:**

```ts
export interface RateLike { rateKariah: number; rateAwam: number; deposit: number; }
export interface Estimate { rate: number; deposit: number; total: number; }

/** Estimated rate (sen): kariah rate when available + flagged, else awam. */
export function estimateBooking(f: RateLike, isKariah: boolean): Estimate {
  const rate = isKariah && f.rateKariah > 0 ? f.rateKariah : f.rateAwam;
  return { rate, deposit: f.deposit, total: rate + f.deposit };
}
```

- [ ] **Step 4: Run — expect PASS.**

### Task 6: Booking code generators (TDD)

**Files:**
- Create: `src/lib/booking-codes.ts`, `src/lib/booking-codes.test.ts`

- [ ] **Step 1: Write failing test:**

```ts
import { describe, expect, it } from "vitest";
import { generateReference, generatePublicToken, REFERENCE_ALPHABET } from "./booking-codes";

describe("generateReference", () => {
  it("is 8 chars from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const r = generateReference();
      expect(r).toHaveLength(8);
      for (const ch of r) expect(REFERENCE_ALPHABET).toContain(ch);
    }
  });
  it("is overwhelmingly unique across many draws", () => {
    const seen = new Set(Array.from({ length: 2000 }, () => generateReference()));
    expect(seen.size).toBeGreaterThan(1990);
  });
});

describe("generatePublicToken", () => {
  it("is a long url-safe token", () => {
    const t = generatePublicToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`npm test -- booking-codes`).

- [ ] **Step 3: Implement `src/lib/booking-codes.ts`:**

```ts
import { randomBytes, randomInt } from "crypto";

// Crockford-ish: no 0/O/1/I/L to keep references readable over the phone.
export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReference(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return out;
}

export function generatePublicToken(): string {
  return randomBytes(24).toString("base64url");
}
```

- [ ] **Step 4: Run — expect PASS.**

### Task 7: Image upload validation (TDD)

**Files:**
- Create: `src/lib/upload.ts`, `src/lib/upload.test.ts`

- [ ] **Step 1: Write failing test:**

```ts
import { describe, expect, it } from "vitest";
import { validateImageUpload, MAX_UPLOAD_BYTES } from "./upload";

const png = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0]);
const jpeg = new Uint8Array([0xff,0xd8,0xff,0xe0,0,0,0,0]);
const webp = new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]);

describe("validateImageUpload", () => {
  it("accepts a valid png", () => { expect(validateImageUpload(png, "image/png").ok).toBe(true); });
  it("accepts jpeg and webp", () => {
    expect(validateImageUpload(jpeg, "image/jpeg").ok).toBe(true);
    expect(validateImageUpload(webp, "image/webp").ok).toBe(true);
  });
  it("rejects a disallowed mime", () => { expect(validateImageUpload(png, "application/pdf").ok).toBe(false); });
  it("rejects mismatched magic bytes", () => { expect(validateImageUpload(jpeg, "image/png").ok).toBe(false); });
  it("rejects oversize", () => { const big = new Uint8Array(MAX_UPLOAD_BYTES + 1); big.set(png); expect(validateImageUpload(big, "image/png").ok).toBe(false); });
  it("rejects empty", () => { expect(validateImageUpload(new Uint8Array(0), "image/png").ok).toBe(false); });
});
```

- [ ] **Step 2: Run — expect FAIL** (`npm test -- upload`).

- [ ] **Step 3: Implement `src/lib/upload.ts`:**

```ts
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMime = (typeof ALLOWED_IMAGE_MIME)[number];

type Result = { ok: true; mime: AllowedMime } | { ok: false; error: string };

function sniff(bytes: Uint8Array): AllowedMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

/** Validate a candidate image upload by size, declared mime, and magic bytes. */
export function validateImageUpload(bytes: Uint8Array, declaredMime: string): Result {
  if (bytes.length === 0) return { ok: false, error: "Fail kosong" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "Saiz fail melebihi 5 MB" };
  if (!ALLOWED_IMAGE_MIME.includes(declaredMime as AllowedMime)) return { ok: false, error: "Hanya imej JPG, PNG atau WEBP dibenarkan" };
  const sniffed = sniff(bytes);
  if (sniffed !== declaredMime) return { ok: false, error: "Fail imej tidak sah" };
  return { ok: true, mime: sniffed };
}
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit Phase 2**

```bash
git add src/lib/bookings.ts src/lib/bookings.test.ts src/lib/availability.ts src/lib/availability.test.ts src/lib/booking-pricing.ts src/lib/booking-pricing.test.ts src/lib/booking-codes.ts src/lib/booking-codes.test.ts src/lib/upload.ts src/lib/upload.test.ts
git commit -m "feat(tempah): domain logic — payment_review machine, availability, pricing, codes, upload validation"
```

---

## Phase 3 — Upload infra (serving + admin QR endpoint)

### Task 8: Image serving route

**Files:**
- Create: `src/app/api/uploads/[id]/route.ts`

Serves an `UploadedImage`. Payment QR is public (visitors need it on the status page). Receipt requires the matching booking `publicToken` (`?token=`) or an authenticated admin of the owning org. Uses `prismaAdmin`; enforces access in code.

- [ ] **Step 1: Implement:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prismaAdmin } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { roleSatisfies } from "@/lib/roles";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  const image = await prismaAdmin.uploadedImage.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  // (a) mosque payment QR (public), (b) booking receipt with matching token, (c) authed admin of owner org.
  const isPaymentQr = await prismaAdmin.mosqueProfile.findFirst({ where: { paymentQrImageId: id }, select: { id: true } });
  let authorized = Boolean(isPaymentQr);
  if (!authorized && token) {
    const booking = await prismaAdmin.facilityBooking.findFirst({ where: { receiptImageId: id, publicToken: token }, select: { id: true } });
    authorized = Boolean(booking);
  }
  if (!authorized) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    authorized = Boolean(session.isLoggedIn && session.orgId === image.orgId && roleSatisfies(session.orgRole, "admin"));
  }
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });

  return new NextResponse(Buffer.from(image.data), {
    status: 200,
    headers: { "Content-Type": image.mime, "Cache-Control": "private, max-age=300", "Content-Length": String(image.sizeBytes) },
  });
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit`. Expected: no errors.

### Task 9: Admin payment-QR upload endpoint

**Files:**
- Create: `src/app/api/community/payment-qr/route.ts`

- [ ] **Step 1: Implement** (authed admin, multipart, replaces existing QR; requires a saved profile):

```ts
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { withOrg } from "@/lib/db";
import { SessionData, sessionOptions } from "@/lib/session";
import { validateCsrfToken } from "@/lib/csrf";
import { isOrgSubscribed } from "@/lib/require-subscription";
import { roleSatisfies } from "@/lib/roles";
import { validateImageUpload } from "@/lib/upload";

const json = (b: unknown, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(b, { status, headers: { "Cache-Control": "no-store", ...extra } });

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.isLoggedIn) return json({ error: "Unauthorized" }, 401);
    if (!session.orgId) return json({ error: "No active organization" }, 400);
    if (!(await isOrgSubscribed(session.orgId))) return json({ error: "Subscription required" }, 402);
    if (!roleSatisfies(session.orgRole, "admin")) return json({ error: "Forbidden" }, 403);
    const csrf = await validateCsrfToken(request);
    if (!csrf.valid) return json({ error: "Invalid CSRF token" }, 403);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Tiada fail" }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateImageUpload(bytes, file.type);
    if (!check.ok) return json({ error: check.error }, 400);

    const orgId = session.orgId;
    const imageId = await withOrg(orgId, async (tx) => {
      const profile = await tx.mosqueProfile.findUnique({ where: { orgId }, select: { paymentQrImageId: true } });
      if (!profile) throw new Error("NO_PROFILE");
      const img = await tx.uploadedImage.create({ data: { orgId, mime: check.mime, sizeBytes: bytes.length, data: Buffer.from(bytes) } });
      await tx.mosqueProfile.update({ where: { orgId }, data: { paymentQrImageId: img.id } });
      if (profile.paymentQrImageId) await tx.uploadedImage.deleteMany({ where: { id: profile.paymentQrImageId } });
      return img.id;
    });

    return json({ data: { imageId } }, 201, { "X-CSRF-Token": csrf.newToken });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_PROFILE") return json({ error: "Simpan profil dahulu sebelum memuat naik QR" }, 400);
    console.error("POST /api/community/payment-qr error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit`. Expected: no errors.

- [ ] **Step 3: Commit Phase 3**

```bash
git add src/app/api/uploads src/app/api/community/payment-qr
git commit -m "feat(tempah): image serving + admin payment-QR upload endpoints"
```

---

## Phase 4 — Public API (availability, submit, receipt)

### Task 10: Availability endpoint

**Files:**
- Create: `src/app/api/public/bookings/availability/route.ts`

- [ ] **Step 1: Implement** — returns occupied `{startTime,endTime}` ranges for a facility on a date:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { BLOCKING_STATUSES } from "@/lib/availability";
import { z } from "zod";

const q = z.object({ facilityId: z.string().trim().min(1).max(50), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (!checkRateLimit("availability:" + ip).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  const parsed = q.safeParse({ facilityId: request.nextUrl.searchParams.get("facilityId"), date: request.nextUrl.searchParams.get("date") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const day = new Date(parsed.data.date + "T00:00:00Z");
  const rows = await prismaAdmin.facilityBooking.findMany({
    where: { facilityId: parsed.data.facilityId, eventDate: day, status: { in: [...BLOCKING_STATUSES] } },
    select: { startTime: true, endTime: true }, orderBy: { startTime: "asc" },
  });
  return NextResponse.json({ data: { occupied: rows } }, { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit`.

### Task 11: Extend the public booking submit route

**Files:**
- Modify: `src/app/api/public/bookings/route.ts`

- [ ] **Step 1: Honeypot field.** Add `website: z.string().max(0).optional()` to `publicBookingSchema`. After `parse`, silently short-circuit bots with a fake success (no DB write, no enumeration signal):

```ts
if (parsed.website) return NextResponse.json({ data: { reference: "TEMPAH00", token: "x" } }, { status: 201, headers: { "Cache-Control": "no-store" } });
```

- [ ] **Step 2: Widen the org `select`** in step 4 to include `name`, `slug`, and `mosqueProfile { displayName, published }` so notifications have names.

- [ ] **Step 3: Capacity guard** — after the facility is fetched:

```ts
if (facility.capacity > 0 && parsed.pax > facility.capacity) {
  return NextResponse.json({ error: `Bilangan tetamu melebihi kapasiti (${facility.capacity} pax)` }, { status: 400, headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 4: Generate reference + token (collision retry) and create.** Replace the `create` + return block; add imports at top: `import { generateReference, generatePublicToken } from "@/lib/booking-codes";` `import { Prisma } from "@prisma/client";` `import { sendEmail } from "@/lib/notifications/email";` `import { buildBookingRequestCustomerEmail, buildBookingRequestOfficeEmail } from "@/lib/notifications/booking-email";`

```ts
const publicToken = generatePublicToken();
let booking: Awaited<ReturnType<typeof prismaAdmin.facilityBooking.create>> | undefined;
for (let attempt = 0; attempt < 5; attempt++) {
  try {
    booking = await prismaAdmin.facilityBooking.create({
      data: {
        orgId: org.id, facilityId: parsed.facilityId, eventType: parsed.eventType,
        eventDate: new Date(parsed.eventDate + "T00:00:00Z"),
        startTime: parsed.startTime, endTime: parsed.endTime, pax: parsed.pax,
        applicantName: parsed.applicantName, applicantPhone: parsed.applicantPhone,
        applicantEmail: parsed.applicantEmail || null, isKariah: parsed.isKariah,
        notes: parsed.notes, status: "requested",
        reference: generateReference(), publicToken,
      },
    });
    break;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
    throw e;
  }
}
if (!booking) return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
```

- [ ] **Step 5: Best-effort notifications** (must not fail the request):

```ts
const members = await prismaAdmin.orgMember.findMany({ where: { orgId: org.id, role: { in: ["owner", "admin"] } }, select: { user: { select: { email: true } } } });
const officeEmails = members.map((m) => m.user.email).filter(Boolean);
try {
  if (parsed.applicantEmail) await sendEmail(buildBookingRequestCustomerEmail({
    to: parsed.applicantEmail, reference: booking.reference, slug: parsed.slug, token: booking.publicToken,
    mosqueName: org.mosqueProfile!.displayName, facilityName: facility.name, eventDate: parsed.eventDate,
  }));
  if (officeEmails.length) await sendEmail(buildBookingRequestOfficeEmail({
    to: officeEmails, reference: booking.reference, bookingId: booking.id, mosqueName: org.mosqueProfile!.displayName,
    facilityName: facility.name, eventDate: parsed.eventDate, startTime: parsed.startTime, endTime: parsed.endTime,
    pax: parsed.pax, applicantName: parsed.applicantName, applicantPhone: parsed.applicantPhone,
  }));
} catch (e) { console.error("booking email error:", e); }

return NextResponse.json({ data: { reference: booking.reference, token: booking.publicToken } }, { status: 201, headers: { "Cache-Control": "no-store" } });
```

- [ ] **Step 6: Verify** — build email builders first (Phase 5 Task 13) or interleave; then `npx tsc --noEmit`. Expected: no errors.

### Task 12: Receipt upload route (customer, token-gated)

**Files:**
- Create: `src/app/api/public/bookings/[token]/receipt/route.ts`

- [ ] **Step 1: Implement** — validates the image, writes `UploadedImage` (via `prismaAdmin`, org from the booking), links it, CAS `approved → payment_review`, notifies office:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prismaAdmin } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateImageUpload } from "@/lib/upload";
import { canTransition } from "@/lib/bookings";
import { sendEmail } from "@/lib/notifications/email";
import { buildBookingReceiptOfficeEmail } from "@/lib/notifications/booking-email";

const json = (b: unknown, status = 200) => NextResponse.json(b, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
    if (!checkRateLimit("receipt:" + ip).allowed) return json({ error: "Too many requests" }, 429);

    const { token } = await params;
    const booking = await prismaAdmin.facilityBooking.findUnique({
      where: { publicToken: token },
      select: { id: true, orgId: true, status: true, reference: true, applicantName: true,
        facility: { select: { name: true } },
        org: { select: { members: { where: { role: { in: ["owner", "admin"] } }, select: { user: { select: { email: true } } } },
          mosqueProfile: { select: { displayName: true } } } } },
    });
    if (!booking) return json({ error: "Not found" }, 404);
    if (!canTransition(booking.status, "payment_review")) return json({ error: "Tempahan ini belum sedia untuk muat naik resit" }, 409);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Tiada fail" }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateImageUpload(bytes, file.type);
    if (!check.ok) return json({ error: check.error }, 400);

    const img = await prismaAdmin.uploadedImage.create({ data: { orgId: booking.orgId, mime: check.mime, sizeBytes: bytes.length, data: Buffer.from(bytes) } });
    const updated = await prismaAdmin.facilityBooking.updateMany({
      where: { id: booking.id, status: booking.status },
      data: { status: "payment_review", receiptImageId: img.id, receiptUploadedAt: new Date() },
    });
    if (updated.count === 0) { await prismaAdmin.uploadedImage.deleteMany({ where: { id: img.id } }); return json({ error: "Tempahan telah dikemaskini" }, 409); }

    const officeEmails = booking.org.members.map((m) => m.user.email).filter(Boolean);
    try {
      if (officeEmails.length) await sendEmail(buildBookingReceiptOfficeEmail({
        to: officeEmails, reference: booking.reference, bookingId: booking.id,
        mosqueName: booking.org.mosqueProfile?.displayName ?? "", applicantName: booking.applicantName, facilityName: booking.facility.name,
      }));
    } catch (e) { console.error("receipt email error:", e); }

    return json({ data: { status: "payment_review" } }, 201);
  } catch (error) {
    console.error("POST receipt error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit`.

- [ ] **Step 3: Commit Phase 4**

```bash
git add src/app/api/public/bookings
git commit -m "feat(tempah): public availability, hardened submit (ref/token/capacity/honeypot), receipt upload"
```

---

## Phase 5 — Notifications

### Task 13: Booking email builders (TDD)

**Files:**
- Create: `src/lib/notifications/booking-email.ts`, `src/lib/notifications/booking-email.test.ts`

- [ ] **Step 1: Write failing test:**

```ts
import { describe, expect, it } from "vitest";
import {
  buildBookingRequestCustomerEmail, buildBookingApprovedCustomerEmail,
  buildBookingConfirmedCustomerEmail, bookingStatusUrl,
} from "./booking-email";

describe("booking emails", () => {
  it("customer request email carries reference + status link", () => {
    const m = buildBookingRequestCustomerEmail({ to: "a@b.com", reference: "ABCD2345", slug: "al-noor-trust", token: "tok123", mosqueName: "Masjid Al-Noor", facilityName: "Dewan", eventDate: "2026-07-01" });
    expect(m.to).toBe("a@b.com");
    expect(m.subject).toContain("ABCD2345");
    expect(m.text).toContain(bookingStatusUrl("al-noor-trust", "tok123"));
  });
  it("approved email mentions the amount", () => {
    const m = buildBookingApprovedCustomerEmail({ to: "a@b.com", reference: "ABCD2345", slug: "s", token: "t", mosqueName: "M", amountDueSen: 30000 });
    expect(m.text).toContain("RM");
  });
  it("confirmed email confirms the booking", () => {
    const m = buildBookingConfirmedCustomerEmail({ to: "a@b.com", reference: "ABCD2345", slug: "s", token: "t", mosqueName: "M" });
    expect(m.subject.toLowerCase()).toContain("disahkan");
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`npm test -- booking-email`).

- [ ] **Step 3: Implement `src/lib/notifications/booking-email.ts`** — mirror `invite-email.ts` (text + simple html), `import { type EmailMessage, escapeHtml } from "./email"`, `import { formatMYR } from "@/lib/money"`. Define a typed input interface per builder and:
  - `bookingStatusUrl(slug, token)` → `${BASE}/masjid/${slug}/tempah/${token}` (`BASE` = `(process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/,"")`).
  - `adminBookingUrl(bookingId)` → `${BASE}/bookings/${bookingId}`.
  - `buildBookingRequestCustomerEmail({to,reference,slug,token,mosqueName,facilityName,eventDate})` — subject `[MosRev] Permohonan tempahan diterima — ${reference}`; text: mosque, facility, date, "Pejabat akan menyemak dan menghantar sebutharga.", status link.
  - `buildBookingRequestOfficeEmail({to,reference,bookingId,mosqueName,facilityName,eventDate,startTime,endTime,pax,applicantName,applicantPhone})` — subject `[MosRev] Tempahan baharu — ${reference}`; text: details + admin link.
  - `buildBookingApprovedCustomerEmail({to,reference,slug,token,mosqueName,amountDueSen,quotedSen?})` — subject `[MosRev] Sebutharga tempahan ${reference}`; text: `formatMYR(amountDueSen)` to pay now, "Sila buat bayaran dan muat naik resit", status link.
  - `buildBookingReceiptOfficeEmail({to,reference,bookingId,mosqueName,applicantName,facilityName})` — subject `[MosRev] Resit dimuat naik — ${reference}`; admin link.
  - `buildBookingConfirmedCustomerEmail({to,reference,slug,token,mosqueName})` — subject `[MosRev] Tempahan disahkan — ${reference}`; text confirms slot, status link.

- [ ] **Step 4: Run — expect PASS** (`npm test -- booking-email`).

- [ ] **Step 5: Commit Phase 5**

```bash
git add src/lib/notifications/booking-email.ts src/lib/notifications/booking-email.test.ts
git commit -m "feat(tempah): booking notification email builders"
```

---

## Phase 6 — Admin (transition, profile, booking detail)

### Task 14: Extend the transition route

**Files:**
- Modify: `src/app/api/bookings/[id]/transition/route.ts`

- [ ] **Step 1: Schema** — add `amountDue: z.number().int().positive().max(100_000_000).optional()` and `rejectReason: z.string().trim().max(500).optional()` to `transitionSchema`.

- [ ] **Step 2: Approve writes `amountDue`** — extend the `approve` branch in `updateMany.data`: `amountDue: parsed.amountDue ?? parsed.quotedAmount`.

- [ ] **Step 3: Overlap guard** — import `{ BLOCKING_STATUSES, timeRangesOverlap } from "@/lib/availability";`. Inside `withOrg`, after `validateActionInput`, before `updateMany`:

```ts
if (target === "approved" || target === "paid") {
  const sameDay = await tx.facilityBooking.findMany({
    where: { facilityId: booking.facilityId, eventDate: booking.eventDate, status: { in: [...BLOCKING_STATUSES] }, id: { not: booking.id } },
    select: { startTime: true, endTime: true },
  });
  if (sameDay.some((b) => timeRangesOverlap(booking.startTime, booking.endTime, b.startTime, b.endTime))) {
    return { error: "Slot ini telah ditempah untuk tempahan lain", status: 409 } as const;
  }
}
```

- [ ] **Step 4: `record_payment` stores `paidAmount`** — extend its branch in `updateMany.data`: add `paidAmount: parsed.paymentAmount` (keep `paidAt`, `paymentNote`).

- [ ] **Step 5: `reject_receipt` branch** in `updateMany.data`:

```ts
...(parsed.action === "reject_receipt" && { receiptImageId: null, declineReason: parsed.rejectReason ?? null }),
```

- [ ] **Step 6: Notifications** — after the `withOrg` result is success and `parsed.action === "approve"`, send `buildBookingApprovedCustomerEmail` to `result.data.applicantEmail` (if set), using `amountDueSen: result.data.amountDue ?? result.data.quotedAmount`. After `record_payment` (status now `paid`), send `buildBookingConfirmedCustomerEmail`. Resolve `slug`+`mosqueName` once via `prismaAdmin.organization.findUnique({ where: { id: session.orgId }, select: { slug: true, mosqueProfile: { select: { displayName: true } } } })`. Wrap in try/catch; never fail the transition on email error.

- [ ] **Step 7: Verify** — `npx tsc --noEmit`.

### Task 15: Booking detail — reference, receipt, amounts; review/reject actions

**Files:**
- Modify: `src/app/bookings/[id]/page.tsx`, `src/app/bookings/[id]/BookingActions.tsx`

- [ ] **Step 1: `page.tsx`** — the `findFirst` already returns all booking fields.
  - Add a "Rujukan" line near the header: `<span className="font-mono text-xs text-zinc-500">{booking.reference}</span>`.
  - In "Kewangan", render `amountDue` ("Bayar sekarang") and `paidAmount` ("Jumlah dibayar") when non-null via `formatMYR`. Widen the block's render condition to include these.
  - When `booking.receiptImageId`: `<img src={`/api/uploads/${booking.receiptImageId}`} alt="Resit bayaran" className="mt-2 max-h-80 rounded-lg border border-zinc-200" />` inside the Kewangan block (admin authorized by session).
  - Pass `amountDue` and `quotedAmount` into the `BookingActions` `booking` prop.

- [ ] **Step 2: `BookingActions.tsx`**
  - `Booking` interface: add `amountDue?: number | null`.
  - Approve panel: add a 3rd input "Bayar sekarang (RM)" bound to new `amountDueRm` state; in `handleApprove` parse with `parseRmToSen`, default to the quote when blank, require `> 0` and `<= quotedAmount`, send as `amountDue`.
  - Add a `s === 'payment_review'` panel (amber): "Resit dimuat naik — sila semak" with:
    - "Sahkan bayaran" → reuse the payment panel (`record_payment`, prefill `amountDue ?? quotedAmount`).
    - "Tolak resit" → optional reason input → `act('reject_receipt', { rejectReason })`.
  - Keep the `approved` panel's "Rekod pembayaran" (offline path) + Cancel.

- [ ] **Step 3: Verify** — `npx tsc --noEmit`.

### Task 16: Community profile — bank fields + QR upload; status badge

**Files:**
- Modify: `src/app/api/community/profile/route.ts`, `src/app/community/ProfileForm.tsx`, `src/components/ui/Badge.tsx`

- [ ] **Step 1: Route** — add to `profileSchema`: `bankName`, `bankAccountNo`, `bankAccountHolder` (`z.string().trim().max(120).optional()`), `paymentInstructions` (`z.string().trim().max(1000).optional()`). They flow through the existing `...rest` spread into `upsert`. Do NOT add `paymentQrImageId` here.

- [ ] **Step 2: Form** — add a "Pembayaran" section (after Pantri) with the 4 bank/instruction inputs wired into the JSON `body`; extend `ProfileInitial` with the new string fields + `paymentQrImageId`. Add a QR upload: `<input type="file" accept="image/jpeg,image/png,image/webp">` posting `FormData` to `/api/community/payment-qr` via `fetchWithCsrf` on change; on success show preview `<img src={`/api/uploads/${imageId}`}>`. Disable the QR upload with helper text "Simpan profil dahulu sebelum memuat naik QR" until `savedPublished`/a saved profile exists.

- [ ] **Step 3: Badge** — in `src/components/ui/Badge.tsx`: `BOOKING_STATUS_LABELS.payment_review = "Menyemak Bayaran"`; `BOOKING_COLORS.payment_review = "bg-amber-50 text-amber-700 border border-amber-200"`. Update `paid: "Telah Ditempah"`.

- [ ] **Step 4: Verify** — `npx tsc --noEmit`.

- [ ] **Step 5: Commit Phase 6**

```bash
git add src/app/api/bookings src/app/bookings src/app/api/community/profile src/app/community/ProfileForm.tsx src/components/ui/Badge.tsx
git commit -m "feat(tempah): admin amountDue/paidAmount, payment_review review+reject, receipt view, mosque bank/QR"
```

---

## Phase 7 — Customer wizard

### Task 17: 4-step booking wizard

**Files:**
- Create: `src/app/masjid/[slug]/book/BookingWizard.tsx`, `src/app/masjid/[slug]/book/loading.tsx`
- Modify: `src/app/masjid/[slug]/book/page.tsx`
- Delete: `src/app/masjid/[slug]/book/BookingRequestForm.tsx`

- [ ] **Step 1: `BookingWizard.tsx`** — `"use client"`, props `{ slug, facilities, preselect, whatsapp }` (`Facility` interface copied from the old form). Steps:
  - **1 Fasiliti**: facility cards (photo, type label, capacity, rates via `formatMYR`); select sets `facilityId`, advances.
  - **2 Tarikh & Masa**: `eventDate` (min today, max +730d), `startTime`/`endTime`, `pax` (max = `facility.capacity` when > 0, inline "melebihi kapasiti" check). On date change, `fetch('/api/public/bookings/availability?...')`, render occupied ranges as read-only chips; client overlap warning via `timeRangesOverlap` from `@/lib/availability`.
  - **3 Maklumat**: `applicantName`, `applicantPhone`, `applicantEmail`, `eventType` (`EVENT_TYPE_LABELS`), `isKariah`, `notes`, plus a visually-hidden honeypot `website` input (`tabIndex={-1}`, `autoComplete="off"`, `className="hidden"`).
  - **4 Semak & Sahkan**: summary + `estimateBooking(selectedFacility, isKariah)` (`formatMYR`), copy "Anggaran sahaja — pejabat akan sahkan sebutharga muktamad". Submit.
  - Progress "Langkah N/4"; "Seterusnya"/"Kembali" with per-step validation gating. Reuse `inputCls`/`labelCls`.
  - Submit POST `/api/public/bookings` (same body + `website`); on 201 read `{ reference, token }` → confirmation panel: CheckCircle, reference (mono), "Semak status & bayar" link to `/masjid/${slug}/tempah/${token}`, and a WhatsApp button (`https://wa.me/${(whatsapp||"").replace(/\D/g,"")}?text=...` prefilled with reference + facility + date) shown only when `whatsapp` is set. Map 429/404/400 to Bahasa messages.

- [ ] **Step 2: `loading.tsx`** — skeleton (`role="status"`) modeled on `src/app/workflows/loading.tsx`.

- [ ] **Step 3: `page.tsx`** — import `BookingWizard`; render `<BookingWizard slug={slug} facilities={org.facilities} preselect={preselect} whatsapp={org.mosqueProfile!.whatsapp ?? null} />` (`whatsapp` already in `getMosqueBySlug` via `publicProfileSelect`).

- [ ] **Step 4: Delete the old form** and confirm: `grep -r "BookingRequestForm" src` returns nothing.

- [ ] **Step 5: Verify** — `npx tsc --noEmit` and `npm run build`. Expected: build succeeds.

- [ ] **Step 6: Commit Phase 7**

```bash
git add src/app/masjid/[slug]/book
git commit -m "feat(tempah): 4-step customer booking wizard with availability + price estimate"
```

---

## Phase 8 — Customer status / payment page

### Task 18: Status + payment page

**Files:**
- Create: `src/app/masjid/[slug]/tempah/[token]/page.tsx`, `src/app/masjid/[slug]/tempah/[token]/ReceiptUpload.tsx`

- [ ] **Step 1: `page.tsx` (server)** — `await params` (`{slug, token}`). Load via `prismaAdmin` and verify slug + published:

```ts
const booking = await prismaAdmin.facilityBooking.findUnique({
  where: { publicToken: token },
  select: { reference: true, status: true, eventType: true, eventDate: true, startTime: true, endTime: true,
    pax: true, applicantName: true, quotedAmount: true, amountDue: true, paidAmount: true, declineReason: true, receiptImageId: true,
    facility: { select: { name: true } },
    org: { select: { slug: true, mosqueProfile: { select: { displayName: true, whatsapp: true, bankName: true,
      bankAccountNo: true, bankAccountHolder: true, paymentInstructions: true, paymentQrImageId: true, published: true } } } } },
});
if (!booking || booking.org.slug !== slug || !booking.org.mosqueProfile?.published) notFound();
```

Render header (mosque name + `BookingStatusBadge status={booking.status}` + reference mono) and a status-driven body:
  - `requested`: "Permohonan sedang disemak oleh pejabat masjid."
  - `approved` / `payment_review`: payment panel — `formatMYR(booking.amountDue ?? booking.quotedAmount ?? 0)` to pay, bank name/acc/holder, `paymentInstructions`, QR `<img src={`/api/uploads/${paymentQrImageId}`}>` when present, and `<ReceiptUpload slug token currentStatus={booking.status} />`. For `payment_review` add "Resit anda sedang disemak — anda boleh muat naik semula jika perlu."
  - `paid`: success — "Tempahan anda telah disahkan dan ditempah."
  - `completed`: "Tempahan selesai."
  - `declined`/`cancelled`: show `declineReason` if any.
  - Always: event summary (facility, `new Date(eventDate).toLocaleDateString('ms-MY')`, time, pax) + a WhatsApp-office button when `whatsapp` set.
  Add `export async function generateMetadata()` returning `{ title: "Status Tempahan — MosRev", robots: { index: false } }`.

- [ ] **Step 2: `ReceiptUpload.tsx` (client)** — props `{ slug, token, currentStatus }`. File input `accept="image/jpeg,image/png,image/webp"`; client size check (≤ 5 MB) before upload; `URL.createObjectURL` preview; POST `FormData` to `/api/public/bookings/${token}/receipt` (plain `fetch`). On 201 `router.refresh()` + "Resit dimuat naik. Pejabat akan mengesahkan bayaran." Map 400/409/429 to Bahasa.

- [ ] **Step 3: Verify** — `npx tsc --noEmit` and `npm run build`.

- [ ] **Step 4: Commit Phase 8**

```bash
git add src/app/masjid/[slug]/tempah
git commit -m "feat(tempah): customer status + payment page with QR, bank details, receipt upload"
```

---

## Phase 9 — Seed + docs

### Task 19: Seed bank details, references, a payment_review example

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `docs/demo-mode.md` (or the demo script doc)

- [ ] **Step 1: Import codes** at top of seed: `import { generateReference, generatePublicToken } from "../src/lib/booking-codes";`.

- [ ] **Step 2: Bank details** — add to the al-noor-trust `mosqueProfile.upsert` `create`: `bankName: "Bank Islam"`, `bankAccountNo: "1234 5678 9012"`, `bankAccountHolder: "Tabung Masjid Al-Noor"`, `paymentInstructions: "Pindahan ke akaun di atas atau imbas QR DuitNow. Muat naik resit selepas bayaran."`. (Leave `paymentQrImageId` unset.)

- [ ] **Step 3: References on every booking** — every `facilityBooking.create` in `seedDemoCommunity` now needs `reference: generateReference(), publicToken: generatePublicToken(),`. For the `approved` booking add `amountDue: 30000`.

- [ ] **Step 4: 7th booking at `payment_review`** — a `dewan` booking +18d, `status: "payment_review"`, `quotedAmount: 150000`, `amountDue: 30000`, `decidedById: adminId`, `decidedAt: new Date(now - 1 * dayMs)`, `receiptUploadedAt: new Date(now - 1 * dayMs)`, `reference`/`publicToken` set, `receiptImageId` left null (still demonstrates the review state). Increment `bookingsCreated`.

- [ ] **Step 5: Run the seed (if a dev DB exists)** — `DEMO_MODE=true npm run db:seed`. Expected: completes; `/bookings` shows a `payment_review` booking. No DB → just `npx tsc --noEmit` to confirm seed type-checks.

- [ ] **Step 6: Demo doc** — extend the walkthrough in `docs/demo-mode.md`: wizard submit → confirmation link → admin approve with "bayar sekarang" → status page bank/QR → upload receipt → admin "Sahkan bayaran" → `/finance` sewaan entry.

- [ ] **Step 7: Commit Phase 9**

```bash
git add prisma/seed.ts docs/demo-mode.md
git commit -m "feat(tempah): seed mosque bank details, booking references, payment_review example + demo script"
```

---

## Final verification (before PR)

- [ ] `npm test` — all suites green (bookings, availability, booking-pricing, booking-codes, upload, booking-email, plus existing ledger/morph).
- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `npm run build` — succeeds (RSC/client boundaries OK).
- [ ] Manual end-to-end against the seed (`DEMO_MODE=true`, dev DB): `/masjid/al-noor-trust` → wizard → submit → check office email in `/demo/outbox` → login admin → `/bookings` approve with amount → open status link → (set a QR via profile) → upload receipt → admin "Sahkan bayaran" → booking `paid` + `sewaan` entry in `/finance`.
- [ ] Then run `superpowers:finishing-a-development-branch`.

---

## Self-review notes (author)

- Spec coverage: availability (T4,10,14,17), notifications email+WhatsApp (T13; wizard/status WhatsApp buttons), price feedback (T5; wizard step 4), recoverable reference/token + status page (T6,11,18), capacity guard (T11,17), receipt upload (T7,12,18), admin amountDue/paidAmount/reject (T14,15), bank+QR (T9,16), payment_review machine (T3), seed (T19). All spec sections map to tasks.
- Type consistency: `estimateBooking`, `timeRangesOverlap`, `BLOCKING_STATUSES`, `validateImageUpload`/`MAX_UPLOAD_BYTES`, `generateReference`/`generatePublicToken`/`REFERENCE_ALPHABET`, and the email builder names are referenced identically across producing and consuming tasks.
- Honeypot returns a fake 201 (no enumeration signal). Reference uniqueness handled by P2002 retry. RLS added for `UploadedImage`. Public image bytes served via `prismaAdmin` with explicit authorization (QR public, receipt token/admin-gated). Email failures never fail the underlying request/transition.
- Ordering note: Phase 4 (submit/receipt) imports Phase 5 email builders — build Task 13 before Task 11 step 5 / Task 12, or accept a transient type error until Phase 5 lands. Subagent-driven execution should sequence 13 before 11–12's email wiring.
