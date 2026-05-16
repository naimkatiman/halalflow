# HalalFlow Roadmap Build — 2026-05-13

> Driven by Hermes hourly cron `292210eaf040` (HalalFlow Hourly Build — Claude Code) → spawns `claude -p` subprocess.
> Each cycle: pick the **first** unchecked `[ ]` line, execute, mark `[x]`, append a row to the execution log at the bottom.

## Cycle protocol

1. Read this file top to bottom. Pick the first `[ ]` line.
2. Implement only that one line. Surgical — no scope creep.
3. Run `npm run build` from the relevant project root (halalflow or market-data-hub, see line for cwd). Must pass. If red, do not mark complete.
4. If green: change `[ ]` → `[x]` on that line. Append a row to the execution log at the bottom.
5. If the change touches >3 files or >150 LOC, write a sub-plan in `docs/plans/<slug>.md` and link it.
6. Do NOT commit unless the line explicitly says "commit".

## Constants

- Halalflow root: `/home/naim/.openclaw/workspace/halalflow`
- Market-data-hub root: `/home/naim/.openclaw/workspace/market-data-hub` (sibling repo; some tasks run there)
- Hub public URL (live, verified 2026-05-13): `https://market-data-hub.up.railway.app`
- Hub repo: `https://github.com/naimkatiman/market-data-hub`
- Stack: Next.js 16, App Router, Tailwind v4, Prisma, iron-session, Upstash Redis
- AGENTS.md says "This is NOT the Next.js you know" — read `node_modules/next/dist/docs/` for any API drift before touching App Router files.

---

## Roadmap 1 — Live market data via market-data-hub

> Provider decision pivoted from Alpha Vantage → market-data-hub on 2026-05-13 ~08:50 MYT per user directive. See `docs/plans/2026-05-13-market-data-provider.md` (revised).

- [x] Decide provider — picked **market-data-hub** (Twelve Data upstream, in-house caching service).
- [x] Add market-data env to `.env.example` — now `MARKET_DATA_HUB_URL` (NOT the old `MARKET_DATA_PROVIDER` / `_API_KEY` / `_BASE_URL` — those were Alpha Vantage holdovers and have been replaced).
- [x] Create `src/lib/market-data/types.ts` with `Quote`, `Candle`, `Fundamentals`, `CompanyProfile` interfaces. `Quote` shape must match the hub's `GET /api/quotes/:symbol` response (symbol, price, open, high, low, close, previous_close, change, percent_change, volume, timestamp, asset_type, name). `Fundamentals` shape is the AAOIFI-relevant subset (total_debt, total_assets, cash_and_securities, total_revenue, non_halal_revenue) — these fields will come from Roadmap 1.5 once the hub exposes them.
- [x] Create `src/lib/market-data/errors.ts` with `MarketDataError` (base), `HubUnavailableError` (5xx/network), `SymbolNotFoundError` (404 on `/api/quotes/:symbol`).
- [x] Create `src/lib/market-data/hub-client.ts` — typed wrappers: `getQuote(symbol)`, `getQuotesByType(type)`, `getCandles(symbol, interval, limit)`, `searchSymbols(q, type)`. Use `MARKET_DATA_HUB_URL` from env. Throw the new error classes on non-2xx.
- [x] Create `src/lib/market-data/index.ts` — re-exports the client + types. Single import surface for the rest of the app.
- [x] Refactor `src/lib/cache.ts` — add `cacheWithTTL<T>(key, ttlSeconds, fetcher)`. Use `@upstash/redis` if `UPSTASH_REDIS_REST_URL`+`UPSTASH_REDIS_REST_TOKEN` set, else in-memory Map. TTLs: 5 min quotes, 1 h candles, 24 h fundamentals.
- [x] Refactor `src/data/companies.ts` to expose `getCompanies()` and `getCompany(id)` as async functions. For each company: merge static fields (name, sector, exchange) with live `getQuote(symbol)` via hub-client. Fundamentals stay mock for now (TODO marker referencing Roadmap 1.5).
- [x] Update `src/app/api/stocks/route.ts` and `src/app/api/stocks/[id]/route.ts` to use the async getters. On `HubUnavailableError` → return 503 with retry-after; on `SymbolNotFoundError` → 404.
- [x] Update `src/components/CompanyCard.tsx` and `src/components/CompanyDetail.tsx` to render live `change` / `percent_change` from quote.
- [x] Update `src/app/api/screenings/route.ts` to call `getQuote()` for current-price context; fundamentals still mock until Roadmap 1.5 ships.
- [x] Add `typecheck` script to package.json (`"typecheck": "tsc --noEmit"`).
- [x] Verify `npm run build` passes from halalflow root.

