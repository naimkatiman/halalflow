# Dependency Audit Triage — halalflow / MosRev

Date: 2026-06-18 08:15 MPST (+0800)
Run type: docs-only dependency/security triage
Code changes: none

## Executive Summary

`npm audit --audit-level=low` currently exits `1` with **5 vulnerabilities**: **2 low** and **3 moderate**. The advisories are concentrated in development/build tooling (`@babel/core`, `esbuild`, `js-yaml`) plus the production Next.js dependency path (`next` → nested `postcss`).

The safest conclusion is not to force-remediate. A non-force dry-run previews package updates, but the nested Next/PostCSS advisory still requires special care because npm's force path proposes installing `next@9.3.3`, which would be a breaking framework downgrade from the current Next 16 app. No dependency, lockfile, runtime behavior, environment variable, deployment target, schema, auth, billing, or business-rule change was made in this run.

## Source-of-Truth Inspected

- `package.json` — scripts, direct runtime dependencies, direct dev dependencies.
- `package-lock.json` — lockfile version, package count, vulnerable resolved versions, nested `postcss` path.
- `next.config.ts` — confirms production Next app surface and security headers.
- `eslint.config.mjs` — confirms Next core-web-vitals/typescript lint stack using `eslint-config-next`.
- `vitest.config.ts` — confirms Vite/Vitest is test-only tooling.
- `postcss.config.mjs` — confirms Tailwind PostCSS plugin path.
- `docs/ai-improvement/README.md` and `docs/ai-improvement/implementation-log.md` — existing Zaky baseline and recommended next move.
- `C:/Ai/_zaky_ai_board/agent_prompt_template.md` and `C:/Ai/_zaky_ai_board/KANBAN.md` — recurring-agent guardrails and board state.

## Commands Run

```text
node --version: v24.16.0
npm --version: 11.13.0
npm audit --audit-level=low: exit 1
npm audit --omit=dev --audit-level=low: exit 1
npm audit fix --dry-run --json: exit 1
package/lock parse: exit 0
lockfile/installed version probe: exit 0
```

## Audit Result Snapshot

```text
npm audit --audit-level=low
5 vulnerabilities (2 low, 3 moderate)
Affected packages: @babel/core, esbuild, js-yaml, postcss, next
```

```text
npm audit --omit=dev --audit-level=low
2 moderate vulnerabilities
Affected production path: next -> node_modules/next/node_modules/postcss
Force path proposed by npm: next@9.3.3 (breaking change)
```

## Affected Package Map

| Package | Current resolved version | Direct? | Runtime/dev path | Severity | Advisory / risk | Fix signal |
|---|---:|---|---|---|---|---|
| `@babel/core` | `7.29.0` | Transitive | Dev lint/tooling path under `node_modules/@babel/core`; installed as dev dependency tree | Low | Arbitrary file read via `sourceMappingURL` comment | `npm audit fix` says available; dry-run previews `@babel/core` and related Babel packages to `7.29.7` |
| `esbuild` | `0.27.4` | Transitive | Dev/test tooling via `tsx`, `vite`, and `vitest` | Low | Arbitrary file read when running a development server on Windows | `npm audit fix` says available, but this run's non-force dry-run did **not** list an `esbuild` version change; verify carefully in any real remediation run |
| `js-yaml` | `4.1.1` | Transitive | Dev lint tooling via `eslint` / `@eslint/eslintrc` | Moderate | Quadratic-complexity DoS in merge-key alias handling | `npm audit fix` says available; dry-run previews `js-yaml` to `4.2.0` |
| `postcss` nested under `next` | `8.4.31` | Transitive through direct `next` | Production/runtime framework path: `node_modules/next/node_modules/postcss` | Moderate | CSS stringify XSS via unescaped `</style>` | Only force path shown by audit, and it proposes breaking `next@9.3.3`; do not run force |
| `next` | `16.2.6` | Direct runtime dependency | Production app framework | Moderate via nested `postcss` | Audit range includes the current Next 16 line through nested PostCSS | Dry-run previews `next`/`@next/env`/SWC to `16.2.9`, but the audit still reports the Next/PostCSS issue; treat as unresolved until verified against a patched Next release |

Additional lockfile facts:

```text
next: lock=16.2.6; installed=16.2.6; runtime
@babel/core: lock=7.29.0; installed=7.29.0; dev
esbuild: lock=0.27.4; installed=0.27.4; dev
js-yaml: lock=4.1.1; installed=4.1.1; dev
postcss top-level: lock=8.5.15; installed=8.5.15; dev and not the vulnerable nested Next copy
postcss nested under Next: lock=8.4.31; runtime
vitest: lock=4.1.8; installed=4.1.8; dev
vite: lock=8.0.16; installed=8.0.16; dev
```

