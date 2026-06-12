-- CreateTable
CREATE TABLE "DemoEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "html" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoEmail_createdAt_idx" ON "DemoEmail"("createdAt");
