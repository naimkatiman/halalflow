# Verification Command Matrix — halalflow / MosRev

Date: 2026-06-22 19:48 MPST (+0800)
Run type: docs-only post-metrics verification checkpoint refresh for local-ahead dirty-tree stabilization
Code changes: none this run

## Purpose

Use this matrix when reviewing the current local-ahead commit, the remaining uncommitted working tree, and the refreshed docs-only source-review metrics packet before adding runtime changes. The controlling handoff is `docs/ai-improvement/uncommitted-source-verification-handoff.md`; the churn/size review aid is `docs/ai-improvement/source-review-metrics.md`.

## Current snapshot

| Check | Command | Latest observed result | When to rerun |
|---|---|---|---|
| Working-tree inventory | `git fetch --prune` then `git status --short --branch --untracked-files=all` | Dirty: `main...origin/main [ahead 1]` with 13 tracked modified files plus untracked `docs/ai-improvement/source-review-metrics.md` | At the start and end of every Zaky run, and after each review-lane decision |
| Remote-clean merge-base probe | `BASE=$(git merge-base HEAD origin/main)`; compare `origin/main`, `HEAD`, and current dirty paths | Merge-base `a7b8d034c0c69de409be8c9f6c963ee82649d96a`; `originChangedPathCount=0`; `trackedDirtyPathCount=13`; `untrackedPathCount=1`; `dirtyPathCount=14`; `dirtyOriginOverlapCount=0` | After every fetch and before claiming remote-clean or remote-divergent status |
| Local ahead commit | `git show --stat --oneline --decorate --no-renames HEAD --` | `a2a5447` adds 9 files / 2182 insertions: AI docs plus money, roles, and api-errors characterization tests | Before push/amend/reset decisions; after any git-history disposition |
| Source review metrics | Read `docs/ai-improvement/source-review-metrics.md` | Existing docs-only packet refreshed: source/test/config scope has 202 files / 12,845 code / 759 comments; source/runtime lane has 6 files / 65 insertions / 34 deletions | After source/runtime, package/config, docs, or metrics-packet changes |
| Source/runtime diff size | `git diff --shortstat -- package-lock.json src` | `6 files changed, 65 insertions(+), 34 deletions(-)` | After any source, lockfile, or test decision |
| Source/runtime per-file churn | `git diff --numstat -- package-lock.json src` | Largest dirty source/runtime file is `src/lib/morph/useMorph.ts` at `22` insertions / `9` deletions; `package-lock.json` is `23` / `17` | Before reviewing or splitting source/runtime lanes |
| Operator-doc diff size | `git diff --shortstat -- README.md docs/cron.md docs/deployment.md` | `3 files changed, 167 insertions(+), 78 deletions(-)` | After any setup/deploy/cron doc decision |
| AI tracking/status docs | `git diff --shortstat -- docs/ai-improvement`; include `git ls-files --others --exclude-standard docs/ai-improvement` for new files | AI tracking lane includes tracked README/log/handoff/matrix edits plus the untracked metrics packet; exact churn shifts with each tracking refresh | After any repo-local AI README/log/handoff/matrix/metrics patch |
| Lockfile content check | `git diff --summary -- package-lock.json` and `git diff --numstat -- package-lock.json` | Summary printed no rows; numstat showed `23 17 package-lock.json` | Before treating the lockfile lane as dependency, lockfile-only, or line-ending-only work |
| Package manifest parse | `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"` | Exit 0; `package.json ok` | After package metadata, scripts, or dependency changes |
| Unit tests | `npm test` | Exit 0; 12 files / 83 tests passed; Duration 946ms | After test/source changes and before committing lanes |
| ESLint | `npm run lint` | Exit 0; 0 errors / 4 known dynamic image warnings | After component, route, lint, or image-surface changes |
| TypeScript | `npx tsc --noEmit` | Exit 0 | After TypeScript source/test/config changes |
| Production build | `npm run build` | Exit 0; Next.js 16.2.6 compiled successfully in 3.5s, TypeScript finished in 9.7s, static generation completed 49/49 pages, with the known local missing-`DATABASE_URL` Prisma page-data warning | Before accepting source/runtime lanes or deploy-related docs |
| Static whitespace/read-back | `git diff --check` plus no-index checks for new docs/board | `git diff --check` exit 0; no-index checks on `docs/ai-improvement/source-review-metrics.md` and `C:/Ai/_zaky_ai_board/KANBAN.md` exited 1 with no whitespace-error output | After any docs/log/board patch |

