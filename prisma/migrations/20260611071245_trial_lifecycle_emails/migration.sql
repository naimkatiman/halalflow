-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "trialReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "trialWinbackSentAt" TIMESTAMP(3);
