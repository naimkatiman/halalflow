# Landing Page — Design Spec

**Date:** 2026-05-15
**Status:** Approved (visual direction B), build in progress
**Scope:** Public marketing landing page at `/` for anonymous visitors.

## Problem

`/` (`src/app/page.tsx`) redirects every visitor to `/login`. There is no public page
explaining what HalalFlow is. Anonymous visitors land on a bare login form.

## Decision

Replace the anonymous redirect with a real landing page. Logged-in users still
redirect to `/dashboard`.

Visual direction **B — warm & faith-forward**: emerald-tinted hero with a subtle
Islamic geometric motif, distinct community identity, built on the app's existing
design system (Geist font, Phosphor icons, emerald accent, zinc neutrals).

Built under `taste-skill` baseline — variance 8 / motion 6 / density 4:
- Asymmetric split hero (no centered hero).
- Zig-zag use-case grid (no 3-equal-card row).
- Connected stepper for "how it works" (no boxed cards).
- Motion is **CSS only** — reuses the existing `.animate-fade-up` keyframe with
  `--index` stagger from `globals.css`. No `framer-motion`, no new dependencies.

## Architecture

The root `layout.tsx` injects `<Navbar/>`, a constrained `<main max-w-screen-xl px-6 py-8>`,
and a `<footer>` on every route. The landing page works **within** that shell:

| File | Change |
|---|---|
| `src/app/page.tsx` | modify — logged in → `redirect('/dashboard')`; else render `<LandingPage/>` |
| `src/components/Navbar.tsx` | modify — add `pathname === '/'` branch: public header (logo, "Use cases" / "How it works" anchor links, Sign in link, Get started button) |
| `src/components/landing/LandingPage.tsx` | new — composes the sections |
| `src/components/landing/Hero.tsx` | new — asymmetric split: copy left, workflow-card preview right; emerald `rounded-3xl` panel with geometric motif |
| `src/components/landing/UseCases.tsx` | new — zig-zag 4-tile grid: mosque expenses, donation acknowledgments, invoice/payment approvals, zakat distribution (emphasized) |
| `src/components/landing/HowItWorks.tsx` | new — 3-step connected stepper: build a template → submit a workflow → approve & audit |
| `src/components/landing/CtaBand.tsx` | new — deep-emerald `rounded-3xl` band, "Start running your approvals today" + Get started |

Footer: reuse the existing `layout.tsx` footer. No new Footer component.

All landing components are static RSC — zero client JS. CTAs are plain `<Link>`s to
`/register` and `/login`.

## Data flow

`page.tsx` (RSC) reads iron-session. `isLoggedIn` → `redirect('/dashboard')`.
Otherwise renders `<LandingPage/>`. No data fetching — content is static.

## Error / edge states

Static page — no loading/error states needed. Only branch is the session check.
`Navbar.tsx` already fetches `/api/auth/me` in a `useEffect`; on `/` it early-returns
the public header before using `user`, so the (harmless, anon-null) fetch is ignored.

## Verification

- `npm run build` green.
- `/` returns **200** for an anonymous request and the HTML contains the hero headline.
- `/` returns **307 → /dashboard** for a logged-in request (existing behavior preserved).
- Deploy to the existing Railway `halalflow` service; re-run the live check.

## Out of scope (iterate later)

- Mobile hamburger menu (nav links collapse with CSS; single-column stack under `md`).
- Magnetic buttons / `framer-motion` (would add a dependency).
- App screenshots, FAQ, testimonials (this is the "standard" scope, not "rich").
