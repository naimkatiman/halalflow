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

-- FacilityBooking: add nullable first, backfill, then enforce NOT NULL + unique.
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
