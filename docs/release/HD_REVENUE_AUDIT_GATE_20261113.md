# HDCHART — P0 revenue / QA release gate (2026-11-13)

## Verified repo status at audit time

- Repository: `pejtr/humandesignchart` — production: `humandesignchart.app` (EN), `humandesignmapa.cz` (CZ).
- Cloudflare Pages project: `humandesignchart-web`.
- PR **#84** fixes the expensive failure: purchase initiated without verified chart/account, and blank Blueprint/PDF. Draft, not merged or production-tested.
- PR **#85** Bodygraph motion, **#86** calculator ambient design: draft / visual; do not ship before P0 verification.
- PR **#87** and **#88** have overlapping sticky-header and WhatsApp OG fixes; reconcile into one tested candidate, never merge both blindly.

## Priority (profit first)

1. **P0 checkout/PDF safety:** Verify PR #84 login and complete birth chart requirements (both EN and CZ), rejected guest/invalid chart/mismatched email before any payment, successful **test-mode** purchase, idempotent webhook, paid entitlement, a real non-blank chart/PDF and an existing paid-order recovery path. DO NOT enable guest checkout merely for conversion until ownership/delivery has been redesigned and tested.
2. **P0 completion and conversion:** Validate actual calculator birth-place autocomplete, timezone correctness, valid/invalid forms, Google OAuth callback, checkout CTA, and zero first-party errors on 390px mobile. Reconcile consenting GA4 events with server-side paid orders; never infer a completed purchase from a button click.
3. **P1 experience and performance:** Isolated preview of PR #87 (or deduplicated #88), #86, #85. Favor responsive speed and accessibility over decorative animation.

## New automated read-only smoke

`scripts/qa/audit-revenue-preview.mjs`:
- **Fails closed** unless `HD_AUDIT_PREVIEW_URL` is a real HTTPS `<id>.humandesignchart-web.pages.dev/` preview origin. There is no production fallback.
- Requires Playwright + Chromium **only in the isolated QA checkout**, not as a new production dependency.
- Opens 4 public URLs (`/cs`, `/en`, `/cs/calculate`, `/en/calculate`) at 390px and 1440px with reduced motion, taking 8 screenshots.
- Captures status, unexpected cross-origin redirect, JS page errors, first-party network failures, horizontal overflow, basic labels, OG/canonical/hreflang, small targets, and **lab-only indicative** LCP/CLS.
- Outputs `qa-artifacts/hd-revenue-audit/audit-report.md` and `audit-report.json`, with optional SHA and deployment ID fields.
- **Never** clicks forms, submits birth data, logs in, starts checkout or modifies production storage. Zero findings does **not** mean checkout works.

### Run (after approved isolated Cloudflare Pages preview deployment)

```powershell
$env:HD_AUDIT_PREVIEW_URL = "https://<actual-preview-id>.humandesignchart-web.pages.dev/"
$env:HD_AUDIT_COMMIT_SHA = "<actual-tested-sha>"
$env:HD_AUDIT_DEPLOYMENT_ID = "<actual-deployment-id>"
node scripts/qa/audit-revenue-preview.mjs
```

Never invent preview ID or reuse production D1 / real payment credentials in preview. Keep exact SHA, preview deployment ID, rollback ID and screenshots in the release evidence.

## Corrections to uploaded audit-v2 draft

- The original `page.goto('/cs')` requires an explicit Playwright `baseURL`. Original code did not configure it.
- Global `findings[]` with `afterAll` across parallel workers risks overwriting partial reports. This script is sequential with one report.
- LCP/CLS observers should be initialized **before** the page load; don't present 1.5-second lab sampling as field Core Web Vitals. Filter layout shifts with recent input.
- A failed third-party tracking request is not automatically P0; first-party failures require triage. `console.error` alone is not always a customer defect.
- rAF callback count does not directly measure animation FPS. Comparing an arbitrary SVG child's top coordinate does not prove CSS stroke-dashoffset has paused. PR #85 needs animation-specific state assertions.
- Do not assume a `.bodygraph` selector, `data-motion-preset`, or ZEN button contract without inspecting the actual component.
- Native validation errors may use `aria-errormessage` or browser validation rather than `aria-describedby`; a11y needs actual assistive-technology/manual testing.
- The suggested analytics funnel percentages are **unverified hypotheses**, not measured HDCHART benchmarks. Purchase confirmation requires trusted, idempotent server webhook events. Respect consent; do not send birth details, email, or chart content to advertising platforms.
- Do not advertise **48 pages**, emailed PDF delivery or an unconditional guarantee without verifying the real sold product. Current PR #84 describes **Print / Save as PDF**, not verified server-generated attachment.
- The `.lighthouserc.json` example by itself is not a CI gate. Project delivery preference is direct Cloudflare release validation; no mandatory GitHub Actions deploy.

