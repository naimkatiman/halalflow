// English dictionary — the canonical shape. `Dictionary = typeof en`, so every key
// added here must also exist in ms.ts (typed `: Dictionary`) or the build fails.
// Interpolated strings are functions so translations stay type-checked.
export const en = {
  common: {
    appName: "MosRev",
    appTagline: "Islamic Finance Workflow Engine",
  },
  nav: {
    dashboard: "Dashboard",
    workflows: "Workflows",
    templates: "Templates",
    masjidOps: "Masjid Ops",
    bookings: "Bookings",
    facilities: "Facilities",
    finance: "Finance",
    community: "Community",
    billing: "Billing",
    settings: "Settings",
    outbox: "Outbox",
    account: "Account",
    signOut: "Sign out",
    signIn: "Sign in",
    getStarted: "Get started",
    useCases: "Use cases",
    howItWorks: "How it works",
    pricing: "Pricing",
    directory: "Masjid Directory",
    ramadan: "Ramadan",
    toggleMenu: "Toggle menu",
    demoBadge: "Demo",
    trialDaysLeft: (days: number) => `Trial · ${days}d left`,
    trialEnded: "Trial ended",
    trialTooltipActive: (days: number) =>
      `Free trial: ${days} ${days === 1 ? "day" : "days"} left`,
    trialTooltipEnded: "Your free trial has ended",
  },
  footer: {
    tagline: "Islamic Finance Workflow Engine",
    github: "GitHub",
    openSource: "Open Source",
    githubAria: "MosRev GitHub repository (opens in new tab)",
  },
  banner: {
    demo: "Demo mode — payments and emails are simulated. No real charges, no real emails.",
  },
  a11y: {
    skipToContent: "Skip to content",
  },
  toggle: {
    toLight: "Switch to light mode",
    toDark: "Switch to dark mode",
    language: "Language",
    english: "English",
    malay: "Malay",
    englishShort: "EN",
    malayShort: "MS",
  },
  landing: {
    hero: {
      eyebrow: "Islamic finance workflow engine",
      titleLine1: "Run your approvals",
      titleLine2: "the halal way",
      subtitle:
        "MosRev gives mosques, zakat bodies, cooperatives and Muslim SMEs one place to route, approve, and audit every multi-step financial decision.",
      getStarted: "Get started",
      signIn: "Sign in",
      badges: "Open-source · self-hostable · no credit card",
      previewTitle: "Zakat Distribution — Ramadan batch",
      previewOrg: "Al-Noor Mosque Trust",
      steps: [
        { name: "Eligibility verification", status: "Approved" },
        { name: "Asnaf committee review", status: "Approved" },
        { name: "Fund release authorization", status: "Pending" },
      ],
    },
    useCases: {
      eyebrow: "Use cases",
      heading: "One engine, every approval your team runs",
      items: [
        {
          title: "Mosque expense approvals",
          body: "Finance officer reviews, board signs off. Every ringgit traceable.",
        },
        {
          title: "Donation acknowledgments",
          body: "Confirm receipt, issue the acknowledgment — one clean step.",
        },
        {
          title: "Invoice & payment approvals",
          body: "Multi-step sign-off before money moves.",
        },
        {
          title: "Zakat distribution requests",
          body: "Eligibility check, asnaf committee review, treasurer release — the full chain, audited end to end.",
        },
      ],
    },
    howItWorks: {
      eyebrow: "How it works",
      heading: "Three steps from request to record",
      steps: [
        {
          title: "Build a template",
          body: "Define the ordered steps once — who reviews, who signs off.",
        },
        {
          title: "Submit a workflow",
          body: "Anyone on the team starts one from a template in seconds.",
        },
        {
          title: "Approve & audit",
          body: "Step-by-step sign-off. Every action lands in the audit log.",
        },
      ],
    },
    gallery: {
      eyebrow: "Masjid in KL & Selangor",
      heading: "Trusted by communities across the Klang Valley",
      subtitle:
        "From Masjid Wilayah Persekutuan in Kuala Lumpur to the Blue Mosque in Shah Alam — manage your mosque's finances and bookings on one platform.",
    },
    community: {
      eyebrow: "Mosque community",
      heading: "Connect congregants, visitors and community",
      subtitle:
        "Publish your mosque profile, open hall bookings, and share Ramadan programs — all on one easy-to-manage platform.",
      directory: "Masjid Directory",
      ramadan: "Ramadan Directory",
      imageAlt: "Community mosque exterior",
    },
    pricing: {
      eyebrow: "Pricing",
      heading: "Start free, stay when it earns its keep",
      planName: "Free trial",
      planNote: "for every new workspace",
      planBody:
        "Full access, no credit card. One simple subscription per workspace when your committee is ready — cancel anytime.",
      thenPrefix: "Then",
      thenSuffix: "per workspace when you're ready.",
      included: [
        "Unlimited workflows and templates",
        "Multi-step approvals with role requirements",
        "Full audit log on every request",
        "Member invitations and roles",
        "Template export and import (JSON)",
        "PDF receipts for approved requests",
      ],
      cta: "Create your workspace",
      faqs: [
        {
          q: "Is our masjid's data kept separate from other organizations?",
          a: "Yes. Every workspace is isolated at the database level with row-level security — one organization can never read another's records, even by accident.",
        },
        {
          q: "Do we need a credit card to start?",
          a: "No. Every new workspace starts on a full-featured trial. You only set up billing when you decide to stay.",
        },
        {
          q: "Can we get our data out?",
          a: "Yes. Templates export as JSON you can re-import anywhere, and approved workflows produce PDF receipts for your records.",
        },
        {
          q: "Who is this for?",
          a: "Mosque committees, zakat bodies, cooperatives, and Muslim SMEs — any team that needs money decisions reviewed, approved, and recorded.",
        },
      ],
    },
    cta: {
      heading: "Start running your approvals today",
      subtitle:
        "Create a workspace, invite your team, and build your first template in minutes. No credit card, no setup call.",
      getStarted: "Get started",
    },
  },
};

export type Dictionary = typeof en;
