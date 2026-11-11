# Bodygraph premium preview — release gate

**PR:** #85 · **Scope:** Cloudflare Pages preview only. No automatic merge, production deploy, payments, OAuth or D1 changes.

## Implemented in the PR
- CZ/EN `/cs/motion-preview` and `/en/motion-preview` with premium copy, real client-side illustrative Bodygraph, CTA to free chart calculator, controls, ZEN/FLOW explanations and three FAQ items.
- Floating glass motion pill with icon-only Play/Pause, segmented ZEN/FLOW, desktop/mobile behavior, localStorage preference, auto-pause and reduced-motion safety.
- Center labels on hover, focus and tap; decorative center/channel accents, readable static frame.
- 15s **animated SVG illustration** (`client/public/images/motion-preview-loop.svg`), **not** a claimed recording. No fabricated testimonials, beta-tester names, generated-graph counts, or unmeasured “zero lag” claims.
- Build-time generated PNG social card `/images/og-motion-preview.png`, OG/Twitter metadata server-side and client-side; the preview route is `noindex` until approval.

## Evidence still required from an actual Cloudflare Pages preview
1. Preserve the Antigravity local WIP; use a clean isolated checkout of branch `feat/bodygraph-motion-controls-20261110`. Run frozen install, `pnpm check`, Vitest, and `pnpm build:cloudflare`. The build script generates the PNG under `client/public/images`; check `dist/public/images/og-motion-preview.png` is a nonempty **1200×630 PNG**.
2. Inspect the preview deployment's secrets and bindings before any upload. Use the existing Pages project `humandesignchart-web` with preview branch `hd-motion-preview`. Never use `--branch main`.
3. After preview deployment verify `/cs/motion-preview` and `/en/motion-preview` return actual HTML and correct server-side OG tags. Confirm PNG URL HTTP 200 with `image/png`, metadata title, `noindex`, 1200×630 and correct preview host for `og:url` and `og:image`.
4. Browser QA at **360, 390, 768, 1440, 3840px**: no horizontal overflow, glass pill in lower right, 44×44px target, mobile stickiness within chart section, keyboard Tab/Enter, tap center description, focus/tooltip visible, `aria-pressed` updates, ZEN→FLOW visual difference and Play/Pause without chart geometry changes.
5. Verify `localStorage` survives reload; corrupt storage degrades safely; reduced-motion disables animation even after manual Play; hidden tab and offscreen auto-pause; return to viewport resumes without user preference corruption.
6. Capture **real screenshots** (desktop 1440, 4K 3840, mobile 390), each showing the visible glass control, and a **real 15-second muted MP4 or GIF** switching ZEN→FLOW using DevTools/Playwright and a screen recorder. Keep recordings separate from the illustrative SVG. These three screenshots and the real capture are **not yet produced**.
7. Collect a real DevTools Performance trace for 30 seconds in each mode; report median frame intervals, dropped frames, CPU impact and effects on responsiveness. The optional `?motionqa=1` rAF sampler is only a rough browser cadence indicator, not proof of 60 FPS, and only runs on localhost / `*.pages.dev`.
8. Verify CTA opens free chart calculator, preview does not auto-trigger checkout/login, no Graph API errors, P0 Blueprint checkout or auth changes, and no PII embedded in demo.
9. Only publish beta testimonials and traffic/count metrics after verifying consent and data source; do not create illustrative quotes that impersonate real testers.

**Release status until evidence exists: NO-GO for production.** Preview can be deployed only after build and isolated binding safety checks.
