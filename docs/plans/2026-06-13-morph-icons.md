# Plan: Two-state morphing icon system

Date: 2026-06-13
Branch: `feat/morph-icons`

## Goal

A reusable, zero-dependency system for icons that smoothly morph between two states
(state A ↔ state B), plus one real wire-in. Morph = SVG path `d` interpolation, not
crossfade.

## Why zero-dep

`smooth shape morph` normally implies Flubber/GSAP. We avoid both: since the system
owns its icon pairs, we author each pair with an *identical path command structure*
(same `M/L/C/Z` sequence, only the numbers differ). Interpolation is then plain
number lerp — no library, bulletproof cross-browser, no patchy CSS `d` reliance.

Constraint enforced by `lerpPath`: if the two paths don't share structure, it throws.

## Units (high cohesion, independently testable)

1. `src/lib/morph/lerpPath.ts` — pure. `lerpPath(a, b, t)` tokenizes two
   structurally-identical path strings, lerps numeric tokens at `t∈[0,1]`, returns a
   `d` string. Throws on structure mismatch. **Unit tested (vitest, node env).**
2. `src/lib/morph/useMorph.ts` — `useMorph(active, { duration })` drives `t` via
   rAF with easeInOutCubic; honors `prefers-reduced-motion` (snaps). Returns `t`.
3. `src/components/morph/morphIcons.ts` — registry of matched pairs:
   `downloadCheck`, `plusX`, `chevron`. Stroke-based on `viewBox 0 0 256 256` to
   sit on Phosphor's grid (matches the emerald brand mark in `src/app/icon.svg`).
4. `src/components/morph/MorphIcon.tsx` — `<MorphIcon name active size strokeWidth
   duration />`. Renders one `<path>` of the lerped `d`.

## Real wire-in

`src/app/templates/[id]/ExportButton.tsx`: on successful export, morph
`DownloadSimple → check` (`downloadCheck`, ~1.6s) as a success affordance, then
back. Today export gives zero feedback — this is a genuine UX win in an isolated spot.

## Matched-path technique

Both states share command sequence. For pairs where one state is naturally simpler
(check vs download), extra subpaths in the simpler state are collapsed onto the visible
stroke so they're invisible at rest but slide into place during the morph.

## Visual style decision

Stroke-based (round caps/joins, ~stroke 20 on the 256 grid), not Phosphor's filled
regular weight. Far cleaner to morph and matches the existing brand mark. Tradeoff:
reads slightly lighter than adjacent Phosphor regular icons.

## Verification

- `npm test` — lerpPath math (t=0/0.5/1, mismatch throws, negatives/decimals).
- `npx tsc --noEmit` — types across new files + ExportButton.
- Visual: render `downloadCheck` at t=0/0.5/1 to SVG and eyeball the midpoint.

## Out of scope (deferred)

- Standalone demo page — the ExportButton wire-in is the live example.
- `sitStand` showcase pair — can be added to the registry later using the same
  matched-path technique.