## Dry-Run Remediation Preview

Command:

```text
npm audit fix --dry-run --json
```

Observed result:

```text
exit 1
changed: 25
added: 0
removed: 0
audited: 451
```

Notable previewed package changes:

```text
next 16.2.6 => 16.2.9
@next/env 16.2.6 => 16.2.9
@next/swc-win32-x64-msvc 16.2.6 => 16.2.9
@babel/core 7.29.0 => 7.29.7
@babel/* helper/parser/traverse/template packages => 7.29.7
js-yaml 4.1.1 => 4.2.0
browserslist 4.28.1 => 4.28.2
caniuse-lite 1.0.30001780 => 1.0.30001799
baseline-browser-mapping 2.10.10 => 2.10.38
```

Caveat: npm emitted human-readable `change ...` lines before the JSON object even with `--json`, and the command still exited `1`. Per the Zaky dependency-audit guidance, treat the dry-run as a preview only, not a machine-validated remediation plan.

## Product and Operational Risk Interpretation

- **Production runtime risk:** the important runtime item is the direct `next` dependency carrying nested `postcss@8.4.31`. MosRev is a production-facing Next app with auth, bookings, billing hooks, uploads, and financial workflow surfaces, so framework dependency changes must be verified with lint, tests, typecheck, build, and smoke checks.
- **Contributor/CI risk:** `@babel/core`, `esbuild`, and `js-yaml` are dev/build/test/lint tooling risks. They still matter for local development, CI, and any exposed dev server, but they are not direct application request handlers in the current lockfile map.
- **Windows-specific esbuild risk:** the esbuild advisory is explicitly relevant because this recurring agent runs on a Windows host. Avoid exposing local dev/Vite tooling to untrusted networks.
- **Force-remediation risk:** `npm audit fix --force` would attempt a breaking Next downgrade and is not acceptable for autonomous execution.

## Recommended Remediation Plan

1. **Separate non-force dependency maintenance run**
   - Scope only: `npm audit fix` without `--force`.
   - Anti-scope: no `npm audit fix --force`, no framework downgrade, no package-manager migration, no env/deploy/schema/auth/billing/business-rule changes.
   - Verification required: `npm ci`, `npm run lint`, `npm test`, `npx tsc --noEmit`, `npm run build`, and fresh `npm audit --audit-level=low` plus `npm audit --omit=dev --audit-level=low`.
   - Acceptance: lockfile changes are understandable, no verification regressions, and audit risk is reduced or documented.

2. **Handle unresolved Next/PostCSS separately**
   - If non-force remediation leaves the nested Next/PostCSS advisory, wait for or intentionally evaluate a patched Next release in its own framework-patch run.
   - Do not accept npm's current force suggestion to install `next@9.3.3`.

3. **Keep image optimization warnings separate**
   - The current lint baseline is green with six `@next/next/no-img-element` warnings. Do not combine image-component polish with dependency remediation.

## Interim Guardrails

- Do not run `npm audit fix --force` in this repository without explicit Zaky/Fatin owner approval.
- Do not expose `next dev`, Vite/Vitest UI, or other local dev servers on untrusted networks while `esbuild` remains in the vulnerable range.
- Treat untrusted YAML parsing in local tooling as a contributor/CI risk until `js-yaml` is updated.
- Treat Next framework updates as production-affecting even when npm presents them as semver-compatible patch changes.
- Re-run the lockfile-vs-installed version probe after any dry-run or install command; npm explain output may describe prospective versions after a dry-run.

## Decision Needed From Zaky / Fatin

Approve a separate, tightly verified **non-force dependency maintenance run** that attempts `npm audit fix` without `--force`, then runs the full verification set and documents any remaining Next/PostCSS exposure. If approval is not granted, keep the current lockfile unchanged and monitor the Next/PostCSS advisory until a safe patched path is available.

## External Source Applied

External source applied: https://github.com/naimkatiman/continuous-improvement — researched existing repo state and audit output first, kept this to one docs-only increment, and deferred dependency mutation to a separate verified run.

External source applied: https://github.com/DietrichGebert/ponytail — chose the smallest valuable action, a no-code triage artifact, instead of changing framework/dependency versions while the remediation path is ambiguous.

External source applied: https://github.com/shadcn/improve — converted raw audit findings into a file-specific, execution-ready remediation plan with explicit verification and anti-scope.