## Review lanes and acceptance checks

| Lane | Files | Minimum verification before keep/commit | Approval notes |
|---|---|---|---|
| Local committed-but-unpushed AI/test lane | `a2a5447` (`docs/ai-improvement/*`, `src/lib/money.test.ts`, `src/lib/roles.test.ts`, `src/lib/api-errors.test.ts`) | `git show --stat HEAD --`, targeted helper Vitest if amended, full `npm test`, `npm run lint`, `npx tsc --noEmit` | Owner/Fatin/maintainer should decide keep/push, amend/split, or reset/drop. Do not mutate git history autonomously. |
| Remote-clean status | merge-base `a7b8d034c0c69de409be8c9f6c963ee82649d96a`, `origin/main`, current dirty paths | Re-run `git fetch --prune`, merge-base path inventory, and dirty-path overlap before any sync/push/rebase decision | Current evidence says origin changed-path set and dirty/origin overlap are both zero; this is not approval of local diffs. |
| Source review metrics packet | `docs/ai-improvement/source-review-metrics.md` | Read-back, no-index whitespace check while untracked, final status/overlap rerun | Review aid only; do not treat metrics or green checks as behavior-preservation proof. |
| Operator setup/deployment docs | `README.md`, `docs/deployment.md`, `docs/cron.md` | Read-back, stale SQLite/5-minute-default search scoped to active docs, `git diff --check` | Owner/Fatin should confirm Postgres + RLS + Railway cron remains the intended operator posture. |
| Lockfile reproducibility | `package-lock.json` | `npm ci`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, fresh audits if dependency risk is in scope | Do not mix with `npm audit fix --force` or framework downgrades. |
| React lint/source stabilization | `src/components/LanguageToggle.tsx`, `src/components/ThemeToggle.tsx`, `src/lib/morph/useMorph.ts` | Targeted ESLint, full lint, `npm test`, `npx tsc --noEmit`; UI smoke if browser access is available | Review as source changes, even if intended as lint stabilization. |
| Static landing image conversion | `src/components/landing/MasjidGallery.tsx`, `src/components/landing/CommunityBand.tsx` | Targeted ESLint for both components, full lint, `npm test`, `npx tsc --noEmit`, `npm run build`; visual/browser smoke if available | Keep dynamic `photoUrl` policy separate from these static bundled images. |
| AI tracking/status docs | `docs/ai-improvement/README.md`, `docs/ai-improvement/implementation-log.md`, `docs/ai-improvement/uncommitted-source-verification-handoff.md`, `docs/ai-improvement/verification-command-matrix.md`, `docs/ai-improvement/source-review-metrics.md`, `C:/Ai/_zaky_ai_board/KANBAN.md` | Read-back, `git diff --check`, no-index check for central board when outside the repo, marker scan for stale placeholders/secrets | Keep tracking factual and update again after final verification outputs. Do not treat tracking-doc diffs as source review approval. |

## Anti-scope

Do not combine this stabilization pass with schema/RLS/auth/payment/business-rule changes, production deploys, cron changes, env var/secret edits, broad formatting, dependency upgrades, UI redesigns, or any git push/amend/reset/rebase without explicit approval.

## External Source Applied

External source applied: https://github.com/naimkatiman/continuous-improvement — packet turns the current local-ahead and dirty-tree snapshot into repeatable evidence gates before the next iteration.

External source applied: https://github.com/DietrichGebert/ponytail — favors verifying and reviewing existing local/dirty work over adding new code.

External source applied: https://github.com/shadcn/improve — makes each lane execution-ready with commands, path-overlap evidence, source-review metrics, and acceptance boundaries.

External source applied: https://github.com/safishamsi/graphify — maps related files, remote/local path sets, and checks as connected review surfaces rather than a flat file list.

External source applied: codebase-inspection/pygount — records source/test/config size with docs and build outputs excluded so review priority is not distorted by tracking-log growth.

External source applied: zaky-improvement-stack/source-review-metrics-packet + post-metrics checkpoint example — refreshes existing checkpoint evidence rather than duplicating artifacts or layering new runtime work.
