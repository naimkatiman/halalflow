# Source Review Metrics Packet — halalflow / MosRev

Date: 2026-06-22 19:48 MPST (+0800)
Run type: docs-only post-metrics verification checkpoint for local-ahead dirty-tree stabilization
Code changes: none this run

## Purpose

The repo already has an uncommitted-source handoff and verification matrix, and both warn against layering new runtime work on top of the current local-ahead/dirty tree. This packet adds review leverage for Zaky, Fatin, and maintainers: branch posture, path overlap, churn by lane, source/test/config size, and the exact checks that were green during this run.

Metrics, green checks, and no-overlap probes are review aids only. They do **not** approve the local commit, accept the dirty source/runtime files, or authorize deploy/push/reset/rebase decisions.

## Current git and review posture

Observed from `C:/Ai/halalflow` after `git fetch --prune` on 2026-06-22 19:48 MPST (+0800):

| Check | Result |
|---|---|
| Branch status | `main...origin/main [ahead 1]` |
| Merge base | `a7b8d034c0c69de409be8c9f6c963ee82649d96a` |
| Remote changed paths since merge base | `0` |
| Dirty paths after this checkpoint | `14` (`13` tracked paths plus untracked `docs/ai-improvement/source-review-metrics.md`) |
| Dirty/remote overlap | `0` |
| Local-ahead path count | `9` |
| Local-ahead commit | `a2a5447 test(lib): add money, api-errors, roles characterization tests` |

### Dirty path set after this checkpoint

```text
README.md
docs/ai-improvement/README.md
docs/ai-improvement/implementation-log.md
docs/ai-improvement/source-review-metrics.md
docs/ai-improvement/uncommitted-source-verification-handoff.md
docs/ai-improvement/verification-command-matrix.md
docs/cron.md
docs/deployment.md
package-lock.json
src/components/LanguageToggle.tsx
src/components/ThemeToggle.tsx
src/components/landing/CommunityBand.tsx
src/components/landing/MasjidGallery.tsx
src/lib/morph/useMorph.ts
```

### Local-ahead path set

`git diff --name-status --no-renames "$BASE"..HEAD` listed only local additions from commit `a2a5447`:

```text
A	docs/ai-improvement/README.md
A	docs/ai-improvement/dependency-audit-triage.md
A	docs/ai-improvement/image-surface-decision-note.md
A	docs/ai-improvement/implementation-log.md
A	docs/ai-improvement/uncommitted-source-verification-handoff.md
A	docs/ai-improvement/verification-command-matrix.md
A	src/lib/api-errors.test.ts
A	src/lib/money.test.ts
A	src/lib/roles.test.ts
```

Review implication: decide the local commit posture first (`keep/push`, `amend/split`, or `reset/drop`), then review the remaining dirty lanes below. The remote path set is currently empty, but that does not make any local diff accepted.

## Churn by review lane

### Source/runtime and lockfile lane

Tracked shortstat at 03:48 MPST:

```text
6 files changed, 65 insertions(+), 34 deletions(-)
```

Per-file `git diff --numstat -- package-lock.json src`:

| File | Insertions | Deletions | Review note |
|---|---:|---:|---|
| `package-lock.json` | 23 | 17 | Lockfile sync; review separately from dependency remediation and never mix with `npm audit fix --force`. |
| `src/components/LanguageToggle.tsx` | 5 | 1 | React lint/source stabilization; review behavior preservation. |
| `src/components/ThemeToggle.tsx` | 4 | 1 | React lint/source stabilization; review requestAnimationFrame deferral. |
| `src/components/landing/CommunityBand.tsx` | 6 | 3 | Static landing image conversion; keep separate from dynamic `photoUrl` image policy. |
| `src/components/landing/MasjidGallery.tsx` | 5 | 3 | Static landing image conversion; keep separate from dynamic `photoUrl` image policy. |
| `src/lib/morph/useMorph.ts` | 22 | 9 | Morph hook lint/runtime stabilization; review reduced-motion and progress state flow. |

### Operator documentation lane

Tracked shortstat at 03:48 MPST:

```text
3 files changed, 167 insertions(+), 78 deletions(-)
```

Per-file `git diff --numstat -- README.md docs/cron.md docs/deployment.md`:

| File | Insertions | Deletions | Review note |
|---|---:|---:|---|
| `README.md` | 15 | 7 | Confirms public setup and self-hosting docs align to PostgreSQL + RLS. |
| `docs/cron.md` | 46 | 37 | Confirms Railway daily `/api/cron/trial-emails` posture supersedes stale SQLite/5-minute notes. |
| `docs/deployment.md` | 106 | 34 | Confirms three-URL RLS role contract and production checklist. |

### AI tracking/status lane

Tracked AI-doc shortstat after the tracked docs refresh and before this packet's untracked follow-up tracking edits:

