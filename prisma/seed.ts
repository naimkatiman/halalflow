import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultTemplates } from "./seed-templates";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("changeme123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@halalflow.app" },
    update: {},
    create: { email: "admin@halalflow.app", name: "Admin", password, role: "admin" },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@halalflow.app" },
    update: {},
    create: { email: "member@halalflow.app", name: "Siti Aminah", password, role: "user" },
  });

  let org = await prisma.organization.findUnique({ where: { slug: "al-noor-trust" } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Al-Noor Mosque Trust",
        slug: "al-noor-trust",
        members: {
          create: [
            { userId: admin.id, role: "owner" },
            { userId: member.id, role: "member" },
          ],
        },
      },
    });
  }

  const templates = [
    {
      name: "Expense Approval",
      description: "Standard 2-step approval for operational expenses",
      steps: [
        { name: "Finance Officer Review", description: "Initial check by finance officer", order: 0 },
        { name: "Board Approval", description: "Final sign-off by board member", order: 1 },
      ],
    },
    {
      name: "Zakat Distribution Request",
      description: "3-step workflow for zakat disbursement to beneficiaries",
      steps: [
        { name: "Eligibility Verification", description: "Verify beneficiary eligibility criteria", order: 0 },
        { name: "Asnaf Committee Review", description: "Review by zakat distribution committee", order: 1 },
        { name: "Fund Release Authorization", description: "Treasurer authorizes fund release", order: 2 },
      ],
    },
    {
      name: "Donation Acknowledgment",
      description: "Single-step process to acknowledge and receipt donations",
      steps: [
        { name: "Finance Officer Confirmation", description: "Confirm receipt and issue acknowledgment", order: 0 },
      ],
    },
    ...defaultTemplates,
  ];

  for (const t of templates) {
    const existing = await prisma.workflowTemplate.findFirst({ where: { name: t.name, orgId: org.id } });
    if (!existing) {
      await prisma.workflowTemplate.create({
        data: {
          orgId: org.id,
          name: t.name,
          description: t.description,
          steps: { create: t.steps },
        },
      });
    }
  }

  console.log("Seed complete: 2 users, 1 org, 6 templates");
  console.log("Login: admin@halalflow.app / changeme123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