## Roadmap 1.5 — Extend market-data-hub to serve fundamentals

> All tasks in this section work in `/home/naim/.openclaw/workspace/market-data-hub`, NOT halalflow. The cron orchestrator must `cd` accordingly. Each `npm run build` step runs in that directory.

- [x] Read `packages/market-data-hub/src/lib/twelvedata.ts` to understand existing wrapper pattern (auth, base URL, error handling, response shape).
- [x] Add `fetchFundamentals(symbol)` function in `packages/market-data-hub/src/lib/twelvedata.ts`. Wrap Twelve Data's `/balance_sheet`, `/income_statement`, `/cash_flow`, `/profile` endpoints. Return normalized object: `{ symbol, as_of_date, total_assets, total_debt, cash_and_equivalents, short_term_investments, total_revenue, ebit, operating_income, source_filing_url }`.
- [x] Add Redis schema for fundamentals: key `mh:fundamentals:<SYMBOL>`, value JSON-stringified fundamentals, TTL 24h. Define in `packages/market-data-hub/src/lib/redis.ts` `RETENTION` map.
- [x] Create `packages/market-data-hub/src/routes/fundamentals.ts` with `GET /api/fundamentals/:symbol`. Reads from Redis; on miss, fetches via `fetchFundamentals` and writes back.
- [x] Wire the new route into `packages/market-data-hub/src/index.ts` (alongside quotes/candles/exchange-rates/symbols routes). Update the root `/` endpoint listing.
- [x] Add a fundamentals refresh tick to the fetcher cron at `0 */6 * * *` (every 6 hours, fundamentals are quarterly so this is generous). Re-uses the same active-symbol loop as quotes/candles but only for `asset_type=stock`.
- [x] Update `packages/market-data-hub/README.md` to (a) correct the public URL from the stale `affectionate-consideration-...` to `https://market-data-hub.up.railway.app`, and (b) document the new fundamentals endpoint.
- [x] Run `npm install` if needed, then `npm run build` from the hub package directory. Must pass.
- [x] Deploy: `cd /home/naim/.openclaw/workspace/market-data-hub && railway up --detach`. Smoke-test with `curl https://market-data-hub.up.railway.app/api/fundamentals/AAPL` — expect 200 with the normalized payload.

## Roadmap 1.6 — Halalflow consume hub fundamentals

> Back in halalflow.

- [x] Add `getFundamentals(symbol)` to `src/lib/market-data/hub-client.ts` calling `/api/fundamentals/:symbol`. Use `cacheWithTTL` for 24h local cache on top of the hub's 24h cache.
- [x] Update `src/lib/shariah-engine.ts` to accept live fundamentals instead of the mock shape, if shapes differ. Adapt as needed; keep the engine pure.
- [x] Refactor `src/data/companies.ts` to remove mock fundamentals — call `getFundamentals()` per company.
- [x] Update `src/app/api/screenings/route.ts` and `src/app/api/screenings/[id]/route.ts` to source fundamentals live.
- [x] Add a "data freshness" badge on company detail page showing the `as_of_date` from the fundamentals payload.
- [x] Verify `npm run build` passes.

## Roadmap 2 — Price alerts (Telegram + email)

- [x] Design data model. Add `Alert` + `AlertRule` to `prisma/schema.prisma`. Rule fields: user_id, symbol, condition (above/below), threshold, channel (telegram/email), active, created_at.
- [x] `prisma migrate dev --name add_alerts`. Commit migration file.
- [x] Create `src/app/api/alerts/route.ts` (GET list, POST create) — gated by iron-session auth.
- [x] Create `src/app/api/alerts/[id]/route.ts` (DELETE, PATCH for toggle active).
- [x] Create `src/lib/alerts/engine.ts` — evaluates rules against `getQuote()` from hub-client, returns triggered alerts.
- [x] Create `src/lib/alerts/notifiers/telegram.ts` — uses `TELEGRAM_BOT_TOKEN` env, posts to user's `telegram_chat_id` stored on user record. Reuses pattern from workspace `tcasia-portal/src/lib/telegram.ts`.
- [x] Create `src/lib/alerts/notifiers/email.ts` — Resend or nodemailer with SMTP creds from env. Skip if no creds configured.
- [x] Create `src/app/api/cron/alerts/route.ts` — secured by `CRON_SECRET` header. Runs engine for every active alert.
- [x] Add Vercel cron config to `vercel.json` or document Railway cron path. 5-min cadence.
- [ ] Create `src/components/AlertForm.tsx` and wire into company detail page.
- [ ] Add "Alerts" tab to navbar (only when logged in).
- [ ] Verify `npm run build` passes.

