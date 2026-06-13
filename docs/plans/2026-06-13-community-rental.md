# Mosque Community + Facility Rental Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the demo flagship — public mosque directory + facility booking pipeline (request → approve → record payment → tabung ledger → CSV penyata) plus thin Ramadan/visitor/pantry satellites.

**Architecture:** Five new org-scoped Prisma models behind the existing RLS `org_isolation` pattern. Admin surfaces follow the exact existing route/page conventions (iron-session → orgId → `isOrgSubscribed` → CSRF → zod → `withOrg`). Public surfaces read published data through one `prismaAdmin` funnel (`src/lib/public-directory.ts`). Booking legality lives in a pure, vitest-tested state machine.

**Tech Stack:** Next.js 16 (App Router), Prisma 6 + Postgres RLS, iron-session, zod 4, Tailwind 4, @phosphor-icons/react, vitest (new devDep — approved).

**Spec:** `docs/superpowers/specs/2026-06-13-mosque-community-rental-design.md` — read it first. Branch: `mosrev/community-rental`.

**Conventions cheat-sheet (from codebase survey — follow exactly):**
- Money: integer **sen**. Display via `formatMYR()` (Task 2).
- API errors: `{ error: "message" }`; success `{ data }`; headers `"Cache-Control": "no-store"`; mutations return `"X-CSRF-Token": csrf.newToken`.
- Cards: `bg-white border border-zinc-200/70 rounded-xl p-5`. Primary button: `bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors`. Inputs: `focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`.
- Icons: `@phosphor-icons/react/dist/ssr` in server components, `@phosphor-icons/react` in client components.
- Status enums: lowercase snake_case strings (match `Workflow.status` style).
- Client mutations use `fetchWithCsrf` from `src/lib/csrf-client.ts`.

---

### Task 0: vitest harness (infra commit, nothing else rides along)

**Files:**
- Modify: `package.json` (devDependency + script)
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`
Expected: package.json gains `"vitest"` in devDependencies, lockfile updates.

- [ ] **Step 2: Add test script**

In `package.json` scripts, after `"lint"`:

```json
"test": "vitest run",
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 4: Verify harness runs green with no tests**

Run: `npm test`
Expected: exit 0, "No test files found" tolerated via passWithNoTests.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore(test): vitest harness for lib-level unit tests"
```

---

### Task 1: Prisma schema + RLS migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260613000000_add_community_rental/migration.sql`

- [ ] **Step 1: Add five models to `prisma/schema.prisma`**

Add relation fields to `Organization` (alongside existing `workflows`, `templates` relations):

```prisma
  mosqueProfile   MosqueProfile?
  facilities      Facility[]
  bookings        FacilityBooking[]
  ledgerEntries   LedgerEntry[]
  ramadanPrograms RamadanProgram[]
```

Append models:

```prisma
model MosqueProfile {
  id              String       @id @default(cuid())
  orgId           String       @unique
  org             Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  displayName     String
  description     String?
  address         String?
  city            String?
  state           String
  phone           String?
  whatsapp        String?
  photoUrl        String?
  visitorsWelcome Boolean      @default(false)
  visitorHours    String?
  dressCode       String?
  tourAvailable   Boolean      @default(false)
  tourNote        String?
  pantryAvailable Boolean      @default(false)
  pantryType      String?
  pantryHours     String?
  pantryNote      String?
  published       Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([published, state])
}

model Facility {
  id          String            @id @default(cuid())
  orgId       String
  org         Organization      @relation(fields: [orgId], references: [id], onDelete: Cascade)
  name        String
  type        String
  capacity    Int               @default(0)
  description String?
  photoUrl    String?
  rateKariah  Int               @default(0)
  rateAwam    Int               @default(0)
  deposit     Int               @default(0)
  rateNote    String?
  rules       String?
  active      Boolean           @default(true)
  bookings    FacilityBooking[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([orgId, active])
}

model FacilityBooking {
  id             String       @id @default(cuid())
  orgId          String
  org            Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  facilityId     String
  facility       Facility     @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  eventType      String
  eventDate      DateTime
  startTime      String
  endTime        String
  pax            Int          @default(0)
  notes          String?
  applicantName  String
  applicantPhone String
  applicantEmail String?
  isKariah       Boolean      @default(false)
  status         String       @default("requested")
  quotedAmount   Int?
  depositAmount  Int?
  declineReason  String?
  paymentNote    String?
  decidedById    String?
  decidedAt      DateTime?
  paidAt         DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([orgId, status])
  @@index([orgId, eventDate])
  @@index([facilityId])
}

model LedgerEntry {
  id          String       @id @default(cuid())
  orgId       String
  org         Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  fund        String
  direction   String
  amount      Int
  description String
  refType     String?
  refId       String?
  entryDate   DateTime     @default(now())
  createdById String?
  createdAt   DateTime     @default(now())

  @@index([orgId, fund])
  @@index([orgId, entryDate])
}

model RamadanProgram {
  id          String       @id @default(cuid())
  orgId       String
  org         Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  type        String
  title       String?
  description String
  time        String?
  schedule    String?
  isFree      Boolean      @default(true)
  sponsorName String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([orgId, type])
}
```

- [ ] **Step 2: Hand-author the migration**

First read `prisma/migrations/20260609162150_add_org_scope_rls/migration.sql` and note the exact GRANT lines used for existing tables (role names `mosrev_app`; `mosrev_admin` has BYPASSRLS). Then create `prisma/migrations/20260613000000_add_community_rental/migration.sql`. Generate the CreateTable SQL with:

Run: `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`
(If diff tooling fights you, write CreateTable SQL by hand mirroring `20260612000000_add_demo_email/migration.sql` style.)

Append for EACH of the five tables (`MosqueProfile`, `Facility`, `FacilityBooking`, `LedgerEntry`, `RamadanProgram`) — same policy text as existing tables:

