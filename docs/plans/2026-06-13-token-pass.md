# Cross-cutting token pass — danger/pending colors + `.tap` press class

Date: 2026-06-13
Branch: `feat/morph-icons`
Slug: token-pass
Status: in progress

## Goal

One observable outcome: destructive/awaiting state colors and tap press-feedback
come from a single source of truth, so future changes are one-line and every
surface stays consistent. **Visually identical** this pass — token hex values
match today's palette; this is a centralizing refactor, not a redesign.

## Why now

Phase 1 (nav declutter) shipped. The 9-surface audit flagged duplicated state
colors (red for destructive, amber for awaiting) hardcoded across ~30 files, and
a press-feedback motion string (`TAP`) inlined in `Navbar.tsx`. Both are
cross-cutting primitives that belong in `globals.css`.

## Decisions (locked)

- Keep Phosphor on this branch (user-confirmed; concurrent writer owns the morph system).
- Token values equal current Tailwind palette values. No design fork.
- "Pending" stays **bimodal by design**: workflow `pending` = blue ("Awaiting
  approval", informational), booking `requested` = amber ("Menunggu"). The
  `--pending` token is the **amber** awaiting/requested semantic only. Do NOT
  recolor the blue workflow-pending or the blue "Menunggu pembayaran" panel —
  different meaning (info), out of scope.
- Tokens + `.tap` live in `src/app/globals.css` (Tailwind v4 `@theme inline`
  for colors; plain CSS class for `.tap`, matching existing `.skeleton`).

## Token contract

Added as an `@theme inline` block in `globals.css`. Each token **aliases the
Tailwind theme variable** for the shade it replaces — NOT a hex literal.
Reason: Tailwind v4 defines its palette in oklch (`red-600 =
oklch(57.7% 0.245 27.325)`, emitted as `#e40014` in v4.2.2), so a v3-era hex
(`#dc2626`) would visibly shift the colour and clash with untouched
`bg-red-600` elements. Referencing the var makes the swap identical by
construction and palette-agnostic. (Caught by the adversarial review — the
first hex-literal attempt was a real regression.)

| Token | Aliases | Role |
|---|---|---|
| `--color-danger` | `var(--color-red-600)` | solid destructive bg / primary danger text |
| `--color-danger-strong` | `var(--color-red-700)` | hover bg / emphasized danger text |
| `--color-danger-tint` | `var(--color-red-50)` | tinted danger background |
| `--color-danger-line` | `var(--color-red-200)` | tinted danger border |
| `--color-pending` | `var(--color-amber-700)` | pending/awaiting text |
| `--color-pending-tint` | `var(--color-amber-50)` | pending background |
| `--color-pending-line` | `var(--color-amber-200)` | pending border |

Verified in compiled CSS: `.bg-danger{background-color:var(--color-red-600)}`
and `--color-red-600` is emitted to `:root`, so it resolves identically to
`bg-red-600`.

Generated utilities used by the sweep:
- Solid destructive: `bg-danger hover:bg-danger-strong text-white`
- Subtle danger / hover: `bg-danger-tint text-danger border-danger-line`
- Error chip: `text-danger bg-danger-tint border border-danger-line`
- Pending badge/panel: `bg-pending-tint text-pending border border-pending-line`

`.tap` (plain CSS, reduced-motion guarded) replaces the `TAP` string verbatim in
behavior.

### Mapping rule (what gets tokenized)

Swap a class ONLY where the token hex equals the Tailwind shade exactly:
`red-{600,700,50,200}` and `amber-{700,50,200}`. Two deliberate exceptions and
one hold-out:

- **Error-chip `-100` borders** (`border-red-100`, `border-amber-100`): the
  canonical `role="alert"` error pattern uses a 100 border. Mapped to the
  `-line` (200) token for full pattern centralization. Imperceptible 1-step
  darkening on error-chip borders only — the one allowed visual delta.
- **Focus-ring micro-shades** (`ring-red-500/20`, `border-red-400`): left raw.
  Different visual role (focus affordance), and 400/500 have no role token.
- **emerald (success) and blue (info)**: untouched — out of scope this pass.

## Surfaces swept (the keystone + 5)

1. `src/app/globals.css` — tokens + `.tap` (keystone). Imported by `app/layout.tsx`.
2. `src/components/ui/Badge.tsx` — status colors → tokens (fixes every badge consumer).
3. `src/components/DeleteButton.tsx` — danger tokens + `.tap`.
4. `src/app/workflows/[id]/ApprovalActions.tsx` — reject = danger tokens + `.tap`.
5. `src/app/bookings/[id]/BookingActions.tsx` — danger/pending tokens + `.tap`.
6. `src/components/Navbar.tsx` — `TAP` constant → `.tap` class (my Phase-1 file).

## Out of scope (deferred — logged, not done quietly)

- Scattered form error text (`text-red-600 role="alert"`) in the ~20 auth/finance
  forms — convert in a follow-up sweep; only touched here where already editing.
- Decorative landing-page reds/ambers (Hero, CtaBand, UseCases, etc.) — not state colors.
- `--success` token (emerald confirmations) — option scoped to danger/pending only.
- Concurrent-writer files: `morph/`, `ExportButton.tsx`, `LandingPage.tsx`,
  `MasjidGallery.tsx` — do not touch.

## Verification

1. `npx tsc --noEmit` — green.
2. `npm run lint` — no new errors on touched files.
3. `npm run build` — succeeds (confirms Tailwind v4 generates the new utilities).
4. Adversarial review (multi-agent): pixel-equivalence, completeness, no false
   positives, no broken className/JSX.

## Notes

- gateguard 50-file session cap was full; pruned 35 stale entries (kept my 4
  targets + the concurrent writer's in-flight morph/landing files) to free slots,
  then cleared `globals.css` + `BookingActions` + this doc via the facts→clear
  flow. User-approved.
- Tailwind v4 generates `bg-danger-tint` etc. from `--color-danger-tint` in `@theme`.