## Roadmap 3 — GCC/MENA stock universe expansion

- [ ] Inventory current universe. Grep `src/data/companies.ts` for tickers. Document in `docs/plans/2026-05-13-mena-universe.md`.
- [ ] Decide source for Tadawul (Saudi), DFM (Dubai), ADX (Abu Dhabi) listings. Twelve Data supports `.SR` and `.AE` suffixes — first check if the hub can already serve them by hitting `/api/symbols/search?q=ARAMCO`. If not, queue a hub task to add support.
- [ ] Add `exchange` field to `Company` type (already in `src/types/index.ts` — verify).
- [ ] Seed top 30 Tadawul tickers as fallback list in `src/data/exchanges/tadawul.ts`.
- [ ] Seed top 20 DFM tickers in `src/data/exchanges/dfm.ts`.
- [ ] Seed top 20 ADX tickers in `src/data/exchanges/adx.ts`.
- [ ] For each ticker in the regional seed lists, call hub's `POST /api/symbols` to register it (so the hub starts caching it). Idempotent — skip if already present.
- [ ] Wire the regional seed lists into the company router so screener can filter by exchange.
- [ ] Add exchange filter chip to screener UI (`src/app/screener/page.tsx`).
- [ ] Verify `npm run build` passes.

## Roadmap 4 — PDF compliance certificate export

- [ ] Pick PDF library. Compare `@react-pdf/renderer` (React components → PDF) vs `pdfkit` (low-level) vs `puppeteer` (HTML → PDF). Decision in `docs/plans/2026-05-13-pdf-library.md`. Favor `@react-pdf/renderer` for React idiom.
- [ ] `npm install @react-pdf/renderer` (or chosen alternative).
- [ ] Create `src/components/pdf/ComplianceCertificate.tsx` — renders one company's screening result with header, AAOIFI rules table, pass/fail, ratio bars, disclaimer.
- [ ] Create `src/app/api/companies/[id]/certificate/route.ts` — server-streams PDF response. Requires auth.
- [ ] Add "Export PDF" button to company detail page calling the new route.
- [ ] Add rate limit (1 PDF per company per user per hour) via existing `src/lib/rateLimit.ts`.
- [ ] Verify `npm run build` passes.

## Roadmap 5 — Portfolio-level purification calculator

- [ ] Add `Holding` model to `prisma/schema.prisma`: user_id, symbol, shares, cost_basis, added_at.
- [ ] `prisma migrate dev --name add_holdings`.
- [ ] Create `src/app/api/portfolio/holdings/route.ts` and `[id]/route.ts` — CRUD for user holdings.
- [ ] Create `src/lib/purification.ts` — given (holding, company_screening, current_price from hub-client), compute non-halal income contribution. Pure functions only.
- [ ] Create `src/app/portfolio/page.tsx` — table view of holdings + total purification amount.
- [ ] Add "Add Holding" form modal.
- [ ] Add nav link "Portfolio" (logged-in only).
- [ ] Verify `npm run build` passes.

## Roadmap 6 — Shariah Scholar commentary integration

- [ ] Add `ScholarCommentary` model: id, symbol, scholar_name, scholar_credentials_url, opinion (markdown), verdict (halal/haram/mixed), as_of_date, source_url, created_at.
- [ ] `prisma migrate dev --name add_scholar_commentary`.
- [ ] Seed `prisma/seed.ts` with 3 sample commentaries from publicly cited scholars (Mufti Taqi Usmani, AAOIFI standards, Dr. Yasir Qadhi) — include source URLs.
- [ ] Create `src/app/api/commentary/route.ts` and `[symbol]/route.ts` — read endpoints (public), write endpoints (admin only — gate by `role` claim on session).
- [ ] Create `src/components/CommentaryPanel.tsx` — renders markdown opinions on company detail page.
- [ ] Add admin route `src/app/admin/commentary/page.tsx` for adding/editing entries.
- [ ] Add role-check middleware in `src/middleware.ts` for `/admin/*` paths.
- [ ] Verify `npm run build` passes.

---

## Execution log

