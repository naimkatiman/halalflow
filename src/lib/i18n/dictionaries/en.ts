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
};

export type Dictionary = typeof en;
