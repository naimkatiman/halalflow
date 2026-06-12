-- Community & Rental module: mosque profile, facility booking, tabung ledger,
-- Ramadan programs. All five tables are org-scoped with RLS (org_isolation
-- policy), matching the pattern established in 20260609162150_add_org_scope_rls.

-- CreateTable
CREATE TABLE "MosqueProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "photoUrl" TEXT,
    "visitorsWelcome" BOOLEAN NOT NULL DEFAULT false,
    "visitorHours" TEXT,
    "dressCode" TEXT,
    "tourAvailable" BOOLEAN NOT NULL DEFAULT false,
    "tourNote" TEXT,
    "pantryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "pantryType" TEXT,
    "pantryHours" TEXT,
    "pantryNote" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "photoUrl" TEXT,
    "rateKariah" INTEGER NOT NULL DEFAULT 0,
    "rateAwam" INTEGER NOT NULL DEFAULT 0,
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "rateNote" TEXT,
    "rules" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityBooking" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "pax" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "applicantEmail" TEXT,
    "isKariah" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "quotedAmount" INTEGER,
    "depositAmount" INTEGER,
    "declineReason" TEXT,
    "paymentNote" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fund" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RamadanProgram" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "time" TEXT,
    "schedule" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "sponsorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamadanProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MosqueProfile_orgId_key" ON "MosqueProfile"("orgId");

-- CreateIndex
CREATE INDEX "MosqueProfile_published_state_idx" ON "MosqueProfile"("published", "state");

-- CreateIndex
CREATE INDEX "Facility_orgId_active_idx" ON "Facility"("orgId", "active");

-- CreateIndex
CREATE INDEX "FacilityBooking_orgId_status_idx" ON "FacilityBooking"("orgId", "status");

-- CreateIndex
CREATE INDEX "FacilityBooking_orgId_eventDate_idx" ON "FacilityBooking"("orgId", "eventDate");

-- CreateIndex
CREATE INDEX "FacilityBooking_facilityId_idx" ON "FacilityBooking"("facilityId");

-- CreateIndex
CREATE INDEX "LedgerEntry_orgId_fund_idx" ON "LedgerEntry"("orgId", "fund");

-- CreateIndex
CREATE INDEX "LedgerEntry_orgId_entryDate_idx" ON "LedgerEntry"("orgId", "entryDate");

-- CreateIndex
CREATE INDEX "RamadanProgram_orgId_type_idx" ON "RamadanProgram"("orgId", "type");

-- AddForeignKey
ALTER TABLE "MosqueProfile" ADD CONSTRAINT "MosqueProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityBooking" ADD CONSTRAINT "FacilityBooking_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityBooking" ADD CONSTRAINT "FacilityBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RamadanProgram" ADD CONSTRAINT "RamadanProgram_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Row-Level Security — same pattern as 20260609162150_add_org_scope_rls.
-- mosrev_app (runtime role, non-superuser) is blocked by ENABLE.
-- FORCE is belt-and-suspenders if table ownership ever shifts to non-superuser.
-- current_setting('app.current_org_id', true) returns NULL when unset
-- (missing_ok=true), so unscoped connections see zero rows and can insert none.
-- mosrev_admin (BYPASSRLS) and the migration owner (superuser) are exempt.
-- ============================================================================

ALTER TABLE "MosqueProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MosqueProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "MosqueProfile"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facility" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "Facility"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "FacilityBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacilityBooking" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "FacilityBooking"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "LedgerEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LedgerEntry" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "LedgerEntry"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "RamadanProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RamadanProgram" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "RamadanProgram"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));
