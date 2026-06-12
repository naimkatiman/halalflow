import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultTemplates } from "../src/lib/default-templates";

// Seeding writes to RLS-protected tables, so it connects as the BYPASSRLS
// admin role. Falls back to DATABASE_URL only if the admin URL is unset.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL,
});

type DemoTemplate = {
  id: string;
  name: string;
  steps: { id: string; order: number; name: string }[];
};

type DemoDecision = {
  action: "approved" | "rejected";
  approverId: string;
  note?: string;
  at: Date;
};

// Mirrors POST /api/workflows + POST /api/workflows/[id]/approve: approvals
// are created pending for every template step, each decision (in step order,
// starting at step 0) sets the approval's status/approver/note, advances
// currentStep only on approve, and writes the same audit action/detail
// strings the routes write. Idempotent by title within the org.
async function createDemoWorkflow(opts: {
  orgId: string;
  template: DemoTemplate;
  title: string;
  description: string;
  createdById: string;
  createdAt: Date;
  decisions?: DemoDecision[];
  comments?: { userId: string; body: string; at: Date }[];
}): Promise<boolean> {
  const existing = await prisma.workflow.findFirst({
    where: { orgId: opts.orgId, title: opts.title },
  });
  if (existing) return false;

  const steps = [...opts.template.steps].sort((a, b) => a.order - b.order);
  const decisions = opts.decisions ?? [];
  const totalSteps = steps.length;

  // Replay the approve route's state machine to derive the final state.
  let currentStep = 0;
  let status = "in_progress";
  for (const decision of decisions) {
    if (decision.action === "approved") {
      currentStep += 1;
      status = currentStep >= totalSteps ? "approved" : "in_progress";
    } else {
      status = "rejected";
    }
  }

  await prisma.workflow.create({
    data: {
      orgId: opts.orgId,
      templateId: opts.template.id,
      title: opts.title,
      description: opts.description,
      status,
      currentStep,
      createdById: opts.createdById,
      createdAt: opts.createdAt,
      approvals: {
        // The app creates one pending approval per step at workflow creation;
        // stagger createdAt by 1s so `orderBy createdAt asc` keeps step order.
        create: steps.map((step, index) => {
          const decision = decisions[index];
          return {
            orgId: opts.orgId,
            stepId: step.id,
            status: decision?.action ?? "pending",
            approverId: decision?.approverId ?? null,
            note: decision?.note ?? null,
            createdAt: new Date(opts.createdAt.getTime() + index * 1000),
          };
        }),
      },
      comments: {
        create: (opts.comments ?? []).map((comment) => ({
          orgId: opts.orgId,
          userId: comment.userId,
          body: comment.body,
          createdAt: comment.at,
        })),
      },
      auditLogs: {
        create: [
          {
            orgId: opts.orgId,
            userId: opts.createdById,
            action: "created",
            detail: `Workflow created from template "${opts.template.name}"`,
            createdAt: opts.createdAt,
          },
          ...decisions.map((decision, index) => ({
            orgId: opts.orgId,
            userId: decision.approverId,
            action: decision.action,
            detail: `Step "${steps[index].name}" ${decision.action}${decision.note ? `: ${decision.note}` : ""}`,
            createdAt: decision.at,
          })),
        ],
      },
    },
  });
  return true;
}

async function seedDemoWorkflows(orgId: string, adminId: string, memberId: string) {
  const templateByName = async (name: string): Promise<DemoTemplate> => {
    const template = await prisma.workflowTemplate.findFirst({
      where: { orgId, name },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!template) throw new Error(`Demo seed: template "${name}" not found`);
    return template;
  };

  const expense = await templateByName("Expense Approval");
  const zakat = await templateByName("Zakat Distribution Request");
  const donation = await templateByName("Donation Acknowledgment");

  const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

  let created = 0;

  // 1. Fully approved: both steps signed off, a comment, full audit trail.
  if (
    await createDemoWorkflow({
      orgId,
      template: expense,
      title: "Ramadan Iftar Catering — RM 4,500",
      description:
        "Catering for community iftar, first week of Ramadan. 150 pax per night, quotation from Selera Kampung Catering attached.",
      createdById: memberId,
      createdAt: hoursAgo(72),
      decisions: [
        {
          action: "approved",
          approverId: adminId,
          note: "Quotation checked against last year's iftar spend. Within allocation.",
          at: hoursAgo(48),
        },
        {
          action: "approved",
          approverId: adminId,
          note: "Approved at the June board meeting.",
          at: hoursAgo(24),
        },
      ],
      comments: [
        {
          userId: memberId,
          body: "Caterer confirmed availability — deposit is due this Friday.",
          at: hoursAgo(47),
        },
      ],
    })
  )
    created++;

  // 2. In progress: step 1 of 3 approved, waiting on the committee.
  if (
    await createDemoWorkflow({
      orgId,
      template: zakat,
      title: "Zakat Aid — Family in Kampung Baru",
      description:
        "Monthly assistance for a family of six. Application form and supporting documents verified by the office.",
      createdById: memberId,
      createdAt: hoursAgo(48),
      decisions: [
        {
          action: "approved",
          approverId: adminId,
          note: "Documents verified — qualifies under asnaf fakir criteria.",
          at: hoursAgo(24),
        },
      ],
    })
  )
    created++;

  // 3. Newly submitted: no decisions yet (the app creates workflows in_progress).
  if (
    await createDemoWorkflow({
      orgId,
      template: donation,
      title: "Friday Donation Box — Week 24",
      description: "Weekly Friday collection count: RM 2,310. Counted by two committee members after Jumaat prayers.",
      createdById: memberId,
      createdAt: hoursAgo(6),
    })
  )
    created++;

  // 4. Rejected at step 2: over budget.
  if (
    await createDemoWorkflow({
      orgId,
      template: expense,
      title: "Roof Repair Quotation — RM 12,000",
      description: "Repair of leaking roof above the women's prayer hall. Three contractor quotations attached.",
      createdById: memberId,
      createdAt: hoursAgo(96),
      decisions: [
        {
          action: "approved",
          approverId: adminId,
          note: "Lowest of the three quotations, contractor previously vetted.",
          at: hoursAgo(72),
        },
        {
          action: "rejected",
          approverId: adminId,
          note: "Exceeds the RM 10,000 quarterly maintenance budget — resubmit next quarter or split the scope.",
          at: hoursAgo(48),
        },
      ],
    })
  )
    created++;

  return created;
}

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
          steps: { create: t.steps.map((s) => ({ ...s, orgId: org.id })) },
        },
      });
    }
  }

  if (process.env.DEMO_MODE?.trim().toLowerCase() === "true") {
    // With DEMO_MODE the paywall is real: an org seeded weeks ago would be
    // instantly locked out, so every seed run resets it to a fresh trial.
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        createdAt: new Date(),
        subscriptionStatus: "trialing",
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        trialReminderSentAt: null,
        trialWinbackSentAt: null,
      },
    });

    const demoCreated = await seedDemoWorkflows(org.id, admin.id, member.id);
    if (demoCreated > 0) {
      console.log(`Demo mode: ${demoCreated} demo workflows created (approved / in progress / awaiting first review / rejected), trial reset to day 0`);
    }
  }

  console.log("Seed complete: 2 users, 1 org, 6 templates");
  console.log("Login: admin@halalflow.app / changeme123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
