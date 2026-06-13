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

async function seedDemoCommunity(primaryOrgId: string, adminId: string) {
  const dayMs = 86400000;
  const now = Date.now();

  // ── Primary org: Masjid Al-Noor (al-noor-trust) ────────────────────────────

  await prisma.mosqueProfile.upsert({
    where: { orgId: primaryOrgId },
    update: {},
    create: {
      orgId: primaryOrgId,
      displayName: "Masjid Al-Noor",
      city: "Shah Alam",
      state: "Selangor",
      published: true,
      address: "Persiaran Masjid, Seksyen 14, 40000 Shah Alam, Selangor",
      phone: "+60 3-5510 1234",
      whatsapp: "+60 12-345 6789",
      description:
        "Masjid Al-Noor ialah masjid kariah yang melayani jemaah Seksyen 14 dan kawasan sekitar Shah Alam. Dewan serbaguna kami tersedia untuk disewa bagi majlis kenduri, akad nikah, dan kelas komuniti. Kami turut menganjurkan pelbagai program komuniti sepanjang tahun termasuk program Ramadan dan ziarah pelawat.",
      photoUrl: "/images/mosque-exterior-2.jpg",
      visitorsWelcome: true,
      visitorHours: "9:00 pagi – 5:00 petang (luar waktu solat)",
      dressCode: "Pakaian sopan; telekung dan jubah disediakan untuk pelawat",
      tourAvailable: true,
      tourNote: "Lawatan berpandu percuma setiap Sabtu, kumpulan 5+ sila hubungi pejabat",
      pantryAvailable: true,
      pantryType: "open",
      pantryHours: "Selepas Subuh – Maghrib, setiap hari",
      pantryNote: "Ambil apa yang perlu, derma apa yang mampu. Terbuka kepada semua.",
    },
  });

  // Facilities — skip if exists by orgId + name
  const facilityDewan = await (async () => {
    const existing = await prisma.facility.findFirst({
      where: { orgId: primaryOrgId, name: "Dewan Serbaguna" },
    });
    if (existing) return existing;
    return prisma.facility.create({
      data: {
        orgId: primaryOrgId,
        name: "Dewan Serbaguna",
        type: "dewan",
        capacity: 400,
        photoUrl: "/images/mosque-hall.jpg",
        rateKariah: 70000,
        rateAwam: 150000,
        deposit: 30000,
        rateNote: "sehari",
        description:
          "Dewan serbaguna berkapasiti 400 orang, lengkap dengan sistem siaraya, penghawa dingin, dan kemudahan dapur asas.",
        rules:
          "Tiada pelamin atau persandingan di dalam dewan; siaraya dihentikan ketika azan dan solat; kemas dan bersih sebelum Maghrib.",
      },
    });
  })();

  const facilityBilik = await (async () => {
    const existing = await prisma.facility.findFirst({
      where: { orgId: primaryOrgId, name: "Bilik Mesyuarat" },
    });
    if (existing) return existing;
    return prisma.facility.create({
      data: {
        orgId: primaryOrgId,
        name: "Bilik Mesyuarat",
        type: "bilik_mesyuarat",
        capacity: 40,
        photoUrl: "/images/mosque-interior-2.jpg",
        rateKariah: 10000,
        rateAwam: 20000,
        deposit: 5000,
        rateNote: "sesi 4 jam",
        description: "Bilik mesyuarat berkapasiti 40 orang, sesuai untuk bengkel, kursus, dan mesyuarat persatuan.",
      },
    });
  })();

  await (async () => {
    const existing = await prisma.facility.findFirst({
      where: { orgId: primaryOrgId, name: "Khemah & Laman" },
    });
    if (existing) return;
    await prisma.facility.create({
      data: {
        orgId: primaryOrgId,
        name: "Khemah & Laman",
        type: "khemah",
        capacity: 200,
        photoUrl: "/images/mosque-community.jpg",
        rateKariah: 15000,
        rateAwam: 25000,
        deposit: 10000,
        rateNote: "sehari",
        description: "Kawasan laman dan khemah di pekarangan masjid, sesuai untuk majlis luar dewan.",
      },
    });
  })();

  // Bookings — skip the entire block if any booking already exists for this org
  const existingBooking = await prisma.facilityBooking.findFirst({ where: { orgId: primaryOrgId } });
  let paidBookingId: string | null = null;
  let completedBookingId: string | null = null;
  let bookingsCreated = 0;

  if (!existingBooking) {
    // 1. requested — kenduri +21d
    await prisma.facilityBooking.create({
      data: {
        orgId: primaryOrgId,
        facilityId: facilityDewan.id,
        eventType: "kenduri",
        eventDate: new Date(now + 21 * dayMs),
        startTime: "08:00",
        endTime: "17:00",
        pax: 300,
        applicantName: "Ahmad Fauzi bin Ismail",
        applicantPhone: "012-3456789",
        isKariah: true,
        status: "requested",
        notes: "Kenduri kahwin anak pertama. Perlukan set-up kerusi jenis bulat.",
      },
    });
    bookingsCreated++;

    // 2. approved — akad_nikah +14d
    await prisma.facilityBooking.create({
      data: {
        orgId: primaryOrgId,
        facilityId: facilityDewan.id,
        eventType: "akad_nikah",
        eventDate: new Date(now + 14 * dayMs),
        startTime: "10:00",
        endTime: "13:00",
        pax: 150,
        applicantName: "Siti Aminah binti Hassan",
        applicantPhone: "011-9876543",
        isKariah: true,
        status: "approved",
        quotedAmount: 70000,
        depositAmount: 30000,
        decidedById: adminId,
        decidedAt: new Date(now - 2 * dayMs),
      },
    });
    bookingsCreated++;

    // 3. paid — kenduri +7d
    const paidBooking = await prisma.facilityBooking.create({
      data: {
        orgId: primaryOrgId,
        facilityId: facilityDewan.id,
        eventType: "kenduri",
        eventDate: new Date(now + 7 * dayMs),
        startTime: "08:00",
        endTime: "17:00",
        pax: 250,
        applicantName: "Lim Abdullah",
        applicantPhone: "016-2345678",
        isKariah: false,
        status: "paid",
        quotedAmount: 150000,
        depositAmount: 30000,
        decidedById: adminId,
        decidedAt: new Date(now - 5 * dayMs),
        paidAt: new Date(now - 3 * dayMs),
      },
    });
    paidBookingId = paidBooking.id;
    bookingsCreated++;

    // 4. completed — mesyuarat -7d
    const completedBooking = await prisma.facilityBooking.create({
      data: {
        orgId: primaryOrgId,
        facilityId: facilityBilik.id,
        eventType: "mesyuarat",
        eventDate: new Date(now - 7 * dayMs),
        startTime: "09:00",
        endTime: "13:00",
        pax: 30,
        applicantName: "Persatuan Peniaga Kecil Shah Alam",
        applicantPhone: "019-3456789",
        isKariah: false,
        status: "completed",
        quotedAmount: 10000,
        depositAmount: 5000,
        decidedById: adminId,
        decidedAt: new Date(now - 14 * dayMs),
        paidAt: new Date(now - 10 * dayMs),
      },
    });
    completedBookingId = completedBooking.id;
    bookingsCreated++;

    // 5. declined — kenduri +10d
    await prisma.facilityBooking.create({
      data: {
        orgId: primaryOrgId,
        facilityId: facilityDewan.id,
        eventType: "kenduri",
        eventDate: new Date(now + 10 * dayMs),
        startTime: "08:00",
        endTime: "17:00",
        pax: 200,
        applicantName: "Kamarul Ariffin",
        applicantPhone: "013-7654321",
        isKariah: true,
        status: "declined",
        declineReason: "Tarikh bertembung dengan program rasmi masjid",
        decidedById: adminId,
        decidedAt: new Date(now - 1 * dayMs),
      },
    });
    bookingsCreated++;

    // 6. cancelled — kelas +5d
    await prisma.facilityBooking.create({
      data: {
        orgId: primaryOrgId,
        facilityId: facilityBilik.id,
        eventType: "kelas",
        eventDate: new Date(now + 5 * dayMs),
        startTime: "10:00",
        endTime: "12:00",
        pax: 20,
        applicantName: "Nurul Huda",
        applicantPhone: "017-8765432",
        isKariah: true,
        status: "cancelled",
      },
    });
    bookingsCreated++;

    console.log(`Demo mode: ${bookingsCreated} facility bookings created`);
  }

  // LedgerEntries — skip if any exist for this org
  const existingLedger = await prisma.ledgerEntry.findFirst({ where: { orgId: primaryOrgId } });
  let ledgerCreated = 0;

  if (!existingLedger) {
    // Paid booking sewaan
    if (paidBookingId) {
      await prisma.ledgerEntry.create({
        data: {
          orgId: primaryOrgId,
          fund: "sewaan",
          direction: "in",
          amount: 150000,
          description: "Sewaan: Lim Abdullah (Kenduri)",
          refType: "booking",
          refId: paidBookingId,
          entryDate: new Date(now - 3 * dayMs),
          createdById: adminId,
        },
      });
      ledgerCreated++;
    }

    // Completed booking sewaan
    if (completedBookingId) {
      await prisma.ledgerEntry.create({
        data: {
          orgId: primaryOrgId,
          fund: "sewaan",
          direction: "in",
          amount: 10000,
          description: "Sewaan: Persatuan Peniaga Kecil Shah Alam (Mesyuarat)",
          refType: "booking",
          refId: completedBookingId,
          entryDate: new Date(now - 10 * dayMs),
          createdById: adminId,
        },
      });
      ledgerCreated++;
    }

    const ledgerRows: Array<{
      fund: string;
      direction: string;
      amount: number;
      description: string;
      daysAgo: number;
    }> = [
      { fund: "kutipan_jumaat", direction: "in", amount: 245000, description: "Kutipan Jumaat", daysAgo: 7 },
      { fund: "infaq", direction: "in", amount: 89000, description: "Tabung infaq mingguan", daysAgo: 14 },
      {
        fund: "khairat",
        direction: "out",
        amount: 50000,
        description: "Sumbangan khairat kematian — keluarga arwah Hj. Osman",
        daysAgo: 20,
      },
      { fund: "sewaan", direction: "out", amount: 20000, description: "Upah cuci dewan selepas kenduri", daysAgo: 4 },
      {
        fund: "wakaf",
        direction: "in",
        amount: 500000,
        description: "Wakaf kipas dewan — Syarikat Maju Jaya Sdn Bhd",
        daysAgo: 28,
      },
    ];

    for (const row of ledgerRows) {
      await prisma.ledgerEntry.create({
        data: {
          orgId: primaryOrgId,
          fund: row.fund,
          direction: row.direction,
          amount: row.amount,
          description: row.description,
          entryDate: new Date(now - row.daysAgo * dayMs),
          createdById: adminId,
        },
      });
      ledgerCreated++;
    }

    console.log(`Demo mode: ${ledgerCreated} ledger entries created`);
  }

  // RamadanPrograms — skip per org (iftar, moreh, terawih, tadarus)
  const programDefs = [
    {
      type: "iftar",
      title: "Iftar Perdana",
      description:
        "Bubur lambuk dan juadah berbuka untuk 500 pax, anjuran AJK dan penaja komuniti",
      time: "18:45",
      schedule: "Setiap hari sepanjang Ramadan",
      isFree: true,
    },
    {
      type: "moreh",
      title: "Moreh Bersama",
      description: "Kuih-muih dan kopi selepas terawih, dijamu oleh keluarga penaja malam",
      time: "22:30",
      schedule: "Setiap malam",
      isFree: true,
    },
    {
      type: "terawih",
      title: "Solat Terawih",
      description:
        "Solat terawih 8 rakaat bersama imam hafiz jemputan; ruang muslimat tersedia",
      time: "21:00",
      schedule: "Setiap malam",
      isFree: true,
    },
    {
      type: "tadarus",
      title: "Tadarus Al-Quran",
      description: "Tadarus Al-Quran selepas Subuh, sasaran khatam 30 juzuk",
      time: "06:15",
      schedule: "Setiap pagi",
      isFree: true,
    },
  ];

  let programsCreated = 0;
  for (const p of programDefs) {
    const existing = await prisma.ramadanProgram.findFirst({
      where: { orgId: primaryOrgId, type: p.type },
    });
    if (!existing) {
      await prisma.ramadanProgram.create({ data: { orgId: primaryOrgId, ...p } });
      programsCreated++;
    }
  }
  if (programsCreated > 0) {
    console.log(`Demo mode: ${programsCreated} Ramadan programs created for al-noor-trust`);
  }

  // ── Directory-only orgs (no OrgMember rows) ────────────────────────────────

  // Helper to upsert a directory org + profile + facilities + programs
  async function seedDirectoryOrg(opts: {
    slug: string;
    name: string;
    profile: {
      displayName: string;
      city: string;
      state: string;
      photoUrl: string;
      description: string;
      visitorsWelcome: boolean;
      tourAvailable: boolean;
      tourNote?: string;
      pantryAvailable: boolean;
      pantryType?: string;
      pantryNote?: string;
    };
    facilities: Array<{
      name: string;
      type: string;
      capacity: number;
      photoUrl: string;
      rateKariah: number;
      rateAwam: number;
      deposit: number;
      rateNote?: string;
      description?: string;
    }>;
    programs: Array<{
      type: string;
      title?: string;
      description: string;
      time?: string;
      schedule?: string;
      isFree: boolean;
    }>;
  }) {
    let dirOrg = await prisma.organization.findUnique({ where: { slug: opts.slug } });
    if (!dirOrg) {
      dirOrg = await prisma.organization.create({
        data: {
          name: opts.name,
          slug: opts.slug,
          subscriptionStatus: "trialing",
        },
      });
    }

    await prisma.mosqueProfile.upsert({
      where: { orgId: dirOrg.id },
      update: {},
      create: {
        orgId: dirOrg.id,
        displayName: opts.profile.displayName,
        city: opts.profile.city,
        state: opts.profile.state,
        published: true,
        photoUrl: opts.profile.photoUrl,
        description: opts.profile.description,
        visitorsWelcome: opts.profile.visitorsWelcome,
        tourAvailable: opts.profile.tourAvailable,
        tourNote: opts.profile.tourNote ?? null,
        pantryAvailable: opts.profile.pantryAvailable,
        pantryType: opts.profile.pantryType ?? null,
        pantryNote: opts.profile.pantryNote ?? null,
      },
    });

    for (const f of opts.facilities) {
      const existingF = await prisma.facility.findFirst({ where: { orgId: dirOrg.id, name: f.name } });
      if (!existingF) {
        await prisma.facility.create({
          data: { orgId: dirOrg.id, ...f },
        });
      }
    }

    for (const p of opts.programs) {
      const existingP = await prisma.ramadanProgram.findFirst({ where: { orgId: dirOrg.id, type: p.type } });
      if (!existingP) {
        await prisma.ramadanProgram.create({ data: { orgId: dirOrg.id, ...p } });
      }
    }

    return dirOrg;
  }

  await seedDirectoryOrg({
    slug: "masjid-ar-rahman",
    name: "Masjid Ar-Rahman",
    profile: {
      displayName: "Masjid Ar-Rahman",
      city: "Kuala Lumpur",
      state: "WP Kuala Lumpur",
      photoUrl: "/images/mosque-hero.jpg",
      description:
        "Masjid Ar-Rahman terletak di jantung ibu kota, menawarkan dewan serbaguna untuk pelbagai majlis. Kami mengalu-alukan pelawat dari dalam dan luar negara dengan lawatan berpandu dalam Bahasa Malaysia, Inggeris, dan Arab.",
      visitorsWelcome: true,
      tourAvailable: true,
      tourNote: "Lawatan berpandu dalam BM/EN/AR — daftar di kaunter",
      pantryAvailable: false,
    },
    facilities: [
      {
        name: "Dewan Al-Rahman",
        type: "dewan",
        capacity: 600,
        photoUrl: "/images/mosque-hall.jpg",
        rateKariah: 100000,
        rateAwam: 200000,
        deposit: 50000,
        rateNote: "sehari",
        description: "Dewan utama berkapasiti 600 orang dengan sistem PA profesional.",
      },
      {
        name: "Bilik Seminar",
        type: "bilik_kuliah",
        capacity: 60,
        photoUrl: "/images/mosque-interior-1.jpg",
        rateKariah: 15000,
        rateAwam: 30000,
        deposit: 5000,
        rateNote: "sesi 4 jam",
        description: "Bilik seminar berkapasiti 60 orang, sesuai untuk forum dan bengkel.",
      },
    ],
    programs: [
      {
        type: "iftar",
        title: "Iftar Ar-Rahman",
        description: "Juadah berbuka percuma untuk jemaah dan pelawat sepanjang Ramadan",
        time: "19:00",
        schedule: "Setiap hari Ramadan",
        isFree: true,
      },
      {
        type: "terawih",
        title: "Terawih Berjemaah",
        description: "Solat terawih 20 rakaat dipimpin oleh imam masjid",
        time: "21:15",
        schedule: "Setiap malam Ramadan",
        isFree: true,
      },
    ],
  });

  await seedDirectoryOrg({
    slug: "surau-an-nur",
    name: "Surau An-Nur",
    profile: {
      displayName: "Surau An-Nur",
      city: "Bayan Lepas",
      state: "Pulau Pinang",
      photoUrl: "/images/mosque-interior-1.jpg",
      description:
        "Surau An-Nur ialah surau komuniti di kawasan perindustrian Bayan Lepas, melayani pekerja dan penduduk tempatan. Kami menyediakan program moreh dan tadarus pada bulan Ramadan serta bakul makanan asnaf sepanjang tahun.",
      visitorsWelcome: true,
      tourAvailable: false,
      pantryAvailable: true,
      pantryType: "asnaf",
      pantryNote: "Bakul makanan asnaf — pengesahan melalui pejabat surau",
    },
    facilities: [
      {
        name: "Bilik Kuliah",
        type: "bilik_kuliah",
        capacity: 30,
        photoUrl: "/images/mosque-study.jpg",
        rateKariah: 5000,
        rateAwam: 10000,
        deposit: 2000,
        rateNote: "sesi 2 jam",
        description: "Bilik kuliah berkapasiti 30 orang untuk kelas pengajian dan usrah.",
      },
    ],
    programs: [
      {
        type: "moreh",
        title: "Moreh An-Nur",
        description: "Juadah moreh ringkas selepas terawih, sumbangan sukarela AJK surau",
        time: "22:00",
        schedule: "Setiap malam Ramadan",
        isFree: true,
      },
      {
        type: "tadarus",
        title: "Tadarus Subuh",
        description: "Bacaan Al-Quran bersama selepas solat Subuh berjemaah",
        time: "06:00",
        schedule: "Setiap pagi Ramadan",
        isFree: true,
      },
    ],
  });

  console.log("Demo mode: mosque network seeded (3 profiles, 6 facilities, 8 Ramadan programs)");
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

    await seedDemoCommunity(org.id, admin.id);
  }

  console.log("Seed complete: 2 users, 1 org, 6 templates");
  console.log("Login: admin@halalflow.app / changeme123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
