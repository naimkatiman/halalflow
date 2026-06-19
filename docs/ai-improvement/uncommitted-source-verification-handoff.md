# Uncommitted Source Verification Handoff — halalflow / MosRev

Date: 2026-06-19 06:16 MPST (+0800)
Run type: docs-only source-diff stabilization handoff
Code changes: none this run

## Why this exists

This recurring Zaky run found a materially dirty working tree before any new implementation work:

- 9 tracked files are modified relative to `origin/main` / `HEAD`.
- 7 files are untracked, including the repo-local AI docs and three pure-helper test files from earlier Zaky runs.
- The tracked runtime/source side of the diff spans React client components, a morph animation hook, and `package-lock.json`.

The current verification baseline is green, but green checks do **not** mean the full accumulated working-tree diff has been reviewed, accepted, or proven behavior-preserving. To avoid layering more runtime changes on top of unreviewed source changes, this run documents the diff inventory and makes source-diff stabilization the active next safe move.

## Source diff inventory

### Tracked operator/documentation diffs

| Surface | Files | Current diff | Review implication |
|---|---|---:|---|
| Public setup and self-hosting docs | `README.md` | Included in 3-doc shortstat | Confirm the Postgres + RLS guidance is still the intended public setup posture before committing. |
| Production deployment docs | `docs/deployment.md` | Included in 3-doc shortstat | Confirm the three-URL RLS role contract and owner/admin/app-role boundaries match production plans. |
| Railway cron/operator docs | `docs/cron.md` | Included in 3-doc shortstat | Confirm the daily `/api/cron/trial-emails` Railway scheduler guidance supersedes the old SQLite/5-minute notes. |

Tracked operator-doc shortstat at 06:16 MPST:

```text
3 files changed, 167 insertions(+), 78 deletions(-)
```

### Tracked runtime/source and lockfile diffs

| Surface | Files | Current diff | Review implication |
|---|---|---:|---|
| Dependency lockfile reproducibility | `package-lock.json` | Included in 6-file runtime shortstat | Confirm the lockfile sync is intentional and no dependency mutation is mixed with unrelated source review. |
| Client UI lint stabilization | `src/components/LanguageToggle.tsx`, `src/components/ThemeToggle.tsx` | Included in 6-file runtime shortstat | Review the cookie helper extraction and requestAnimationFrame deferral as React-lint fixes, not product behavior changes. |
| Static landing image optimization | `src/components/landing/MasjidGallery.tsx`, `src/components/landing/CommunityBand.tsx` | Included in 6-file runtime shortstat | Confirm the `next/image` conversions keep existing layout intent and do not require provider/config changes. |
| Morph hook lint/runtime stability | `src/lib/morph/useMorph.ts` | Included in 6-file runtime shortstat | Review the `tRef`/`setProgress` data flow and reduced-motion next-frame snap before accepting. |

Tracked source/runtime shortstat at 06:16 MPST:

```text
6 files changed, 65 insertions(+), 34 deletions(-)
```

### Untracked artifacts from prior Zaky runs

| Surface | Files | Review implication |
|---|---|---|
| Repo-local AI tracking | `docs/ai-improvement/README.md`, `dependency-audit-triage.md`, `image-surface-decision-note.md`, `implementation-log.md` | These are expected recurring-agent artifacts but are not yet tracked. |
| Pure-helper characterization tests | `src/lib/money.test.ts`, `src/lib/roles.test.ts`, `src/lib/api-errors.test.ts` | Tests pass locally and document current helper behavior; review and commit or intentionally drop them before new runtime work. |

Current untracked inventory at 06:16 MPST:

```text
docs/ai-improvement/README.md
docs/ai-improvement/dependency-audit-triage.md
docs/ai-improvement/image-surface-decision-note.md
docs/ai-improvement/implementation-log.md
src/lib/api-errors.test.ts
src/lib/money.test.ts
src/lib/roles.test.ts
```

## Verification snapshot

Commands run from `C:/Ai/halalflow` on 2026-06-19 06:16 MPST:

```text
git status --short --branch --untracked-files=all:
## main...origin/main
 M README.md
 M docs/cron.md
 M docs/deployment.md
 M package-lock.json
 M src/components/LanguageToggle.tsx
 M src/components/ThemeToggle.tsx
 M src/components/landing/CommunityBand.tsx
 M src/components/landing/MasjidGallery.tsx
 M src/lib/morph/useMorph.ts
?? docs/ai-improvement/README.md
?? docs/ai-improvement/dependency-audit-triage.md
?? docs/ai-improvement/image-surface-decision-note.md
?? docs/ai-improvement/implementation-log.md
?? src/lib/api-errors.test.ts
?? src/lib/money.test.ts
?? src/lib/roles.test.ts
```

```text
npm test: exit 0
Test Files 12 passed (12)
Tests 83 passed (83)
```

```text
npm run lint: exit 0
4 problems (0 errors, 4 warnings)
Warnings are the known dynamic @next/next/no-img-element surfaces:
- src/app/facilities/page.tsx:65
- src/app/masjid/[slug]/page.tsx:30
- src/app/masjid/[slug]/page.tsx:62
- src/app/masjid/page.tsx:109
```

```text
npx tsc --noEmit: exit 0
```

```text
npm run build: exit 0
Compiled successfully in 3.3s; finished TypeScript in 8.1s.
Build still prints the pre-existing Prisma page-data warning because DATABASE_URL is not set in this local cron environment.
Route table generated successfully.
```

## Guardrails for the next run

Do not layer new runtime work until the existing diff is reviewed or split. In particular, do not autonomously:

- change schema, migrations, RLS policy, auth/session, payment, upload, booking, ledger, or business rules;
- run `npm audit fix --force`, dependency upgrades, or lockfile cleanup in the same pass;
- deploy, mutate production data, change cron jobs, or change environment variables/secrets;
- reformat the whole repo or combine source review with unrelated feature work.

## Suggested review sequence for Zaky / Fatin / maintainer

1. Split the working tree into review lanes:
   - operator docs (`README.md`, `docs/deployment.md`, `docs/cron.md`);
   - lockfile reproducibility (`package-lock.json`);
   - React lint/source stabilization (`LanguageToggle`, `ThemeToggle`, `useMorph`);
   - static landing image conversions (`MasjidGallery`, `CommunityBand`);
   - test-only helper coverage (`money`, `roles`, `api-errors`);
   - AI tracking docs.
2. For each lane, decide **keep / adjust / revert / commit separately**.
3. Rerun the verification matrix after any lane decision, not only at the end.
4. Only resume new runtime increments once the source diff has a clear owner-reviewed disposition.

## Recommended next move

Source-diff stabilization is the next safe move. If owner/Fatin review is available, use the lanes above to split/commit/revert the accumulated diff. If review is not available, keep the next autonomous run docs-only and update this handoff with fresh status and verification instead of adding new source changes.

## External Source Applied

External source applied: https://github.com/naimkatiman/continuous-improvement — re-scanned the repo, stopped before adding new runtime work, recorded one verified handoff, and made source-diff stabilization the next iteration.

External source applied: https://github.com/DietrichGebert/ponytail — chose documentation/no-op over adding more code while source changes were already unreviewed.

External source applied: https://github.com/shadcn/improve — converted the dirty working tree into a file-specific review plan with anti-scope and verification commands.

External source applied: https://github.com/safishamsi/graphify — grouped related files by source/doc/test/dependency surfaces so reviewers can reason about dependencies before broad changes.
