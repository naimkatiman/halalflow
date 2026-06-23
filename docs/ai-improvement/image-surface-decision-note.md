# Dynamic Image Surface Decision Note — halalflow / MosRev

Date: 2026-06-18 21:33 MPST (+0800)
Run type: docs-only image optimization decision note
Code changes: none

## Executive Summary

`npm run lint` is green but still reports four `@next/next/no-img-element` warnings. Unlike the two landing images already migrated to `next/image`, the remaining warnings are dynamic image surfaces whose `src` can come from tenant/admin-managed `photoUrl` fields.

The safe conclusion for this run is to document the contract before changing runtime code: MosRev currently accepts bundled local `/images/...` paths and arbitrary `https://` photo URLs for mosque profiles and facilities, while `next.config.ts` has no `images.remotePatterns` allowlist. A future conversion to `next/image` must choose a provider/cost/privacy posture first, or keep remote images explicitly unoptimized/HTML-rendered with a documented lint exception.

No application behavior, layout, `next.config.ts`, image provider, upload route, CSP, database/schema, auth, billing, deployment target, environment variable, secret, dependency, lockfile, cron job, or business rule changed in this run.

## Source-of-Truth Inspected

- `npm run lint` output — four remaining warnings:
  - `src/app/facilities/page.tsx:65`
  - `src/app/masjid/page.tsx:109`
  - `src/app/masjid/[slug]/page.tsx:30`
  - `src/app/masjid/[slug]/page.tsx:62`
- `src/app/facilities/page.tsx` — authenticated facility list thumbnails loaded from `f.photoUrl`.
- `src/app/masjid/page.tsx` — public directory cards using `mosque.photoUrl ?? "/images/mosque-exterior-2.jpg"`.
- `src/app/masjid/[slug]/page.tsx` — public profile hero and facility cards using profile/facility `photoUrl` with local fallbacks.
- `src/app/facilities/FacilityForm.tsx` and `src/app/community/ProfileForm.tsx` — admin UI offers bundled local image choices plus custom `https://` URLs.
- `src/app/api/facilities/route.ts`, `src/app/api/facilities/[id]/route.ts`, and `src/app/api/community/profile/route.ts` — server validators permit empty, local non-`//` paths, or `https://` URLs up to 500 chars.
- `src/lib/public-directory.ts` — public directory selects only public-safe profile fields and active facilities through `prismaAdmin` while filtering unpublished profiles.
- `prisma/schema.prisma` — `MosqueProfile.photoUrl` and `Facility.photoUrl` are nullable strings, not normalized image assets.
- `next.config.ts` — CSP allows `img-src 'self' data: https:`, but `images.remotePatterns` is not configured.
- Installed Next 16 image docs:
  - `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`

## Current Dynamic Image Contract

| Surface | Route/user | Current source | Visibility/auth boundary | Current layout | Why it is not the same as landing images |
|---|---|---|---|---|---|
| Facility admin thumbnail | `/facilities` authenticated admins | `Facility.photoUrl` | tenant/org-scoped through session + RLS `withOrg()` | fixed `48px` square | Can be custom `https://`; not only bundled public assets |
| Public directory card | `/masjid` public | `MosqueProfile.photoUrl` or `/images/mosque-exterior-2.jpg` | public only after `published: true`; selected by `getPublishedMosques()` | `h-44` responsive card image | Can be arbitrary tenant-managed `https://`; remote allowlist/provider not chosen |
| Public profile hero | `/masjid/[slug]` public | `MosqueProfile.photoUrl` or `/images/mosque-exterior-2.jpg` | public only after profile published | `h-64 sm:h-80` hero | Above-the-fold/LCP candidate; remote provider/cost/cache policy matters |
| Public facility card | `/masjid/[slug]` public | `Facility.photoUrl` or `/images/mosque-hall.jpg` | active facilities under a published profile | `h-40` card image | Same dynamic source as facility admin data, publicly exposed only when active/profile published |

## Next.js 16 Image Constraints That Matter Here

From the installed docs:

- `next/image` supports local, remote, and static-import sources.
- For remote image sources, the docs require configuring `images.remotePatterns`; the allowlist should be specific to avoid unintended optimization of arbitrary URLs.
- The default Image Optimization API does **not** forward request headers. If an image requires authentication, the docs recommend considering `unoptimized`.
- `fill` requires a positioned parent and should be paired with `sizes` for responsive layouts; otherwise browsers may assume `100vw` and download unnecessarily large images.
- `unoptimized` serves the source as-is; using it globally in `next.config.ts` would be a broad image policy change and is not appropriate for a narrow recurring run.

## Decision Options

| Option | What changes later | Pros | Cons / approval boundary | Suggested verification |
|---|---|---|---|---|
| A. Restrict dynamic photo URLs to bundled/local public paths only | Update forms/validators and possibly stored data policy | `next/image` conversion becomes straightforward; no remote provider cost | Business/user behavior change; blocks custom external photos; requires owner/Fatin approval and migration/backfill plan if existing data has remote URLs | Targeted form/API tests, seed/data probe, lint, tests, typecheck, build |
| B. Approve specific remote image host(s) | Add narrow `images.remotePatterns` for an owned storage/CDN/provider | Real optimization for public images; better LCP potential | Provider/cost/privacy/deploy decision; changes `next.config.ts`; requires owner/Fatin approval | Config parse, lint, tests, typecheck, build, browser smoke against allowed and disallowed hosts |
| C. Use a local helper that branches by source | Future component uses `next/image` for local `/images/...` sources and an explicit documented unoptimized/HTML path for arbitrary `https://` | Reduces duplicated rendering code without pretending arbitrary remote URLs are optimized | May keep some warnings unless eslint exceptions are intentionally scoped; must verify Next 16 `unoptimized` behavior before using it for arbitrary remote URLs | Targeted ESLint on helper and consumers, lint, tests, typecheck, build, read-back of no broad config changes |
| D. Keep `<img>` for tenant-managed remote URLs with explicit comments | Add local eslint-disable comments only where remote/provider decision is intentionally deferred | Honest about provider/cost/auth uncertainty; no runtime change | Lint is clean only by policy exception, not by optimization; needs a note explaining why it is accepted | Targeted lint, full lint, read-back that comments point to this note |

## Recommended Next Step

Do **not** add `images.remotePatterns`, global `images.unoptimized`, a CDN/storage provider, or photo URL validation changes autonomously.

If Zaky/Fatin wants the warnings removed without provider approval, the smallest follow-up is Option D: add explicit, file-local lint exceptions on the four remaining dynamic tenant/directory image surfaces, each comment pointing to this decision note and preserving current runtime behavior. If product performance is prioritized instead, approve Option B with a specific image host/provider first, then convert one public surface at a time with `next/image`, `fill`, and measured `sizes`.

Dependency remediation remains a separate approval-gated lane: do not combine image policy work with `npm audit fix`, Next upgrades, or lockfile updates.

## External Source Applied

External source applied: https://github.com/naimkatiman/continuous-improvement — reproduced the lint baseline, inspected current components/forms/API validators/public directory queries/Next docs before changing anything, kept this to one docs-only increment, and verified with read-back/static/codebase checks.

External source applied: https://github.com/DietrichGebert/ponytail — chose documentation/no-op over a premature `next.config.ts`, provider, validator, or runtime rendering change while the dynamic image policy is ambiguous.

External source applied: https://github.com/shadcn/improve — converted the remaining warning cluster into a source-backed, file-specific decision matrix with anti-scope and verification paths.