```text
4 files changed, 1144 insertions(+), 94 deletions(-)
```

Per-file `git diff --numstat -- docs/ai-improvement` at checkpoint time after the tracked docs refresh and before this packet's untracked follow-up tracking edits:

| File | Insertions | Deletions | Review note |
|---|---:|---:|---|
| `docs/ai-improvement/README.md` | 20 | 14 | Repo-local baseline/status refresh. |
| `docs/ai-improvement/implementation-log.md` | 963 | 0 | Historical implementation evidence plus latest checkpoint entries. |
| `docs/ai-improvement/uncommitted-source-verification-handoff.md` | 134 | 66 | Current handoff and remote-clean evidence. |
| `docs/ai-improvement/verification-command-matrix.md` | 27 | 14 | Current lane verification commands. |

After this packet, `docs/ai-improvement/source-review-metrics.md` remains an untracked review artifact until owner/Fatin/maintainer decide how to commit/split AI tracking docs.

## Source/test/config size metrics

Measured with `uvx --from pygount pygount --format=summary` over source/test/config inputs only (`src`, `prisma`, `scripts`, `package.json`, `package-lock.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, and `vitest.config.ts`), excluding `.git`, `node_modules`, build outputs, `.next`, `docs`, `public`, caches, and coverage:

| Language | Files | Code | Comment |
|---|---:|---:|---:|
| TSX | 85 | 7,193 | 170 |
| TypeScript | 98 | 5,075 | 433 |
| Transact-SQL | 9 | 381 | 134 |
| CSS+Lasso | 1 | 113 | 18 |
| JSON | 2 | 61 | 0 |
| JavaScript | 2 | 11 | 3 |
| XML | 1 | 11 | 1 |
| `__unknown__` | 1 | 0 | 0 |
| `__generated__` | 2 | 0 | 0 |
| `__binary__` | 1 | 0 | 0 |
| **Sum** | **202** | **12,845** | **759** |

This scope deliberately excludes `docs/ai-improvement` and central-board Markdown so tracking-log growth does not distort source/test/config size.

## Verification snapshot from this run

Commands run from `C:/Ai/halalflow` on 2026-06-22 19:50-19:51 MPST:

```text
package.json parse: exit 0; package.json ok
npm test: exit 0; Test Files 12 passed (12); Tests 83 passed (83); Duration 946ms
npm run lint: exit 0; 4 problems (0 errors, 4 warnings), all known dynamic @next/next/no-img-element surfaces
npx tsc --noEmit: exit 0
npm run build: exit 0; Next.js 16.2.6 compiled successfully in 3.5s; TypeScript finished in 9.7s; static generation completed 49/49 pages; known local missing-DATABASE_URL Prisma page-data warning still printed
uvx --from pygount pygount ...: exit 0; Sum 202 files / 12,845 code / 759 comments
```

## Anti-scope

This run did not change application source, tests, package files, dependencies, lockfile, schema/RLS, auth/session, billing/payment, UI behavior/copy/layout, deployment config, environment variables, secrets, cron jobs, data, business rules, git history, branches, remotes, or production state. It did not commit, amend, reset, rebase, stage, push, deploy, or run dependency remediation.

## Recommended review sequence

1. Decide local commit `a2a5447` posture first: keep/push, amend/split, or reset/drop.
2. Review source/runtime and lockfile lane by per-file risk: `useMorph`, static image components, toggles, then `package-lock.json`.
3. Review operator docs (`docs/deployment.md`, `docs/cron.md`, `README.md`) against intended PostgreSQL + RLS + Railway operator posture.
4. Review AI tracking/status docs separately; they are evidence artifacts, not acceptance of the runtime/source lane.
5. Only after the local commit and dirty lanes have an owner/Fatin/maintainer disposition should new runtime, dependency, auth, schema, deployment, or business-rule work resume.

## External Source Applied

External source applied: https://github.com/naimkatiman/continuous-improvement — re-scanned state, fetched remote, verified overlap and checks, and stopped before runtime work.

External source applied: https://github.com/shadcn/improve — turned the dirty tree into an execution-ready review packet with file-specific lanes and verification gates.

External source applied: https://github.com/DietrichGebert/ponytail — chose review leverage and no new code over expanding an already-unreviewed diff.

External source applied: https://github.com/safishamsi/graphify — mapped the local commit, dirty paths, source/runtime files, operator docs, and AI tracking docs as related review surfaces.

External source applied: codebase-inspection/pygount — measured source/test/config composition with dependency/build/docs outputs excluded.

External source applied: zaky-improvement-stack/source-review-metrics-packet + post-metrics checkpoint example — refreshed the existing metrics packet and verification evidence instead of creating a duplicate artifact or layering new runtime work.
