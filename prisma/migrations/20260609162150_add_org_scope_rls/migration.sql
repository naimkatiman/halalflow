-- Denormalize orgId onto join-only tables so RLS is a flat column check
-- (no join subqueries). Add nullable, backfill from the parent's org, then
-- enforce NOT NULL. Backfill runs as the migration owner (superuser), which
-- bypasses RLS, so ordering vs. the policy creation below does not matter.

-- TemplateStep <- WorkflowTemplate.orgId
ALTER TABLE "TemplateStep" ADD COLUMN "orgId" TEXT;
UPDATE "TemplateStep" ts SET "orgId" = wt."orgId"
  FROM "WorkflowTemplate" wt WHERE ts."templateId" = wt."id";
ALTER TABLE "TemplateStep" ALTER COLUMN "orgId" SET NOT NULL;

-- Approval <- Workflow.orgId
ALTER TABLE "Approval" ADD COLUMN "orgId" TEXT;
UPDATE "Approval" a SET "orgId" = w."orgId"
  FROM "Workflow" w WHERE a."workflowId" = w."id";
ALTER TABLE "Approval" ALTER COLUMN "orgId" SET NOT NULL;

-- Comment <- Workflow.orgId
ALTER TABLE "Comment" ADD COLUMN "orgId" TEXT;
UPDATE "Comment" c SET "orgId" = w."orgId"
  FROM "Workflow" w WHERE c."workflowId" = w."id";
ALTER TABLE "Comment" ALTER COLUMN "orgId" SET NOT NULL;

-- AuditLog <- Workflow.orgId
ALTER TABLE "AuditLog" ADD COLUMN "orgId" TEXT;
UPDATE "AuditLog" al SET "orgId" = w."orgId"
  FROM "Workflow" w WHERE al."workflowId" = w."id";
ALTER TABLE "AuditLog" ALTER COLUMN "orgId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Approval_orgId_idx" ON "Approval"("orgId");
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId");
CREATE INDEX "Comment_orgId_idx" ON "Comment"("orgId");
CREATE INDEX "TemplateStep_orgId_idx" ON "TemplateStep"("orgId");
CREATE INDEX "WorkflowTemplate_orgId_idx" ON "WorkflowTemplate"("orgId");

-- AddForeignKey
ALTER TABLE "TemplateStep" ADD CONSTRAINT "TemplateStep_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Row-Level Security (the isolation backstop).
--
-- The runtime app connects as mosrev_app (non-superuser, non-owner), so ENABLE
-- applies to it. FORCE is belt-and-suspenders should table ownership ever move
-- to a non-superuser. current_setting('app.current_org_id', true) returns NULL
-- when unset (the `true` = missing_ok), so any connection that has not run
-- set_config sees ZERO rows and can INSERT none -> fail closed.
--
-- The superuser owner (migrations) and mosrev_admin (BYPASSRLS, used for
-- signup provisioning, cross-org membership lookups, and Stripe webhooks) are
-- exempt by design. Policies are FOR ALL: USING gates SELECT/UPDATE/DELETE
-- visibility, WITH CHECK gates the orgId of rows written by INSERT/UPDATE.
-- ============================================================================

-- Organization: the tenant row itself is matched on its own id.
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "Organization"
  USING ("id" = current_setting('app.current_org_id', true))
  WITH CHECK ("id" = current_setting('app.current_org_id', true));

ALTER TABLE "OrgMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrgMember" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "OrgMember"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "WorkflowTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowTemplate" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "WorkflowTemplate"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "TemplateStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TemplateStep" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "TemplateStep"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workflow" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "Workflow"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "Approval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Approval" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "Approval"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "Comment"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "AuditLog"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));

ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON "Invitation"
  USING ("orgId" = current_setting('app.current_org_id', true))
  WITH CHECK ("orgId" = current_setting('app.current_org_id', true));