```sql
ALTER TABLE "MosqueProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MosqueProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "MosqueProfile"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON "MosqueProfile" TO mosrev_app;
```

(repeat block per table; match GRANT syntax exactly to what the 20260609162150 migration uses, including any sequence grants if present there).

- [ ] **Step 3: Apply + generate**

Run: `npx prisma migrate deploy && npx prisma generate`
Expected: migration applies cleanly; client regenerates with new models.

- [ ] **Step 4: Verify build still green**

Run: `npm run lint && npm run build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260613000000_add_community_rental/migration.sql
git commit -m "feat(db): mosque profile, facilities, bookings, tabung ledger, Ramadan programs with RLS"
```

---

### Task 2: lib — money, booking state machine, ledger helpers (TDD)

**Files:**
- Create: `src/lib/money.ts`
- Create: `src/lib/bookings.ts`
- Create: `src/lib/ledger.ts`
- Test: `src/lib/bookings.test.ts`, `src/lib/ledger.test.ts`

- [ ] **Step 1: Write failing tests `src/lib/bookings.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUSES,
  canTransition,
  resolveAction,
  validateActionInput,
} from "./bookings";

describe("canTransition", () => {
  it("allows the six legal transitions", () => {
    expect(canTransition("requested", "approved")).toBe(true);
    expect(canTransition("requested", "declined")).toBe(true);
    expect(canTransition("requested", "cancelled")).toBe(true);
    expect(canTransition("approved", "paid")).toBe(true);
    expect(canTransition("approved", "cancelled")).toBe(true);
    expect(canTransition("paid", "completed")).toBe(true);
  });

  it("rejects every other pair", () => {
    const legal = new Set([
      "requested>approved", "requested>declined", "requested>cancelled",
      "approved>paid", "approved>cancelled", "paid>completed",
    ]);
    for (const from of BOOKING_STATUSES) {
      for (const to of BOOKING_STATUSES) {
        if (!legal.has(`${from}>${to}`)) {
          expect(canTransition(from, to), `${from}>${to}`).toBe(false);
        }
      }
    }
  });
});

describe("resolveAction", () => {
  it("maps actions to target statuses", () => {
    expect(resolveAction("approve")).toBe("approved");
    expect(resolveAction("decline")).toBe("declined");
    expect(resolveAction("record_payment")).toBe("paid");
    expect(resolveAction("complete")).toBe("completed");
    expect(resolveAction("cancel")).toBe("cancelled");
  });
});

describe("validateActionInput", () => {
  it("approve requires a positive quotedAmount", () => {
    expect(validateActionInput("approve", {}).ok).toBe(false);
    expect(validateActionInput("approve", { quotedAmount: 0 }).ok).toBe(false);
    expect(validateActionInput("approve", { quotedAmount: 150000 }).ok).toBe(true);
  });
  it("decline requires a reason", () => {
    expect(validateActionInput("decline", {}).ok).toBe(false);
    expect(validateActionInput("decline", { declineReason: "Tarikh penuh" }).ok).toBe(true);
  });
  it("record_payment requires a positive paymentAmount", () => {
    expect(validateActionInput("record_payment", {}).ok).toBe(false);
    expect(validateActionInput("record_payment", { paymentAmount: 70000 }).ok).toBe(true);
  });
  it("complete and cancel need no extras", () => {
    expect(validateActionInput("complete", {}).ok).toBe(true);
    expect(validateActionInput("cancel", {}).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Write failing tests `src/lib/ledger.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { FUNDS, fundTotals, ledgerCsv } from "./ledger";

const entries = [
  { fund: "sewaan", direction: "in", amount: 150000, description: "Sewaan dewan", entryDate: new Date("2026-06-01"), refType: "booking", refId: "abc123def" },
  { fund: "sewaan", direction: "out", amount: 20000, description: "Cuci dewan", entryDate: new Date("2026-06-02"), refType: null, refId: null },
  { fund: "infaq", direction: "in", amount: 50000, description: "Tabung infaq", entryDate: new Date("2026-06-03"), refType: null, refId: null },
];

describe("fundTotals", () => {
  it("nets in minus out per fund", () => {
    const totals = fundTotals(entries);
    expect(totals.sewaan).toBe(130000);
    expect(totals.infaq).toBe(50000);
  });
  it("returns zero for funds with no entries", () => {
    const totals = fundTotals([]);
    for (const f of FUNDS) expect(totals[f]).toBe(0);
  });
});

describe("ledgerCsv", () => {
  it("emits header plus one row per entry with RM decimals", () => {
    const csv = ledgerCsv(entries);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("date,fund,direction,description,amount_rm,reference");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain("1500.00");
    expect(lines[1]).toContain("booking:abc123def");
  });
  it("escapes commas and quotes in descriptions", () => {
    const csv = ledgerCsv([{ ...entries[0], description: 'Sewa "dewan", deposit' }]);
    expect(csv).toContain('"Sewa ""dewan"", deposit"');
  });
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm test`
Expected: FAIL — modules `./bookings`, `./ledger` not found.

- [ ] **Step 4: Implement `src/lib/money.ts`**

```ts
const myr = new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" });

/** Render integer sen as RM string, e.g. 150000 -> "RM1,500.00" */
export function formatMYR(sen: number): string {
  return myr.format(sen / 100);
}

/** Parse an "RM decimal" form input (e.g. "1500" or "1500.50") into integer sen. */
export function parseRmToSen(input: string): number | null {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
```

- [ ] **Step 5: Implement `src/lib/bookings.ts`**

```ts
export const BOOKING_STATUSES = [
  "requested", "approved", "paid", "completed", "declined", "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_ACTIONS = [
  "approve", "decline", "record_payment", "complete", "cancel",
] as const;
export type BookingAction = (typeof BOOKING_ACTIONS)[number];

export const EVENT_TYPES = [
  "kenduri", "akad_nikah", "mesyuarat", "kelas", "kursus", "lain_lain",
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  kenduri: "Kenduri",
  akad_nikah: "Akad Nikah",
  mesyuarat: "Mesyuarat",
  kelas: "Kelas",
  kursus: "Kursus",
  lain_lain: "Lain-lain",
};

export const FACILITY_TYPES = [
  "dewan", "bilik_mesyuarat", "bilik_kuliah", "khemah", "dapur",
] as const;

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  dewan: "Dewan",
  bilik_mesyuarat: "Bilik Mesyuarat",
  bilik_kuliah: "Bilik Kuliah",
  khemah: "Khemah",
  dapur: "Dapur",
};

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["approved", "declined", "cancelled"],
  approved: ["paid", "cancelled"],
  paid: ["completed"],
  completed: [],
  declined: [],
  cancelled: [],
};

const ACTION_TARGET: Record<BookingAction, BookingStatus> = {
  approve: "approved",
  decline: "declined",
  record_payment: "paid",
  complete: "completed",
  cancel: "cancelled",
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from as BookingStatus] ?? []).includes(to as BookingStatus);
}