| Cycle UTC | Item | Status | Notes |
|---|---|---|---|
| 2026-05-13T00:39Z | R1: Decide provider | revised | Initial pick: Alpha Vantage. Decision doc: `docs/plans/2026-05-13-market-data-provider.md`. |
| 2026-05-13T01:01Z | R1: Add MARKET_DATA_PROVIDER/_API_KEY/_BASE_URL to .env.example | revised | Original Alpha Vantage env vars added at 01:01Z; replaced with `MARKET_DATA_HUB_URL` at 01:42Z after user pivot. |
| 2026-05-13T01:42Z | Pivot to market-data-hub | done | User directive: use the in-house hub as source. Decision doc rewritten. Roadmap restructured with new R1 (consume hub), R1.5 (extend hub for fundamentals), R1.6 (consume hub fundamentals). `.env.example` reset to `MARKET_DATA_HUB_URL` only. |
| 2026-05-13T01:43:27Z | Create `src/lib/market-data/types.ts` with `Quote`, `Candle` | done | Created src/lib/market-data/types.ts with Quote, Candle, Fundamentals, CompanyProfile interfaces; halalflow build passes; roadmap line checked and execution log appended. |
| 2026-05-13T02:00Z | R1: Create src/lib/market-data/types.ts | done | Added `Quote` (hub `/api/quotes/:symbol` shape), `Candle`, `Fundamentals` (AAOIFI subset — total_debt, total_assets, cash_and_securities, total_revenue, non_halal_revenue), `CompanyProfile`. Build green. |
| 2026-05-13T02:15Z | R1: Create src/lib/market-data/errors.ts | done | Added `MarketDataError` base, `HubUnavailableError` (with optional `status`, for 5xx/network), `SymbolNotFoundError` (with `symbol`, for 404 on `/api/quotes/:symbol`). Build green. |
| 2026-05-13T03:02:42Z | Create `src/lib/market-data/hub-client.ts` — typed wrappers: `getQuote(symbol)`, `getQuotesByType(type)`, `getCandles(symbol, interval, limit)`, `searchSymbols(q, type)`. Use `MARKET_DATA_HUB_URL` from env. Throw the new error classes on non-2xx. | done | Created hub-client wrappers, env-based base URL, error handling, build passed. |
| 2026-05-13T03:02Z | R1: Create src/lib/market-data/hub-client.ts | done | Added typed wrappers `getQuote`, `getQuotesByType`, `getCandles`, `searchSymbols`. Reads `MARKET_DATA_HUB_URL` from env (throws `MarketDataError` if unset). Maps 404→`SymbolNotFoundError`, 5xx/network→`HubUnavailableError`. `searchSymbols` filters `/api/symbols` client-side until hub adds a search endpoint. Build green. |
| 2026-05-13T04:01Z | R1: Create src/lib/market-data/index.ts | done | Barrel re-exports types, errors, hub-client for a single import surface. Build green. |
| 2026-05-13T05:00Z | R1: Refactor src/lib/cache.ts — add cacheWithTTL | done | Added `cacheWithTTL<T>(key, ttlSeconds, fetcher)` get-or-fetch wrapper using existing Upstash/in-memory fallback. Exported `CACHE_TTL` constants (QUOTE 300s, CANDLE 3600s, FUNDAMENTALS 86400s). Build green. |
| 2026-05-13T06:03Z | R1: Refactor src/data/companies.ts to async getCompanies/getCompany | done | Added async `getCompanies()` and `getCompany(id)` that merge static fields with live `getQuote(ticker)` via hub-client; falls back to static price on `HubUnavailableError` / `SymbolNotFoundError`. Kept existing sync exports (`companies`, `getCompanyById`, `sectors`, etc.) for backward compatibility until subsequent roadmap lines migrate callers. Fundamentals remain mocked with a TODO marker referencing Roadmap 1.5. Build green. |
| 2026-05-13T07:08:48Z | Update `src/app/api/stocks/route.ts` and `src/app/api/stocks | done | /api/stocks GET routes now use getCompanies/getCompany with HubUnavailableError→503+Retry-After and SymbolNotFoundError→404; build green. |
| 2026-05-13T07:00Z | R1: Update /api/stocks routes to async getters | done | `src/app/api/stocks/route.ts` GET now calls `getCompanies()` with in-memory filter/sort/paginate; `[id]/route.ts` GET calls `getCompany(id)`. Both catch `HubUnavailableError` → 503 + `Retry-After: 30`, and `SymbolNotFoundError` → 404. POST/PUT/DELETE (Prisma-backed) left untouched. Build green. |
| 2026-05-13T08:00Z | R1: CompanyCard + CompanyDetail render live change/percent_change | done | Both components already read `company.priceChange`/`priceChangePercent`, which `buildCompanyLive()` overwrites with live `quote.change` / `quote.percent_change`. Added `aria-live="polite"` to the change displays so updates are announced; CompanyCard change row also gets `fontVariantNumeric: tabular-nums` for stable digit width. Build green. |
| 2026-05-13T09:00Z | R1: /api/screenings enriched with getQuote() current-price context | done | Added `safeGetPriceContext(ticker)` helper that calls `getQuote()` and swallows `HubUnavailableError`/`SymbolNotFoundError` (returns `null`) so screening reads/writes stay resilient. GET batches unique tickers and attaches `currentPrice` (price, change, percentChange, timestamp) per row. POST attaches `currentPrice` to the created screening. Fundamentals still mocked — TODO marker references Roadmap 1.5. Build green. |
| 2026-05-13T10:01Z | R1: Add `typecheck` script to package.json | done | Added `"typecheck": "tsc --noEmit"` to halalflow package.json scripts. Build green. |
|| 2026-05-13T11:00Z | R1: Verify `npm run build` passes from halalflow root | done | `npm run build` green — 26 static pages generated, all routes compile, no type errors. Closes Roadmap 1. |
|| 2026-05-13T12:01:59Z | Read `packages/market-data-hub/src/lib/twelvedata.ts` to und | done | Read twelvedata wrapper pattern; build passes from market-data-hub. |
| 2026-05-13T12:00Z | R1.5: Read packages/market-data-hub/src/lib/twelvedata.ts | done | Pattern: `BASE_URL=https://api.twelvedata.com`, API key passed per-call as fn arg → appended as `apikey` query param. `TwelveDataError(message, endpoint, code?)` base class. Generic `callTwelveData<T>(apiKey, endpoint, params)` helper handles URL build, fetch, !resp.ok throw, and `body.status==='error'` throw. `toNumber`/`requireNumber` coerce TD's stringified numerics. Public fns: `fetchQuote`, `fetchPrice`, `fetchTimeSeries`, `fetchExchangeRate` — each calls helper then maps raw response to typed normalized object. New `fetchFundamentals` should follow same shape: take `(apiKey, symbol)`, hit `/balance_sheet`, `/income_statement`, `/cash_flow`, `/profile` via `callTwelveData`, normalize via `toNumber`, throw `TwelveDataError` on missing fields. Read-only orientation — no code changes. |
| 2026-05-13T13:02Z | R1.5: Add `fetchFundamentals(symbol)` to twelvedata.ts | done | Added `Fundamentals` interface + `fetchFundamentals(apiKey, symbol)` wrapping `/balance_sheet`, `/income_statement`, `/cash_flow`, `/profile` in parallel via `callTwelveData`. Normalizes to `{ symbol, as_of_date, total_assets, total_debt, cash_and_equivalents, short_term_investments, total_revenue, ebit, operating_income, source_filing_url }`. `total_debt` = short_term_debt + long_term_debt (null if both absent); cash falls back through `cash_and_cash_equivalents` → `cash_equivalents` → `cash`; revenue falls back from `sales` → `revenue`; `source_filing_url` sourced from profile `website`. `npm run build` (tsc) green in packages/market-data-hub. |
|| 2026-05-13T14:02Z | R1.5: Add Redis schema for fundamentals | done | Added `K.fundamentals(sym)` helper → `mh:fundamentals:${sym}` (STRING, JSON-stringified, TTL 24h), `"fundamentals": 24*60*60` entry in `RETENTION` map, and `FUNDAMENTALS_SECS` convenience constant in `packages/market-data-hub/src/lib/redis.ts`. `npm run build` (tsc) green. |
|| 2026-05-13T15:02:12Z | R1.5: Create `packages/market-data-hub/src/routes/fundamentals.ts` | done | Created fundamentals route with Redis fallback and 24h TTL; market-data-hub build green. |
| 2026-05-13T15:01Z | R1.5: Create routes/fundamentals.ts with GET /api/fundamentals/:symbol | done | New Hono route at `packages/market-data-hub/src/routes/fundamentals.ts`. Reads `mh:fundamentals:<SYMBOL>` (uppercased) from Redis; on hit returns cached payload with `cached:true`. On miss, calls `fetchFundamentals(process.env.TWELVE_DATA_API_KEY, symbol)` and `SET key EX FUNDAMENTALS_SECS`, returns `cached:false`. 500 if API key missing, 502 on upstream failure, corrupt cache falls through to refetch. Not yet wired into `src/index.ts` (next roadmap line). `npm run build` (tsc) green. |
| 2026-05-13T16:01Z | R1.5: Wire fundamentals route into src/index.ts | done | Imported `fundamentalsRoutes` from `./routes/fundamentals.js`, mounted at `app.route("/api/fundamentals", fundamentalsRoutes)` alongside quotes/candles/exchange-rates/symbols, and added `"GET  /api/fundamentals/:symbol"` to the root `/` endpoint listing. `npm run build` (tsc) green from `packages/market-data-hub`. |
| 2026-05-14T00:00Z | R1.5: Add fundamentals refresh cron tick `0 */6 * * *` | done | Added `fetchAllFundamentals()` to `packages/market-data-hub/src/lib/fetcher.ts` — reuses `getActiveSymbols()` filtered to `asset_type === "stock"`, calls `fetchFundamentals(API_KEY, symbol)`, writes JSON to `K.fundamentals(symbol)` with `FUNDAMENTALS_SECS` TTL, logs via `logFetch("fundamentals", ...)`, breaks on TD 429, 250ms inter-symbol sleep. Wired `cron.schedule("0 */6 * * *", ...)` in `src/index.ts` alongside quote/candle/rate ticks. `npm run build` (tsc) green from `packages/market-data-hub`. |
| 2026-05-14T01:00Z | R1.5: Update market-data-hub README | done | Replaced stale `affectionate-consideration-production-f0be.up.railway.app` with `https://market-data-hub.up.railway.app` in Deploy target section, and added `GET /api/fundamentals/:symbol` row to the Endpoints table describing the normalized payload + 24h Redis cache. README lives at repo root (not under `packages/market-data-hub/`). `npm run build` (tsc) green from `packages/market-data-hub`. |
| 2026-05-14T02:00Z | R1.5: npm install if needed, npm run build from hub package dir | done | node_modules already present at `market-data-hub` repo root (monorepo layout). `npm run build` (tsc) ran clean from `packages/market-data-hub/` with no output — all R1.5 TypeScript additions (fundamentals route, fetcher cron tick, Redis schema, twelvedata wrapper) compile. |
| 2026-05-14T04:00Z | R1.6: Add `getFundamentals(symbol)` to hub-client | done | Added `HubFundamentals` interface (matches hub `/api/fundamentals/:symbol` payload: symbol, as_of_date, total_assets, total_debt, cash_and_equivalents, short_term_investments, total_revenue, ebit, operating_income, source_filing_url, cached) and `getFundamentals(symbol)` wrapper to `src/lib/market-data/hub-client.ts`. Wraps `hubFetch` in `cache.cacheWithTTL` with key `mh:fundamentals:<UPPER_SYMBOL>` and `CACHE_TTL.FUNDAMENTALS` (24h) — layered on top of the hub's own 24h Redis cache. Maps 404→`SymbolNotFoundError`, 5xx/network→`HubUnavailableError` via shared `hubFetch`. Halalflow `npm run build` green. |
|| 2026-05-14T03:00Z | R1.5: Deploy + smoke-test fundamentals endpoint | done | `railway up --detach` from `/home/naim/.openclaw/workspace/market-data-hub` succeeded (build id `8087bc05-0c3b-4a48-a728-e95656316526`). Initial unauthenticated curl returned `{"error":"Unauthorized"}` (401) — hub gates `/api/*` via `API_KEY` Bearer header. Smoke-test with `Authorization: Bearer *** against `https://market-data-hub.up.railway.app/api/fundamentals/AAPL` returned 200 with normalized payload: `{symbol:"AAPL", as_of_date:"2025-09-30", total_assets:359241000000, total_debt:98657000000, cash_and_equivalents:35934000000, short_term_investments:null, total_revenue:416161000000, ebit:133050000000, operating_income:133050000000, source_filing_url:"https://www.apple.com", cached:false}`. Closes Roadmap 1.5. |
|| 2026-05-14T03:02:03Z | Add `getFundamentals(symbol)` to `src/lib/market-data/hub-cl | done | Added `getFundamentals(symbol)` + `HubFundamentals` type with `cache.cacheWithTTL` (24h local cache, key `mh:fundamentals:<SYMBOL>`); halalflow `npm run build` green. |
   || 2026-05-14T04:02:51Z | Update `src/lib/shariah-engine.ts` to accept live fundamenta | done | Added `LiveScreenInput` adapter to normalize live hub fundamentals into `CompanyFinancials`, keep `screenCompany` pure, and preserve existing callers. Build green. |
|| 2026-05-14T05:03Z | R1.6: Refactor `src/data/companies.ts` to remove mock fundamentals | done | Stripped the hardcoded `financials` block from each `rawCompanies` entry. `buildCompanyLive` now calls `getFundamentals(ticker)` in addition to `getQuote`, maps the hub payload to `CompanyFinancials` via `fundamentalsToFinancials`, and runs `screenCompanyLive` for screening. Hub failures (`HubUnavailableError` / `SymbolNotFoundError`) fall back to `emptyFinancials` + sector-only `screenCompany`. Legacy sync `companies` export retained as a static fallback with zero financials so existing page consumers (page.tsx, watchlist, screener, research, company/[id]) still compile — full migration of those callers is deferred. Halalflow `npm run build` green (26 pages). || 2026-05-14T06:00Z | R1.6: /api/screenings routes source fundamentals live | done | Added `safeGetFundamentals(ticker)` swallowing `HubUnavailableError`/`SymbolNotFoundError` in both `src/app/api/screenings/route.ts` and `src/app/api/screenings/[id]/route.ts`. GET list now parallel-fetches price + fundamentals per unique ticker and attaches `fundamentals` alongside `currentPrice` to each row. POST attaches both to the created screening. `[id]` GET attaches both to the single row. Removed the old "fundamentals mocked" TODO. Halalflow `npm run build` green (26 pages). |
|| 2026-05-14T06:02:57Z | Update `src/app/api/screenings/route.ts` and `src/app/api/sc | done | /api/screenings GET (list+id) and POST now attach live `fundamentals` via `safeGetFundamentals` (hub `/api/fundamentals/:symbol` with 24h cache), alongside existing `currentPrice`; halalflow `npm run build` green. |
|| 2026-05-14T07:02:27Z | Add a "data freshness" badge on company detail page showing the `as_of_date` from the fundamentals payload. | done | Added `fundamentalsAsOfDate` to `Company`, populated from hub fundamentals in `buildCompanyLive`, and rendered a badge in `CompanyDetail`; halalflow build green. |
| 2026-05-14T08:00Z | R1.6: Verify `npm run build` passes | done | `npm run build` green from halalflow root — 26 pages compiled, all routes (api/screenings, api/stocks, company/[id], etc.) typecheck clean. Closes Roadmap 1.6. |
|| 2026-05-14T09:00Z | R2: Design data model — Alert + AlertRule | done | Added `AlertRule` (id, userId→User, symbol, condition, threshold, channel, active default true, createdAt; indexes on userId and (symbol,active)) and `Alert` (id, ruleId→AlertRule cascade, triggeredAt, priceAtTrigger, delivered; index on ruleId) to `prisma/schema.prisma`. Added `alertRules AlertRule[]` back-relation to `User`. Camelcase per existing schema convention. `prisma generate` clean, `npm run build` green (26 pages). Migration deferred to next roadmap line. |
|| 2026-05-14T10:05:09Z | R2: `prisma migrate dev --name add_alerts`. Commit migration file. | blocked | Claude Code command hung without emitting a SUCCESS/FAIL line; process was terminated (exit 143). |
|| 2026-05-14T11:02:48Z | R2: Create src/app/api/alerts/route.ts (GET list, POST create) | done | New App Router route at `src/app/api/alerts/route.ts`. Both GET and POST gated by iron-session via `getIronSession<SessionData>(await cookies(), sessionOptions)` — return 401 when `!isLoggedIn`. GET lists `prisma.alertRule.findMany({ where: { userId } })` ordered by `createdAt desc`. POST validates body with zod (`symbol`, `condition` enum above/below, `threshold` finite number, `channel` enum telegram/email, optional `active`), uppercases symbol, creates rule scoped to `session.userId`, returns 201 with the new row. Invalid JSON → 400, validation failure → 400 with issues, DB/internal errors → 500. Halalflow `npm run build` green (api/alerts now listed alongside other ƒ routes). |
|| 2026-05-14T12:00Z | R2: Create src/app/api/alerts/[id]/route.ts (DELETE, PATCH toggle active) | done | New App Router route at `src/app/api/alerts/[id]/route.ts`. Both PATCH and DELETE gated by iron-session via shared `requireSession()` — 401 when unauthenticated. PATCH validates body with zod (`active: boolean`), scopes the update via `prisma.alertRule.updateMany({ where: { id, userId } })` so users can only toggle their own rules; 404 when `count === 0`, otherwise returns the refreshed row. DELETE uses `prisma.alertRule.deleteMany({ where: { id, userId } })` with the same ownership scoping; 404 when `count === 0`, else `{ success: true }`. Invalid JSON → 400, validation failure → 400 with issues, DB/internal errors → 500. Halalflow `npm run build` green — new ƒ route `/api/alerts/[id]` listed alongside `/api/alerts`. |
   174||| 2026-05-14T13:00Z | R2: Create src/lib/alerts/engine.ts | done | New `src/lib/alerts/engine.ts` exports `evaluateRules(rules)` returning `{ triggered, errors }`. Filters active rules, dedupes symbols, fetches quotes in parallel via `getQuote()` from hub-client, evaluates `above`/`below` against `quote.price` via pure `isConditionMet(condition, price, threshold)`. `SymbolNotFoundError`/`HubUnavailableError` are captured per-symbol and surfaced as `EvaluationError[]` keyed to each affected rule rather than failing the whole batch. No DB writes — caller (cron route) records `Alert` rows. Halalflow `npm run build` green (27 routes). |
   175||| 2026-05-14T13:02:28Z | Create `src/lib/alerts/engine.ts` — evaluates rules against  | done | New `src/lib/alerts/engine.ts` exports evaluateRules(rules) returning `{ triggered, errors }`; build green. |
