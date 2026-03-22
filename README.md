# HalalFlow — Shariah Stock Intelligence Terminal

Bloomberg-lite for Muslim investors. Research, monitor, and understand Shariah compliance for global equities.

## Features

| Feature | Description |
|---------|-------------|
| **Shariah Screening Engine** | AAOIFI-compliant debt/cash/revenue ratio screening |
| **Company Profiles** | Full compliance breakdown with pass/fail criteria and purification guidance |
| **Screener** | Filter, sort, and search equities by compliance status, sector, score |
| **Watchlist** | Persistent local watchlist with compliance summary |
| **Research Reports** | Expandable compliance reports with export-to-text |
| **Kanban Board** | Real-time task tracking for platform development |

## Shariah Screening Rules (AAOIFI)

```
1. Debt Ratio:         Total Debt / Total Assets   < 33%
2. Cash + Securities:  (Cash + Sec) / Total Assets < 33%
3. Non-Halal Revenue:  Non-Halal Rev / Total Rev   < 5%
```

Categorically excluded sectors: Banking, Alcohol, Tobacco, Gambling, Defense, Adult Entertainment.

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── screener/           # Full equity screener
│   ├── company/[id]/       # Company profile + compliance detail
│   ├── watchlist/          # User watchlist
│   ├── research/           # Compliance research reports
│   └── kanban/             # Kanban task board
├── components/             # Shared UI components
│   ├── ui/
│   │   ├── Badge.tsx       # Compliance status badge
│   │   ├── RatioBar.tsx    # Animated ratio progress bar
│   │   └── ScoreRing.tsx   # SVG compliance score ring
│   ├── Navbar.tsx
│   ├── CompanyCard.tsx
│   └── WatchButton.tsx
├── lib/
│   ├── shariah-engine.ts   # Core screening logic
│   ├── watchlist-store.ts  # localStorage watchlist hook
│   └── kanban-store.ts     # localStorage kanban hook
├── data/
│   └── companies.ts        # Screened company data
└── types/
    └── index.ts            # TypeScript types
```

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4**
- **lucide-react** for icons
- **clsx** for conditional classes
- localStorage for watchlist + kanban persistence

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

- [ ] Live market data API (Alpha Vantage / Yahoo Finance)
- [ ] Price alerts via Telegram/email
- [ ] GCC/MENA stock universe expansion (Tadawul, DFM, ADX)
- [ ] PDF compliance certificate export
- [ ] Portfolio-level purification calculator
- [ ] Shariah Scholar commentary integration

## Disclaimer

HalalFlow is an intelligence terminal, not a broker or financial advisor. Always consult a qualified Shariah scholar and financial advisor before investing.