export function resolveAction(action: BookingAction): BookingStatus {
  return ACTION_TARGET[action];
}

export interface ActionInput {
  quotedAmount?: number;
  depositAmount?: number;
  declineReason?: string;
  paymentAmount?: number;
  paymentNote?: string;
}

export function validateActionInput(
  action: BookingAction,
  input: ActionInput,
): { ok: true } | { ok: false; error: string } {
  if (action === "approve" && !(typeof input.quotedAmount === "number" && input.quotedAmount > 0)) {
    return { ok: false, error: "Approval requires a positive quoted amount" };
  }
  if (action === "decline" && !input.declineReason?.trim()) {
    return { ok: false, error: "Decline requires a reason" };
  }
  if (action === "record_payment" && !(typeof input.paymentAmount === "number" && input.paymentAmount > 0)) {
    return { ok: false, error: "Recording payment requires a positive amount" };
  }
  return { ok: true };
}
```

- [ ] **Step 6: Implement `src/lib/ledger.ts`**

```ts
export const FUNDS = [
  "sewaan", "infaq", "kutipan_jumaat", "khairat", "wakaf", "qurban", "ramadan",
] as const;
export type Fund = (typeof FUNDS)[number];

export const FUND_LABELS: Record<string, string> = {
  sewaan: "Sewaan",
  infaq: "Infaq",
  kutipan_jumaat: "Kutipan Jumaat",
  khairat: "Khairat",
  wakaf: "Wakaf",
  qurban: "Qurban",
  ramadan: "Ramadan",
};

export interface LedgerLike {
  fund: string;
  direction: string;
  amount: number;
  description: string;
  entryDate: Date;
  refType?: string | null;
  refId?: string | null;
}

export function fundTotals(entries: LedgerLike[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const f of FUNDS) totals[f] = 0;
  for (const e of entries) {
    const sign = e.direction === "out" ? -1 : 1;
    totals[e.fund] = (totals[e.fund] ?? 0) + sign * e.amount;
  }
  return totals;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function ledgerCsv(entries: LedgerLike[]): string {
  const header = "date,fund,direction,description,amount_rm,reference";
  const rows = entries.map((e) =>
    [
      e.entryDate.toISOString().slice(0, 10),
      e.fund,
      e.direction,
      csvCell(e.description),
      (e.amount / 100).toFixed(2),
      e.refType && e.refId ? `${e.refType}:${e.refId}` : "",
    ].join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}
```

- [ ] **Step 7: Run tests, verify green**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 8: Lint + commit**

```bash
npm run lint
git add src/lib/money.ts src/lib/bookings.ts src/lib/ledger.ts src/lib/bookings.test.ts src/lib/ledger.test.ts
git commit -m "feat(lib): booking state machine, tabung ledger helpers, MYR money utils"
```

---

### Task 3: facilities CRUD API

**Files:**
- Create: `src/app/api/facilities/route.ts` (GET list, POST create)
- Create: `src/app/api/facilities/[id]/route.ts` (PATCH, DELETE)

Pattern reference: copy guard/CSRF/zod/withOrg structure from `src/app/api/templates/route.ts` and `src/app/api/templates/[id]/route.ts`.

- [ ] **Step 1: Implement `src/app/api/facilities/route.ts`**

GET: session + orgId guard → `isOrgSubscribed` (402) → `withOrg` → `tx.facility.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } })` → `{ data }`.

POST: additionally `roleSatisfies(session.orgRole, "admin")` (403 if not) + CSRF + zod:

```ts
const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(FACILITY_TYPES),
  capacity: z.number().int().min(0).max(100000).default(0),
  description: z.string().trim().max(2000).optional(),
  photoUrl: z.string().trim().max(500).optional(),
  rateKariah: z.number().int().min(0),
  rateAwam: z.number().int().min(0),
  deposit: z.number().int().min(0).default(0),
  rateNote: z.string().trim().max(200).optional(),
  rules: z.string().trim().max(4000).optional(),
  active: z.boolean().default(true),
});
```

Create with explicit `orgId: session.orgId`. Return 201 `{ data }` + rotated CSRF header.

- [ ] **Step 2: Implement `src/app/api/facilities/[id]/route.ts`**

PATCH: same guards as POST; `createSchema.partial()`; verify the facility exists in-org first (`findFirst({ where: { id, orgId } })` → 404). DELETE: same guards; 404 if absent; delete. (Bookings cascade — acceptable for demo; deactivation via `active:false` is the soft path the UI prefers.)

- [ ] **Step 3: Verify**

Run: `npm run lint && npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/facilities
git commit -m "feat(api): facility CRUD with admin role gate"
```

---

### Task 4: bookings + ledger APIs (the pipeline core)

**Files:**
- Create: `src/app/api/bookings/route.ts` (GET paginated)
- Create: `src/app/api/bookings/[id]/transition/route.ts` (POST)
- Create: `src/app/api/ledger/route.ts` (GET paginated, POST manual entry)
- Create: `src/app/api/ledger/export/route.ts` (GET CSV)

- [ ] **Step 1: `src/app/api/bookings/route.ts` GET**

Mirror `src/app/api/workflows/route.ts` pagination (PAGE_SIZE 20, `?status=&page=`). Include facility name: `include: { facility: { select: { name: true, type: true } } }`. Order `createdAt: "desc"`. Return `{ data, pagination }`.

- [ ] **Step 2: `src/app/api/bookings/[id]/transition/route.ts` POST**

Guards: session/org → subscription → `roleSatisfies(session.orgRole, "admin")` → CSRF. Body schema:

```ts
const transitionSchema = z.object({
  action: z.enum(BOOKING_ACTIONS),
  quotedAmount: z.number().int().positive().optional(),
  depositAmount: z.number().int().min(0).optional(),
  declineReason: z.string().trim().max(500).optional(),
  paymentAmount: z.number().int().positive().optional(),
  paymentNote: z.string().trim().max(500).optional(),
});
```

Core logic inside `withOrg(session.orgId, async (tx) => { ... })`:

```ts
const booking = await tx.facilityBooking.findFirst({ where: { id, orgId: session.orgId } });
if (!booking) return null; // -> 404 outside

