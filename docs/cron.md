# Scheduled Jobs (Cron)

HalalFlow deploys to Railway, not Vercel. There is no `vercel.json`; cron is configured as a separate Railway service.

## Cadence

5 minutes — `*/5 * * * *`

## Railway cron path

1. Add a cron endpoint under `src/app/api/cron/<job>/route.ts`. Guard with a shared secret:
   ```ts
   export async function GET(req: Request) {
     const auth = req.headers.get("authorization");
     if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
       return new Response("unauthorized", { status: 401 });
     }
     // ...job body
     return Response.json({ ok: true });
   }
   ```
2. Set `CRON_SECRET` on the Railway `halalflow` service.
3. Create a new Railway **Cron** service in the same project (`halalflow`, id `fa7e3052-3b82-40f0-b85d-54747445d973`):
   - Source: empty image or curl-capable base (e.g. `curlimages/curl`)
   - Schedule: `*/5 * * * *`
   - Start command:
     ```sh
     curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
       https://halalflow-production.up.railway.app/api/cron/<job>
     ```
   - Variables: `CRON_SECRET` (same value as the web service)

## Verification

```sh
railway logs --service <cron-service-name>
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://halalflow-production.up.railway.app/api/cron/<job>
```

Expect 200 from the endpoint and a log line every 5 minutes on the cron service.

## Why not Vercel cron

The app runs on Railway with a SQLite volume mounted at `/data`. Vercel cannot mount that volume, and we have no `vercel.json` in this repo. Do not add one — it will mislead future readers.
