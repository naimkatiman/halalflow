# Market Data Provider Decision — 2026-05-13 (REVISED)

> **First decision (Alpha Vantage) superseded.** User directive 2026-05-13 ~08:50 MYT: use the in-house `market-data-hub` Railway service as the source. This doc records the revised decision and the gap analysis. Original Alpha Vantage decision preserved at the bottom for context.

## Decision: **market-data-hub** (Railway, in-house)

- Public URL: **`https://market-data-hub.up.railway.app`** ← **The repo README has a stale URL** (`affectionate-consideration-production-f0be...`). Do not use that. Use this one.
- Repo: `https://github.com/naimkatiman/market-data-hub` (local at `/home/naim/.openclaw/workspace/market-data-hub`)
- Railway project: `market-data-hub`, service: `market-data-hub`, env: `production`
- Upstream provider: Twelve Data (API key held server-side in Railway env vars; halalflow never sees it)

## Why the hub instead of direct Twelve Data / Alpha Vantage

| Reason | Detail |
|---|---|
| Centralized rate limit | Twelve Data free tier is 8 req/min, 800 req/day. With halalflow + tradeclaw + future products consuming independently, you'd hit limits fast. Hub-as-cache fans 1 upstream call into N consumer reads. |
| No API key in halalflow | `MARKET_DATA_HUB_URL` only — public GET endpoints. Key lives in Railway env vars, rotated centrally. |
| Already serves 20 stocks | AAPL, AMD, AMZN, AVGO, BAC, BNO, COIN, DIS, GOOGL, GS, INTC, JPM, META, MSFT, MU, NFLX, NVDA, QCOM, TSLA, TSM. 8+ likely overlap with halalflow's `src/data/companies.ts`. |
| 7-day Redis retention | Quotes/candles cached for 7 days. Halalflow becomes a stateless reader. |
| Battle-tested | TradeClaw `web` already consumes it via `MARKET_DATA_HUB_URL`. |

## What the hub gives us today (verified via live probe 2026-05-13 09:36 UTC)

| Endpoint | Returns | Refresh cadence |
|---|---|---|
| `GET /api/quotes/:symbol` | `{ symbol, price, open, high, low, close, previous_close, change, percent_change, volume, timestamp, asset_type, name }` | ~1 min (quote fetcher) |
| `GET /api/quotes/type/stock` | All stock quotes in one call | same |
| `GET /api/candles/:symbol?interval=15min&limit=100` | OHLCV time-series array | 5 min |
| `GET /api/symbols` | Symbol registry — 100 rows across stock/forex/commodity/cfd/crypto/index | live |
| `GET /api/symbols/search?q=AAPL&type=stock` | Symbol lookup | live |
| `POST /api/symbols` | Add a new symbol to the registry (grows the universe) | n/a |
| `POST /api/symbols/:symbol/activate` | Toggle fetching for a symbol | n/a |
| `GET /api/health` | Hub status, cached counts, upstream breakdown | live |
| `GET /api/movers?type=stock&limit=5` | Top movers | live |

Sample stock quote (verified live):
```
GET /api/quotes/AAPL
→ {"symbol":"AAPL","price":294.86,"change":2.18,"percent_change":0.74,...,"asset_type":"stock","name":"Apple Inc."}
```

## What the hub does NOT give us yet (gap analysis)

Halalflow's AAOIFI screening needs **fundamentals**, not just quotes:
- `total_debt / total_assets < 33%` (debt ratio)
- `(cash + securities) / total_assets < 33%` (cash ratio)
- `non_halal_revenue / total_revenue < 5%` (non-halal revenue)

These come from balance sheet + income statement + company profile. The hub currently exposes only quotes/candles/forex. Twelve Data has the source endpoints (`/balance_sheet`, `/income_statement`, `/cash_flow`, `/profile`) but the hub does not wrap them.

**Resolution:** add a `fundamentals` route + fetcher to market-data-hub. See **Roadmap 1.5** in `2026-05-13-roadmap-build.md` — work happens in the hub repo, not halalflow.

## Implementation pattern in halalflow

- Single env var: `MARKET_DATA_HUB_URL=https://market-data-hub.up.railway.app`
- Single client module: `src/lib/market-data/hub-client.ts` — typed wrappers over the hub's GET endpoints
- Local cache layer in `src/lib/cache.ts` (Upstash if creds, in-memory fallback) — extra protection against hub downtime; 5 min quote TTL, 1 h candle TTL, 24 h fundamentals TTL once available.
- Mock fundamentals in `src/data/companies.ts` stay in place until Roadmap 1.5 ships `GET /api/fundamentals/:symbol`.

---

## Original Alpha Vantage decision (superseded — kept for context)

The first cron cycle picked Alpha Vantage. That decision was correct given the prompt at the time but ignored the in-house hub. Replaced 2026-05-13 ~08:50 MYT per user directive. Alpha Vantage may still be useful as a future fallback provider inside the hub (if the hub adds a multi-upstream router), but not consumed directly by halalflow.

Original comparison kept short here:

| Provider | Free RPM / Quota | Fundamentals | Verdict |
|---|---|---|---|
| Alpha Vantage | 5 rpm / 25 daily | Full (BALANCE_SHEET, INCOME_STATEMENT, CASH_FLOW, OVERVIEW) | Solid but bypasses the hub |
| Twelve Data | 8 rpm / 800 daily | Partial (paid for fundamentals on some plans) | The hub already uses it — let the hub be the consumer |
| Yahoo (yfinance) | Unofficial / soft-limited | Full but ToS-grey | Avoid in production |
| Finnhub | 60 rpm | Partial (US-only on free tier) | Universe expansion blocked |