## GO / NO-GO

**NO-GO** until:
- [ ] Exact candidate SHA: `pnpm check`, `pnpm test`, `pnpm build:cloudflare` PASS.
- [ ] Isolated Cloudflare preview deployed; real deployment ID / rollback ID recorded.
- [ ] Mobile/desktop screenshots and real browser QA PASS, incl. 360/390/768/1440/3840, reduced motion and keyboard.
- [ ] Google OAuth callback works for both domains, including real account binding.
- [ ] Invalid chart/guest users cannot reach payment gateway; valid chart in authorized test checkout succeeds.
- [ ] Test-mode paid webhook is idempotent, stored paid chart complete, PDF Bodygraph non-empty, and paid recovery path works.
- [ ] Post-deploy production HTTP/redirect/analytics health read-back verified without charging users.

**The QA PR adds observation only, makes no payment or design changes, and is not production release approval.**

## Corrected executable release handoff (13 Nov)

The owner-provided PowerShell runbook was **not** executed. It describes several incompatible paths and payment assumptions; do **not** run it verbatim:

| In supplied runbook | Verified repository contract / safe action |
|---|---|
| `stripe events resend`, Stripe card `4242...`, `/api/webhooks/stripe` | Current Cloudflare Pages Blueprint path calls **ONYX PAY** `/api/paygate/checkout-sessions` on `pay.optimateo.com`; captured order uses `/api/internal/onyxpay/fulfill`. Never send Stripe test webhooks to this flow. A dedicated isolated ONYX PAY test tenant and capture evidence are required. |
| `/cs/checkout`, `/en/checkout` | Existing paid offer uses `/cs/honorace`, `/en/honorace`, and `subscription.createCheckout` after authenticated, complete birth chart. The route `/checkout` was not independently verified. |
| `page.waitForEvent('download')` and `%PDF-` for Blueprint | Current client generates HTML with an inline Bodygraph SVG and calls **browser print / Save as PDF**. Inspect actual print output; a `download` event is not the current client contract. |
| `wrangler.toml` / `[env.preview]` | This is an existing **Cloudflare Pages Direct Upload** deployment; check project preview/production bindings via the Cloudflare Pages project API before any deploy. Never add guessed config or replace the project. |
| `git worktree add ... -b qa/pr84 origin/pull/84/head` | Fetch PR ref first, then create a clean isolated worktree. Do not assume Git has a pre-existing `origin/pull/84/head` tracking branch. |
| `npx wrangler pages deploy ... --branch=qa-pr84-preview` is safe by itself | A different branch **does not certify isolation of D1, secrets, payments or mail**. Verify actual preview bindings first. |
| PR #84 exact commit `17eb6beb...` | An extra **read-only-by-default PowerShell preview release helper** was added to PR #84 after this SHA. Always fetch and verify latest PR head and CI before deploying. |

### Actual release helper

The **PR #84** branch now contains `scripts/qa/release-blueprint-preview.ps1`. Run it from a clean isolated checkout of that exact PR branch:

```powershell
pwsh -File scripts/qa/release-blueprint-preview.ps1
# Only after preflight PASS and separate inspection:
pwsh -File scripts/qa/release-blueprint-preview.ps1 -Deploy
```

This helper verifies branch HEAD against the remote, runs frozen install/typecheck/Vitest/Cloudflare build, reads current Cloudflare project config, blocks detected shared storage/payment/auth/email credentials, defaults to **no deploy**, and when explicitly requested deploys **preview only**. The callback, payment capture and OAuth test must use purpose-built nonproduction providers; without them these gates stay **BLOCKED / production NO-GO**.

Do **not** paste credentials, Google client secrets, paid-user birth data, or API keys into chat, pull requests or reports. Never send real payments merely to produce E2E evidence.
