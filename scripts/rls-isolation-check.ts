/**
 * Live RLS isolation test — exercises the REAL withOrg/prisma/prismaAdmin helpers.
 * Proves: (1) org-scoped reads see only their org, (2) cross-org by-id reads return
 * null, (3) the bare app client with no context fails closed (zero rows),
 * (4) WITH CHECK rejects writing a row for another org.
 * Run: set -a; source .env; set +a; npx tsx isolation-test.mts
 * Temporary — not committed.
 */
import { prisma, prismaAdmin, withOrg } from "../src/lib/db";

let failures = 0;
function check(name: string, pass: boolean, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!pass) failures++;
}

const stamp = Date.now();
const slugA = `iso-a-${stamp}`;
const slugB = `iso-b-${stamp}`;

async function main() {
  // Provision two orgs + one template each via the BYPASSRLS admin client.
  const orgA = await prismaAdmin.organization.create({ data: { name: "Iso A", slug: slugA } });
  const orgB = await prismaAdmin.organization.create({ data: { name: "Iso B", slug: slugB } });
  const tplA = await prismaAdmin.workflowTemplate.create({ data: { orgId: orgA.id, name: "Template A" } });
  const tplB = await prismaAdmin.workflowTemplate.create({ data: { orgId: orgB.id, name: "Template B" } });

  try {
    // 1. Read isolation: withOrg(A) sees only A's templates.
    const aSees = await withOrg(orgA.id, (tx) => tx.workflowTemplate.findMany());
    check(
      "withOrg(A) sees only org A templates",
      aSees.length >= 1 && aSees.every((t) => t.orgId === orgA.id) && !aSees.some((t) => t.id === tplB.id),
      `saw ${aSees.length} rows`,
    );

    // 2. Cross-org by-id: withOrg(A) cannot fetch B's template even by its exact id.
    const crossById = await withOrg(orgA.id, (tx) => tx.workflowTemplate.findUnique({ where: { id: tplB.id } }));
    check("withOrg(A) cannot read org B template by id", crossById === null, `got ${crossById ? "a row" : "null"}`);

    // 3. Fail-closed: the bare app client with NO org context sees zero rows.
    const noCtx = await prisma.workflowTemplate.findMany();
    check("bare app client (no context) sees zero rows", noCtx.length === 0, `saw ${noCtx.length} rows`);

    // 4. WITH CHECK: withOrg(A) cannot INSERT a row tagged for org B.
    let threw = false;
    try {
      await withOrg(orgA.id, (tx) => tx.workflowTemplate.create({ data: { orgId: orgB.id, name: "smuggled" } }));
    } catch {
      threw = true;
    }
    check("WITH CHECK rejects cross-org insert (orgB row under ctx A)", threw);

    // 5. Sanity: withOrg(B) sees B's template (proves it is not just globally empty).
    const bSees = await withOrg(orgB.id, (tx) => tx.workflowTemplate.findMany());
    check("withOrg(B) sees org B template", bSees.some((t) => t.id === tplB.id), `saw ${bSees.length} rows`);
  } finally {
    await prismaAdmin.organization.delete({ where: { id: orgA.id } });
    await prismaAdmin.organization.delete({ where: { id: orgB.id } });
    void tplA;
  }

  console.log(`\n${failures === 0 ? "ALL PASS — RLS isolation holds" : `${failures} CHECK(S) FAILED`}`);
  await prisma.$disconnect();
  await prismaAdmin.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error("isolation-test crashed:", e);
  process.exit(2);
});
