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
  landing: {
    hero: {
      eyebrow: "Enjin aliran kerja kewangan Islam",
      titleLine1: "Uruskan kelulusan anda",
      titleLine2: "secara halal",
      subtitle:
        "MosRev memberi masjid, badan zakat, koperasi dan PKS Muslim satu tempat untuk menghala, meluluskan dan mengaudit setiap keputusan kewangan berbilang langkah.",
      getStarted: "Mula Sekarang",
      signIn: "Log Masuk",
      badges: "Sumber terbuka · boleh hos sendiri · tanpa kad kredit",
      previewTitle: "Agihan Zakat — kelompok Ramadan",
      previewOrg: "Amanah Masjid Al-Noor",
      steps: [
        { name: "Pengesahan kelayakan", status: "Diluluskan" },
        { name: "Semakan jawatankuasa asnaf", status: "Diluluskan" },
        { name: "Kebenaran pelepasan dana", status: "Menunggu" },
      ],
    },
    useCases: {
      eyebrow: "Kegunaan",
      heading: "Satu enjin, setiap kelulusan yang pasukan anda jalankan",
      items: [
        {
          title: "Kelulusan perbelanjaan masjid",
          body: "Pegawai kewangan menyemak, lembaga meluluskan. Setiap ringgit boleh dijejak.",
        },
        {
          title: "Pengesahan derma",
          body: "Sahkan penerimaan, keluarkan pengesahan — satu langkah kemas.",
        },
        {
          title: "Kelulusan invois & pembayaran",
          body: "Pengesahan berbilang langkah sebelum wang bergerak.",
        },
        {
          title: "Permohonan agihan zakat",
          body: "Semakan kelayakan, semakan jawatankuasa asnaf, pelepasan bendahari — keseluruhan rantaian, diaudit hujung ke hujung.",
        },
      ],
    },
    howItWorks: {
      eyebrow: "Cara Ia Berfungsi",
      heading: "Tiga langkah dari permohonan ke rekod",
      steps: [
        {
          title: "Bina templat",
          body: "Tetapkan langkah berurutan sekali — siapa menyemak, siapa meluluskan.",
        },
        {
          title: "Hantar aliran kerja",
          body: "Sesiapa dalam pasukan boleh memulakannya daripada templat dalam beberapa saat.",
        },
        {
          title: "Lulus & audit",
          body: "Pengesahan langkah demi langkah. Setiap tindakan direkod dalam log audit.",
        },
      ],
    },
    gallery: {
      eyebrow: "Masjid di KL & Selangor",
      heading: "Dipercayai komuniti sekitar Lembah Klang",
      subtitle:
        "Daripada Masjid Wilayah Persekutuan di Kuala Lumpur hingga Masjid Biru di Shah Alam — uruskan kewangan dan tempahan masjid anda dalam satu platform.",
    },
    community: {
      eyebrow: "Komuniti masjid",
      heading: "Hubung jemaah, pelawat dan komuniti",
      subtitle:
        "Siarkan profil masjid, buka tempahan dewan, dan kongsikan program Ramadan — semua dalam satu platform yang mudah diurus.",
      directory: "Direktori Masjid",
      ramadan: "Direktori Ramadan",
      imageAlt: "Luar masjid komuniti",
    },
    pricing: {
      eyebrow: "Harga",
      heading: "Mula percuma, kekal apabila ia berbaloi",
      planName: "Percubaan percuma",
      planNote: "untuk setiap ruang kerja baharu",
      planBody:
        "Akses penuh, tanpa kad kredit. Satu langganan mudah bagi setiap ruang kerja apabila jawatankuasa anda bersedia — batal bila-bila masa.",
      thenPrefix: "Kemudian",
      thenSuffix: "bagi setiap ruang kerja apabila anda bersedia.",
      included: [
        "Aliran kerja dan templat tanpa had",
        "Kelulusan berbilang langkah dengan keperluan peranan",
        "Log audit penuh bagi setiap permohonan",
        "Jemputan ahli dan peranan",
        "Eksport dan import templat (JSON)",
        "Resit PDF bagi permohonan yang diluluskan",
      ],
      cta: "Cipta ruang kerja anda",
      faqs: [
        {
          q: "Adakah data masjid kami disimpan berasingan daripada organisasi lain?",
          a: "Ya. Setiap ruang kerja diasingkan pada peringkat pangkalan data dengan keselamatan peringkat baris — satu organisasi tidak boleh membaca rekod organisasi lain, walaupun secara tidak sengaja.",
        },
        {
          q: "Adakah kami perlukan kad kredit untuk bermula?",
          a: "Tidak. Setiap ruang kerja baharu bermula dengan percubaan berciri penuh. Anda hanya menyediakan pengebilan apabila memutuskan untuk kekal.",
        },
        {
          q: "Bolehkah kami mengeluarkan data kami?",
          a: "Ya. Templat dieksport sebagai JSON yang boleh diimport semula di mana-mana, dan aliran kerja yang diluluskan menghasilkan resit PDF untuk rekod anda.",
        },
        {
          q: "Untuk siapa ini?",
          a: "Jawatankuasa masjid, badan zakat, koperasi dan PKS Muslim — mana-mana pasukan yang perlukan keputusan kewangan disemak, diluluskan dan direkod.",
        },
      ],
    },
    cta: {
      heading: "Mula uruskan kelulusan anda hari ini",
      subtitle:
        "Cipta ruang kerja, jemput pasukan anda, dan bina templat pertama anda dalam beberapa minit. Tanpa kad kredit, tanpa panggilan persediaan.",
      getStarted: "Mula Sekarang",
    },
  },
  auth: {
    signIn: "Log Masuk",
    signInWelcome: "Selamat kembali ke ruang kerja anda",
    email: "E-mel",
    password: "Kata laluan",
    signingIn: "Sedang log masuk…",
    loginFailed: "Log masuk gagal",
    networkError: "Tidak dapat menghubungi pelayan. Semak sambungan anda dan cuba lagi.",
    noAccount: "Tiada akaun?",
    createOne: "Cipta satu",
    createAccount: "Cipta akaun",
    createWelcome: "Mula mengurus aliran kerja dengan pasukan anda",
    fullName: "Nama penuh",
    orgName: "Nama organisasi",
    orgHint: "Mencipta ruang kerja anda. Biarkan kosong untuk tetapkan kemudian.",
    passwordHint: "Minimum 8 aksara",
    creatingAccount: "Sedang mencipta akaun…",
    registrationFailed: "Pendaftaran gagal",
    haveAccount: "Sudah ada akaun?",
  },
  dashboard: {
    fallbackTitle: "Papan Pemuka",
    subtitle: "Gambaran keseluruhan aliran kerja",
    newWorkflow: "Aliran kerja baharu",
    statTotal: "Jumlah",
    statAwaiting: "Menunggu kelulusan",
    statApproved: "Diluluskan",
    statRejected: "Ditolak",
    recentWorkflows: "Aliran Kerja Terkini",
    viewAll: "Lihat semua",
    noWorkflows: "Belum ada aliran kerja.",
    createFirstWorkflow: "Cipta aliran kerja pertama anda →",
    templates: "Templat",
    templatesDefined: "templat aliran kerja ditakrifkan",
    createTemplate: "Cipta templat →",
  },
};
