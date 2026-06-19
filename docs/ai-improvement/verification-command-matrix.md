# Verification Command Matrix — halalflow / MosRev

Date: 2026-06-19 06:16 MPST (+0800)
Run type: docs-only verification matrix for source-diff stabilization
Code changes: none this run

## Purpose

Use this matrix when reviewing the current uncommitted working tree and before adding new runtime changes. The source-diff handoff is `docs/ai-improvement/uncommitted-source-verification-handoff.md`.

## Current snapshot

| Check | Command | Latest observed result | When to rerun |
|---|---|---|---|
| Working-tree inventory | `git status --short --branch --untracked-files=all` | Dirty: 9 tracked modified files and 7 untracked files at 06:16 MPST | At the start and end of every Zaky run, and after each review-lane decision |
| Source/runtime diff size | `git diff --shortstat -- package-lock.json src` | `6 files changed, 65 insertions(+), 34 deletions(-)` | After any source, lockfile, or test decision |
| Operator-doc diff size | `git diff --shortstat -- README.md docs/cron.md docs/deployment.md` | `3 files changed, 167 insertions(+), 78 deletions(-)` | After any setup/deploy/cron doc decision |
| Unit tests | `npm test` | Exit 0; 12 files / 83 tests passed | After test/source changes and before committing lanes |
| ESLint | `npm run lint` | Exit 0; 0 errors / 4 known dynamic image warnings | After component, route, lint, or image-surface changes |
| TypeScript | `npx tsc --noEmit` | Exit 0 | After TypeScript source/test/config changes |
| Production build | `npm run build` | Exit 0; build succeeds, with the known local missing-`DATABASE_URL` Prisma page-data warning | Before accepting source/runtime lanes or deploy-related docs |
| Static whitespace | `git diff --check` plus no-index checks for untracked docs | To be rerun after each tracking-doc update | After any docs/log/board patch |

## Review lanes and acceptance checks

| Lane | Files | Minimum verification before keep/commit | Approval notes |
|---|---|---|---|
| Operator setup/deployment docs | `README.md`, `docs/deployment.md`, `docs/cron.md` | Read-back, stale SQLite/5-minute-default search scoped to active docs, `git diff --check` | Owner/Fatin should confirm Postgres + RLS + Railway cron remains the intended operator posture. |
| Lockfile reproducibility | `package-lock.json` | `npm ci`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, fresh audits if dependency risk is in scope | Do not mix with `npm audit fix --force` or framework downgrades. |
| React lint/source stabilization | `src/components/LanguageToggle.tsx`, `src/components/ThemeToggle.tsx`, `src/lib/morph/useMorph.ts` | Targeted ESLint, full lint, `npm test`, `npx tsc --noEmit`; UI smoke if browser access is available | Review as source changes, even if intended as lint stabilization. |
| Static landing image conversion | `src/components/landing/MasjidGallery.tsx`, `src/components/landing/CommunityBand.tsx` | Targeted ESLint for both components, full lint, `npm test`, `npx tsc --noEmit`, `npm run build`; visual/browser smoke if available | Keep dynamic `photoUrl` policy separate from these static bundled images. |
| Pure-helper characterization tests | `src/lib/money.test.ts`, `src/lib/roles.test.ts`, `src/lib/api-errors.test.ts` | Targeted Vitest for each file, full `npm test`, `npm run lint`, `npx tsc --noEmit` | Test-only; no source behavior should be modified in this lane. |
| AI tracking docs | `docs/ai-improvement/*`, `C:/Ai/_zaky_ai_board/KANBAN.md` | Read-back, `git diff --check`, no-index checks for untracked docs/board, marker scan for stale placeholders/secrets | Keep tracking factual and update again after final verification outputs. |

## Anti-scope

Do not combine this stabilization pass with schema/RLS/auth/payment/business-rule changes, production deploys, cron changes, env var/secret edits, broad formatting, dependency upgrades, or UI redesigns.

## External Source Applied

External source applied: https://github.com/naimkatiman/continuous-improvement — matrix turns the current verification snapshot into repeatable evidence gates before the next iteration.

External source applied: https://github.com/DietrichGebert/ponytail — favors splitting/reviewing existing changes over adding new code.

External source applied: https://github.com/shadcn/improve — makes each lane execution-ready with commands and acceptance boundaries.

External source applied: https://github.com/safishamsi/graphify — maps related files and checks as connected review surfaces rather than a flat file list.
