import type { Dictionary } from "./en";

// Malay (Bahasa Melayu) dictionary. Typed `: Dictionary` so the build fails if any
// key from en.ts is missing or mistyped here. Malay nouns are not pluralised, so
// "hari" (day) is used for any count.
export const ms: Dictionary = {
  common: {
    appName: "MosRev",
    appTagline: "Enjin Aliran Kerja Kewangan Islam",
  },
  nav: {
    dashboard: "Papan Pemuka",
    workflows: "Aliran Kerja",
    templates: "Templat",
    masjidOps: "Operasi Masjid",
    bookings: "Tempahan",
    facilities: "Kemudahan",
    finance: "Kewangan",
    community: "Komuniti",
    billing: "Pengebilan",
    settings: "Tetapan",
    outbox: "Peti Keluar",
    account: "Akaun",
    signOut: "Log Keluar",
    signIn: "Log Masuk",
    getStarted: "Mula Sekarang",
    useCases: "Kegunaan",
    howItWorks: "Cara Ia Berfungsi",
    pricing: "Harga",
    directory: "Direktori Masjid",
    ramadan: "Ramadan",
    toggleMenu: "Togol menu",
    demoBadge: "Demo",
    trialDaysLeft: (days: number) => `Percubaan · ${days}h lagi`,
    trialEnded: "Percubaan tamat",
    trialTooltipActive: (days: number) => `Percubaan percuma: ${days} hari lagi`,
    trialTooltipEnded: "Percubaan percuma anda telah tamat",
  },
  footer: {
    tagline: "Enjin Aliran Kerja Kewangan Islam",
    github: "GitHub",
    openSource: "Sumber Terbuka",
    githubAria: "Repositori GitHub MosRev (buka dalam tab baharu)",
  },
  banner: {
    demo: "Mod demo — pembayaran dan e-mel adalah simulasi. Tiada caj sebenar, tiada e-mel sebenar.",
  },
  a11y: {
    skipToContent: "Langkau ke kandungan",
  },
  toggle: {
    toLight: "Tukar ke mod cerah",
    toDark: "Tukar ke mod gelap",
    language: "Bahasa",
    english: "Inggeris",
    malay: "Melayu",
    englishShort: "EN",
    malayShort: "MS",
  },
};