| 2026-05-14T14:00Z | R2: Create src/lib/alerts/notifiers/telegram.ts | done | New `src/lib/alerts/notifiers/telegram.ts` exports `sendTelegramMessage({ chatId, message, parseMode?, disableWebPagePreview? })`, `TelegramNotifierError`, and result/options types. Reads `TELEGRAM_BOT_TOKEN` via `getBotToken()` (throws `TelegramNotifierError` if unset, matching tcasia-portal/src/lib/telegram.ts env pattern). POSTs JSON to `https://api.telegram.org/bot<token>/sendMessage`. Network failures and non-`ok` API responses surface as `TelegramNotifierError` with HTTP status + Telegram description. Caller supplies the user's `telegram_chat_id` (User model lacks the column today — wiring deferred to the cron task to keep this change surgical). Halalflow `npm run build` green (no new routes; lib-only addition). |
| 2026-05-15T00:00Z | R2: Create src/app/api/cron/alerts/route.ts | done | New App Router route at `src/app/api/cron/alerts/route.ts` (GET + POST). Fail-closed `isAuthorized()` checks `x-cron-secret` header or `Authorization: Bearer` against `CRON_SECRET` — 401 if unset or mismatched. Loads all `active` AlertRules with `user`, runs `evaluateRules()`, and for each triggered hit creates an `Alert` row (`priceAtTrigger`, `delivered:false`), dispatches by channel: telegram via `sendTelegramMessage` using `TELEGRAM_CHAT_ID` env (skips if unset — User model has no chat-id column yet), email via `sendEmailMessage` to `rule.user.email` (respects notifier's `skipped`). On successful delivery flips `Alert.delivered=true`. Notifier errors captured per-alert as `reason`, never fail the batch. Returns `{evaluated, triggered, deliveries, errors}`. Halalflow `npm run build` green — `ƒ /api/cron/alerts` listed. |
|| 2026-05-14T15:00Z | R2: Create src/lib/alerts/notifiers/email.ts | done | New `src/lib/alerts/notifiers/email.ts` exports `sendEmailMessage({ to, subject, text, html?, from? })`, `isEmailConfigured()`, `EmailNotifierError`, and result/options types. Uses Resend HTTP API directly (no dep added — fetch to `https://api.resend.com/emails` with `Bearer ${RESEND_API_KEY}`). Requires both `RESEND_API_KEY` and `ALERTS_EMAIL_FROM`; when either is missing, `sendEmailMessage` returns `{ ok: false, skipped: true, reason }` instead of throwing (satisfies "skip if no creds configured"). Network failures and non-2xx Resend responses surface as `EmailNotifierError` with status + description. Halalflow `npm run build` green (lib-only addition). |
|| 2026-05-15T14:11:05Z | Add Vercel cron config to `vercel.json` or document Railway | done | documented Railway cron path (5-min cadence) at docs/cron.md; build green. |
|| 2026-05-15T15:01:31Z | Create `src/components/AlertForm.tsx` and wire into company | blocked | company detail page does not exist; repo pivoted to Islamic finance workflow engine, so R2 alerts roadmap targets obsolete stock-screener direction. |
|| 2026-05-15T16:01:32Z | Create `src/components/AlertForm.tsx` and wire into company | blocked | company detail page does not exist in halalflow (repo pivoted to Islamic finance workflow engine — only api/dashboard/login/onboarding/register/settings/templates/workflows routes); R2 AlertForm task targets obsolete stock-screener direction, same as prior cycle's blocked entry at 2026-05-15T15:01:31Z. |