const target = resolveAction(action);
if (!canTransition(booking.status, target)) {
  throw new TransitionError(`Cannot ${action} a booking in status ${booking.status}`);
}
const inputCheck = validateActionInput(action, body);
if (!inputCheck.ok) throw new TransitionError(inputCheck.error);

const now = new Date();
const updated = await tx.facilityBooking.update({
  where: { id: booking.id },
  data: {
    status: target,
    ...(action === "approve" && {
      quotedAmount: body.quotedAmount,
      depositAmount: body.depositAmount ?? null,
      decidedById: session.userId,
      decidedAt: now,
    }),
    ...(action === "decline" && {
      declineReason: body.declineReason,
      decidedById: session.userId,
      decidedAt: now,
    }),
    ...(action === "record_payment" && { paidAt: now, paymentNote: body.paymentNote ?? null }),
  },
});

if (action === "record_payment") {
  await tx.ledgerEntry.create({
    data: {
      orgId: session.orgId,
      fund: "sewaan",
      direction: "in",
      amount: body.paymentAmount!,
      description: `Sewaan: ${booking.applicantName} (${booking.eventType})`,
      refType: "booking",
      refId: booking.id,
      entryDate: now,
      createdById: session.userId,
    },
  });
}
return updated;
```

Define `class TransitionError extends Error {}` locally; catch it in the route's try/catch and return 400 `{ error: e.message }`. ZodError → 400 via `zodErrorMessage`. Everything else → 500.

- [ ] **Step 3: `src/app/api/ledger/route.ts`**

GET: `?fund=&page=` paginated (PAGE_SIZE 20), `where: { orgId, ...(fund && { fund }) }`, order `entryDate: "desc"`. Also return `totals: fundTotals(allEntriesForOrg)` — fetch totals with a second query `tx.ledgerEntry.findMany({ where: { orgId }, select: { fund: true, direction: true, amount: true, description: true, entryDate: true } })` (fine at demo scale).

POST (manual entry): admin role + CSRF + schema:

```ts
const entrySchema = z.object({
  fund: z.enum(FUNDS),
  direction: z.enum(["in", "out"]),
  amount: z.number().int().positive(),
  description: z.string().trim().min(1).max(300),
  entryDate: z.coerce.date().optional(),
});
```

- [ ] **Step 4: `src/app/api/ledger/export/route.ts` GET**

Session/org/subscription guards. Fetch all org entries ordered by `entryDate asc`, return:

```ts
return new NextResponse(ledgerCsv(entries), {
  status: 200,
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="penyata-${new Date().toISOString().slice(0, 10)}.csv"`,
    "Cache-Control": "no-store",
  },
});
```

- [ ] **Step 5: Verify + commit**

Run: `npm run lint && npm run build && npm test`
Expected: clean, tests still green.

```bash
git add src/app/api/bookings src/app/api/ledger
git commit -m "feat(api): booking transition pipeline posts sewaan payments to tabung ledger"
```

---

### Task 5: community profile + Ramadan APIs

**Files:**
- Create: `src/lib/states.ts`, `src/lib/community.ts`
- Create: `src/app/api/community/profile/route.ts` (GET, PUT upsert)
- Create: `src/app/api/community/ramadan/route.ts` (GET, POST)
- Create: `src/app/api/community/ramadan/[id]/route.ts` (PATCH, DELETE)

- [ ] **Step 1: `src/lib/states.ts`**

```ts
export const MALAYSIAN_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor",
  "Terengganu", "WP Kuala Lumpur", "WP Labuan", "WP Putrajaya",
] as const;
```

- [ ] **Step 2: `src/lib/community.ts`**

```ts
export const RAMADAN_TYPES = [
  "iftar", "moreh", "terawih", "tadarus", "qiyamullail", "bubur_lambuk",
] as const;

export const RAMADAN_TYPE_LABELS: Record<string, string> = {
  iftar: "Iftar / Berbuka",
  moreh: "Moreh",
  terawih: "Solat Terawih",
  tadarus: "Tadarus",
  qiyamullail: "Qiyamullail",
  bubur_lambuk: "Bubur Lambuk",
};

export const PANTRY_TYPE_LABELS: Record<string, string> = {
  open: "Terbuka kepada semua",
  asnaf: "Untuk asnaf berdaftar",
};
```

- [ ] **Step 3: profile route**

GET: return `tx.mosqueProfile.findUnique({ where: { orgId } })` (may be null → `{ data: null }`).
PUT: admin role + CSRF + schema; `upsert` on `orgId`:

```ts
const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.enum(MALAYSIAN_STATES),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  photoUrl: z.string().trim().max(500).optional(),
  visitorsWelcome: z.boolean().default(false),
  visitorHours: z.string().trim().max(200).optional(),
  dressCode: z.string().trim().max(300).optional(),
  tourAvailable: z.boolean().default(false),
  tourNote: z.string().trim().max(500).optional(),
  pantryAvailable: z.boolean().default(false),
  pantryType: z.enum(["open", "asnaf"]).optional(),
  pantryHours: z.string().trim().max(200).optional(),
  pantryNote: z.string().trim().max(500).optional(),
  published: z.boolean().default(false),
});
```

- [ ] **Step 4: ramadan routes**

POST/PATCH schema:

```ts
const programSchema = z.object({
  type: z.enum(RAMADAN_TYPES),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().min(1).max(1000),
  time: z.string().trim().max(60).optional(),
  schedule: z.string().trim().max(120).optional(),
  isFree: z.boolean().default(true),
  sponsorName: z.string().trim().max(160).optional(),
});
```

GET returns all org programs ordered by type. PATCH/DELETE mirror facilities `[id]` route (in-org findFirst → 404, then act).

- [ ] **Step 5: Verify + commit**

Run: `npm run lint && npm run build`

```bash
git add src/app/api/community src/lib/states.ts src/lib/community.ts
git commit -m "feat(api): mosque public listing and Ramadan program management"
```

---

### Task 6: public directory lib + public booking API

**Files:**
- Create: `src/lib/public-directory.ts`
- Create: `src/app/api/public/bookings/route.ts`

- [ ] **Step 1: `src/lib/public-directory.ts`** — the ONLY file allowed to read community data via `prismaAdmin`

Read `src/lib/db.ts` first to match the actual `prismaAdmin` export/import style.

```ts
import { prismaAdmin } from "@/lib/db";

const publicProfileSelect = {
  displayName: true, description: true, address: true, city: true, state: true,
  phone: true, whatsapp: true, photoUrl: true,
  visitorsWelcome: true, visitorHours: true, dressCode: true, tourAvailable: true, tourNote: true,
  pantryAvailable: true, pantryType: true, pantryHours: true, pantryNote: true,
  updatedAt: true,
} as const;

export async function getPublishedMosques(filters: { state?: string }) {
  return prismaAdmin.mosqueProfile.findMany({
    where: { published: true, ...(filters.state && { state: filters.state }) },
    select: {
      ...publicProfileSelect,
      org: {
        select: {
          slug: true,
          facilities: { where: { active: true }, select: { id: true, type: true } },
          ramadanPrograms: { select: { type: true, isFree: true } },
        },
      },
    },
    orderBy: { displayName: "asc" },
  });
}

export async function getMosqueBySlug(slug: string) {
  const org = await prismaAdmin.organization.findUnique({
    where: { slug },
    select: {
      slug: true,
      mosqueProfile: { select: { ...publicProfileSelect, published: true } },
      facilities: {
        where: { active: true },
        select: {
          id: true, name: true, type: true, capacity: true, description: true,
          photoUrl: true, rateKariah: true, rateAwam: true, deposit: true,
          rateNote: true, rules: true,
        },
        orderBy: { name: "asc" },
      },
      ramadanPrograms: {
        select: {
          type: true, title: true, description: true, time: true,
          schedule: true, isFree: true, sponsorName: true, updatedAt: true,
        },
        orderBy: { type: "asc" },
      },
    },
  });
  if (!org?.mosqueProfile?.published) return null;
  return org;
}

export async function getRamadanDirectory(filters: { state?: string }) {
  return prismaAdmin.ramadanProgram.findMany({
    where: {
      org: { mosqueProfile: { published: true, ...(filters.state && { state: filters.state }) } },
    },
    select: {
      type: true, title: true, description: true, time: true, schedule: true,
      isFree: true, sponsorName: true,
      org: { select: { slug: true, mosqueProfile: { select: { displayName: true, city: true, state: true } } } },
    },
    orderBy: [{ type: "asc" }],
  });
}
```

- [ ] **Step 2: `src/app/api/public/bookings/route.ts` POST**

No session, no CSRF (public form), rate-limited. Schema:

```ts
const publicBookingSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  facilityId: z.string().trim().min(1).max(50),
  eventType: z.enum(EVENT_TYPES),
  eventDate: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  pax: z.number().int().min(1).max(100000),
  applicantName: z.string().trim().min(1).max(160),
  applicantPhone: z.string().trim().min(6).max(30),
  applicantEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  isKariah: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
});
```

Flow: `checkRateLimit("public-booking:" + ip)` (read IP the same way the login route does) → 429 with retryAfter if blocked → zod parse → reject `eventDate` earlier than today (400 "Tarikh telah lepas") → resolve org via `prismaAdmin.organization.findUnique({ where: { slug }, select: { id: true, mosqueProfile: { select: { published: true } } } })` → 404 unless published → facility `findFirst({ where: { id: facilityId, orgId: org.id, active: true } })` → 404 → `prismaAdmin.facilityBooking.create` with explicit `orgId`, status `"requested"`, `applicantEmail: body.applicantEmail || null` → 201 `{ data: { reference: booking.id.slice(0, 8).toUpperCase() } }`.

- [ ] **Step 3: Verify + commit**

Run: `npm run lint && npm run build`

```bash
git add src/lib/public-directory.ts src/app/api/public/bookings/route.ts
git commit -m "feat(api): public mosque directory reads and rate-limited booking requests"
```

---

### Task 7: free-license imagery

**Files:**
- Create: `public/images/mosque-*.jpg` (~8 files)
- Modify: `docs/demo-mode.md` (asset attribution note)

- [ ] **Step 1: Source images**

Search Unsplash/Pexels for free-license photos: mosque exterior (2-3), mosque interior/prayer hall (2), hall/event space (1), iftar/communal meal (1), Quran/study (1), food charity (1). For each candidate, take the real CDN URL (`images.unsplash.com/photo-...?w=1600&q=75` or `images.pexels.com/...`) and download:

```bash
curl -L -o public/images/mosque-hero.jpg "<verified-cdn-url>&w=1600&q=75"
```

- [ ] **Step 2: Verify every file is a real image**

Run: `file public/images/*.jpg && ls -la public/images/`
Expected: each reported as JPEG, size 30KB–300KB. Anything 0-byte or HTML = broken URL; re-source it. **Do not commit a file you have not verified.**

- [ ] **Step 3: Record attribution in `docs/demo-mode.md`**

Append a short "Demo imagery" section listing each filename + its source page URL + license (Unsplash License / Pexels License).

- [ ] **Step 4: Commit**

```bash
git add public/images docs/demo-mode.md
git commit -m "chore(assets): free-license mosque imagery for directory and seeds"
```

---

### Task 8: public pages

**Files:**
- Create: `src/app/masjid/page.tsx` (directory)
- Create: `src/app/masjid/[slug]/page.tsx` (profile)
- Create: `src/app/masjid/[slug]/book/page.tsx` + `src/app/masjid/[slug]/book/BookingRequestForm.tsx`
- Create: `src/app/ramadan/page.tsx`
- Create: `src/components/ui/FreshnessStamp.tsx`
- Create: `src/components/landing/CommunityBand.tsx`
- Modify: `src/components/Navbar.tsx` (public variant links), `src/app/sitemap.ts`, `src/components/landing/LandingPage.tsx`

All pages are **server components** (async) calling `src/lib/public-directory.ts` directly — no client fetch for reads. Match landing-page styling (emerald palette) for page headers, app styling (zinc/white cards) for content blocks. Use plain `<img>` for photos (paths are local `/images/*` strings from seeds; avoids next.config remote-pattern changes).

- [ ] **Step 1: `src/components/ui/FreshnessStamp.tsx`**

```tsx
export function FreshnessStamp({ date }: { date: Date }) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  const label = days <= 0 ? "Dikemaskini hari ini" : days === 1 ? "Dikemaskini semalam" : `Dikemaskini ${days} hari lalu`;
  return <span className="text-xs text-zinc-400">{label}</span>;
}
```

- [ ] **Step 2: `/masjid` directory page**

`searchParams: { state?: string }`. Header: "Direktori Masjid" + sub "Cari masjid untuk sewaan dewan, program Ramadan, ziarah dan pantri komuniti." State filter: pill links (`/masjid?state=Selangor`) from `MALAYSIAN_STATES`, "Semua" clears. Grid `sm:grid-cols-2 lg:grid-cols-3` of cards: photo (h-44 object-cover rounded-t-xl), name, city · state, badges derived as: has facilities → "Dewan untuk disewa"; any program with `type === "iftar" && isFree` → "Iftar percuma"; `visitorsWelcome` → "Pelawat dialu-alukan"; `pantryAvailable` → "Pantri komuniti". Badge style: `inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5`. Card links to `/masjid/[slug]`. EmptyState when no published mosques. Metadata: `title: "Direktori Masjid — MosRev"`.

- [ ] **Step 3: `/masjid/[slug]` profile page**

`getMosqueBySlug` → `notFound()` if null. Layout: hero (photo + stacked header), description, contact row (phone `tel:` link, WhatsApp link `https://wa.me/<digits only>`), then sections in order, each rendered only when it has content:
1. **Sewaan Fasiliti** — facility cards: photo, name + `FACILITY_TYPE_LABELS[type]`, capacity (`UsersThree` icon), rates: "Ahli kariah {formatMYR(rateKariah)}" / "Awam {formatMYR(rateAwam)}" / "Deposit {formatMYR(deposit)}" + rateNote, rules in `text-xs text-zinc-500`, CTA `Mohon Tempahan` → `/masjid/[slug]/book?facility=<id>`.
2. **Program Ramadan** — rows: `RAMADAN_TYPE_LABELS[type]` badge, description, time/schedule, "Percuma" badge when isFree, "Tajaan: {sponsorName}" when set.
3. **Ziarah** — visitorHours, dressCode, tourNote when tourAvailable.
4. **Pantri Komuniti** — `PANTRY_TYPE_LABELS[pantryType]`, hours, note. Informational only — no identity collection.
Each section footer: `<FreshnessStamp date={profile.updatedAt} />`. `generateMetadata` from displayName.

- [ ] **Step 4: booking page + form**

`page.tsx` (server): resolve via `getMosqueBySlug`; `notFound()` if null; render `<BookingRequestForm slug={slug} facilities={facilities} preselect={searchParams.facility} />`.

`BookingRequestForm.tsx` (client): fields matching `publicBookingSchema` (facility select, event type select via `EVENT_TYPE_LABELS`, date input `min`=today, start/end time inputs, pax number, name, phone, optional email, isKariah checkbox "Saya ahli kariah masjid ini", notes textarea). Selected facility's `rules` shown above submit in an amber info box (`bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4`). Plain `fetch` POST to `/api/public/bookings` (public — NOT `fetchWithCsrf`), body includes `slug`. On 201: replace form with confirmation card — `CheckCircle` icon, "Permohonan diterima — rujukan {reference}", "Pejabat masjid akan menghubungi anda untuk pengesahan dan bayaran." On error: red error box with returned message. Submit button shows "Menghantar…" while pending.

- [ ] **Step 5: `/ramadan` page**

`searchParams: { state?: string }` + same state pills. `getRamadanDirectory` → group by `type` in `RAMADAN_TYPES` order; group header = label + Phosphor icon (iftar `ForkKnife`, moreh `Coffee`, terawih `MoonStars`, tadarus `BookOpen`, qiyamullail `Star`, bubur_lambuk `CookingPot`); rows show mosque displayName (link to `/masjid/[slug]`), city · state, description, time · schedule, Percuma badge. Header: "Direktori Ramadan — cari di mana untuk berbuka, moreh dan terawih." EmptyState if none.

- [ ] **Step 6: Navbar, landing band, sitemap**

Navbar public variant (landing nav): add "Direktori Masjid" → `/masjid`, "Ramadan" → `/ramadan` before Login. Auth variant untouched in this task.

`src/components/landing/CommunityBand.tsx`: emerald band between `HowItWorks` and `PricingFaq` — heading "Hubung jemaah, pelawat dan komuniti", one sentence, two CTAs (Direktori Masjid / Direktori Ramadan), one image from `public/images/`. Mount in `LandingPage.tsx`.

`src/app/sitemap.ts`: append `/masjid`, `/ramadan`, and one entry per published mosque (`getPublishedMosques({})` → `/masjid/${slug}`).

- [ ] **Step 7: Verify + commit**

Run: `npm run lint && npm run build`
Expected: clean; new routes listed in build output.

```bash
git add src/app/masjid src/app/ramadan src/components/ui/FreshnessStamp.tsx src/components/landing/CommunityBand.tsx src/components/landing/LandingPage.tsx src/components/Navbar.tsx src/app/sitemap.ts
git commit -m "feat(public): mosque directory, profile with booking request, Ramadan directory"
```

---

### Task 9: admin pages + navigation

**Files:**
- Create: `src/app/facilities/page.tsx`, `src/app/facilities/new/page.tsx`, `src/app/facilities/[id]/page.tsx`, `src/app/facilities/FacilityForm.tsx`
- Create: `src/app/bookings/page.tsx`, `src/app/bookings/[id]/page.tsx`, `src/app/bookings/[id]/BookingActions.tsx`
- Create: `src/app/finance/page.tsx`, `src/app/finance/ManualEntryForm.tsx`
- Create: `src/app/community/page.tsx`, `src/app/community/ProfileForm.tsx`, `src/app/community/RamadanManager.tsx`
- Modify: `src/components/Navbar.tsx` (auth nav items), `src/proxy.ts` (matcher), `src/components/ui/Badge.tsx` (BookingStatusBadge)

Server pages follow `src/app/workflows/page.tsx` shape: session guard → `requireActiveSubscription(orgId)` → `withOrg` reads → render. Client forms follow `NewWorkflowForm.tsx` shape: `fetchWithCsrf`, error state div, loading button text. RM inputs accept decimal RM and convert with `parseRmToSen` before POST; display existing sen with `formatMYR`.

- [ ] **Step 1: `BookingStatusBadge` in `src/components/ui/Badge.tsx`**

Add alongside StatusBadge (same size variants):

```ts
const BOOKING_COLORS: Record<string, string> = {
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-zinc-100 text-zinc-600 border-zinc-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-zinc-50 text-zinc-500 border-zinc-200",
};
```

Label text: status with `_` → space, capitalized.

- [ ] **Step 2: Facilities pages**

List page: card rows (photo thumb, name, type label, capacity, kariah/awam rates via `formatMYR`, active/inactive badge, edit link). Header CTA "New facility" → `/facilities/new`. EmptyState (icon `Buildings`) with CTA. `FacilityForm.tsx` (client) shared by new/edit: all `createSchema` fields; photo field = select of bundled images (the filenames committed in Task 7) plus a free-text URL input that overrides; POST `/api/facilities` or PATCH `/api/facilities/[id]`; redirect to `/facilities` on success. Edit page loads the facility server-side (`withOrg` + `findFirst({ where: { id, orgId } })`, `notFound()` if absent) and passes as `initial` prop. Delete: confirm-then-DELETE client button (reuse `src/components/DeleteButton.tsx` if its API fits, else local).

- [ ] **Step 3: Bookings queue + detail**

`/bookings` list: status filter links (`Semua` + each of the six statuses; default filter `requested`), paginated 20/page like workflows. Row: applicant name, facility name, event type label, `eventDate` via `toLocaleDateString("ms-MY")`, pax, `BookingStatusBadge`, "Kariah" badge when `isKariah`. Links to detail.

`/bookings/[id]` detail (server): full booking + facility; sections: event details, applicant (phone as `tel:` link, kariah flag), money (quoted/deposit via `formatMYR`, paymentNote, paidAt), decision info (declineReason, decidedAt). Renders `<BookingActions booking={...} />`.

`BookingActions.tsx` (client): renders only the legal actions for the current status (display logic mirrors the state machine):
- `requested`: Approve (inline quote RM input + optional deposit RM input → POST action `approve` with sen values), Decline (inline reason input → `decline`), Cancel.
- `approved`: Record payment (RM input prefilled with `quotedAmount/100` → `record_payment`), Cancel.
- `paid`: Mark completed (`complete`).
- terminal statuses: no actions, info text.
POST to `/api/bookings/[id]/transition` via `fetchWithCsrf`; on success `router.refresh()`. Error box for 400 messages.

- [ ] **Step 4: Finance page**

Server page: fetch entries + totals directly via `withOrg` (pages read DB directly like other server pages). Top: fund cards grid (7 funds, `FUND_LABELS`, `formatMYR(totals[fund])`, sewaan card highlighted with emerald border). Filter pills per fund (`?fund=` param). Table: date, fund label, direction (`ArrowUp` emerald for in / `ArrowDown` red for out), description, amount, reference (link to `/bookings/[refId]` when `refType === "booking"`). "Export CSV" = `<a href="/api/ledger/export" download>` styled as secondary button. `<ManualEntryForm />` (client) card: fund select, direction select, RM amount, description, date (default today) → POST `/api/ledger` → `router.refresh()`.

- [ ] **Step 5: Community page**

Server page loads profile + programs via `withOrg`. Two stacked cards:
1. `<ProfileForm initial={profile} slug={orgSlug} />` (client) — profileSchema fields grouped: Listing (name, description, address, city, state select, phone, whatsapp, photo select like FacilityForm), Ziarah (visitorsWelcome checkbox reveals hours/dressCode/tour fields), Pantri (pantryAvailable checkbox reveals type select + hours + note), prominent `published` toggle with helper "Paparan awam di /masjid/{slug}". PUT `/api/community/profile`. Show "Lihat halaman awam" link to `/masjid/[slug]` when published.
2. `<RamadanManager initial={programs} />` (client) — list (type label, description, time, edit/delete inline) + add form (programSchema fields). POST/PATCH/DELETE to ramadan endpoints; refresh local state from responses.

- [ ] **Step 6: Navbar + proxy**

`Navbar.tsx` auth items, after Templates: Bookings (`CalendarCheck`), Facilities (`Buildings`), Finance (`Coins`), Community (`UsersThree`) — then Billing, Settings as now. `src/proxy.ts` matcher: add `"/facilities/:path*", "/bookings/:path*", "/finance/:path*", "/community/:path*"` (match existing matcher syntax exactly).

- [ ] **Step 7: Verify + commit**

Run: `npm run lint && npm run build && npm test`

```bash
git add src/app/facilities src/app/bookings src/app/finance src/app/community src/components/Navbar.tsx src/proxy.ts src/components/ui/Badge.tsx
git commit -m "feat(admin): facilities, booking approval queue, tabung finance, community listing editor"
```

(If this exceeds 15 files, split into two commits along admin-pages / nav+badge lines.)

---

### Task 10: demo seed + docs

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `docs/demo-mode.md`

- [ ] **Step 1: Extend seed (inside the existing `DEMO_MODE=true` gate, idempotent like demo workflows)**

For primary org `al-noor-trust`:
- Upsert MosqueProfile (unique orgId): displayName "Masjid Al-Noor", state "Selangor", city "Shah Alam", published true, visitorsWelcome true with hours/dress code, pantryAvailable true `pantryType: "open"` with hours, photo from `/images/`, realistic BM description.
- Facilities (skip-if-exists by `findFirst({ where: { orgId, name } })`): Dewan Serbaguna (capacity 400, rateKariah 70000, rateAwam 150000, deposit 30000, rateNote "sehari", rules "Tiada pelamin/persandingan; kemas sebelum Maghrib; hentikan siaraya ketika azan"), Bilik Mesyuarat (40, 10000/20000, deposit 5000, rateNote "sesi 4 jam"), Khemah (200, 15000/25000, deposit 10000, rateNote "sehari").
- Bookings — one per status, dated relative to now (`new Date(Date.now() ± n*86400000)`): requested (kenduri, +21d), approved (akad_nikah, +14d, quoted 70000, deposit 30000), paid (kenduri, +7d, quoted 150000, paidAt set), completed (mesyuarat, −7d), declined (kenduri, +10d, reason "Tarikh bertembung program rasmi"), cancelled (kelas, +5d). decidedById = admin user id where applicable. Skip-if-exists guard: any booking already present for the org → skip the whole block (mirrors demo workflow seeding).
- LedgerEntries (skip if any entry exists for org): the paid booking's sewaan entry (refType "booking", refId), plus: kutipan_jumaat in 245000, infaq in 89000, khairat out 50000 "Sumbangan khairat kematian", sewaan out 20000 "Upah cuci dewan", wakaf in 500000 — entryDates spread over the past 30 days.
- RamadanPrograms (skip-if-exists per org): iftar (isFree, "Bubur lambuk dan juadah berbuka untuk 500 pax", time "18:45", schedule "Setiap hari Ramadan"), moreh ("Kuih-muih dan kopi selepas terawih"), terawih ("8 rakaat bersama imam hafiz jemputan", time "21:00", schedule "Setiap malam"), tadarus ("Tadarus selepas Subuh, sasaran khatam 30 juzuk").

Two directory-only orgs (upsert by slug, NO OrgMember rows, same default fields as existing org creation in the seed): `masjid-ar-rahman` ("Masjid Ar-Rahman", WP Kuala Lumpur, published, 2 facilities, iftar + terawih programs, tourAvailable true with tourNote) and `surau-an-nur` ("Surau An-Nur", Pulau Pinang, published, 1 facility, moreh + tadarus, pantry `asnaf`).

Use `prismaAdmin` exactly as the existing seed does; all writes carry explicit `orgId`.

- [ ] **Step 2: Run seed locally, twice**

Run (PowerShell): `$env:DEMO_MODE="true"; npm run db:seed; npm run db:seed`
Expected: completes both times; second run creates no duplicates.

- [ ] **Step 3: Update `docs/demo-mode.md`**

Add "Community + rental demo script" section: open `/masjid` → filter Selangor → open Masjid Al-Noor → Mohon Tempahan → submit → login admin → Bookings → approve → record payment → Finance shows sewaan entry → Export CSV → Community editor → `/ramadan` directory.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts docs/demo-mode.md
git commit -m "feat(seed): demo mosque network with bookings in every state and multi-fund ledger"
```

---

### Task 11: end-to-end verification

- [ ] **Step 1: Full gates**

Run: `npm run lint && npm run build && npm test`
Expected: all green. State the results — never "should work".

- [ ] **Step 2: Playwright walkthrough**

`npm run dev` with `DEMO_MODE=true`, then drive with Playwright MCP browser tools through the demo script — `/masjid` → filter → Masjid Al-Noor profile → Mohon Tempahan → submit (capture reference code) → login admin@halalflow.app / changeme123 → Bookings queue shows the new request → approve with quote → record payment → `/finance` shows the sewaan entry → CSV export responds 200 → `/ramadan` renders. Screenshot directory, profile, queue, finance.

- [ ] **Step 3: Fix anything found, re-run gates, commit fixes individually**

---

## Deferred (do NOT implement)

Voice AI tasks · online booking payment · payment splits · Ramadan sponsorship slot checkout · PDF penyata · tauliah tracking · state rule packs · WhatsApp notifications · maps.
