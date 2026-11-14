# OMNI Umami + A/B/C pilot — humandesignchart.app (31. 10. 2026)

## Release state
**IMPLEMENTED ON FEATURE BRANCH, NOT APPROVED FOR PRODUCTION.** The pilot is OFF by default and intentionally fails closed. No Umami Website ID, authorized hosted instance, CSP/DPA acceptance, full E2E or verified revenue import was provided/confirmed. Do not claim recorded visits or deployed variants.

## Configuration for authorized Cloudflare build
Create a separate website in the authorized Umami v3 instance and supply these **public client build values** only after ensuring the privacy/legal review, data residency and allowlisted CSP:
- `VITE_UMAMI_ENABLED=true`
- `VITE_UMAMI_SCRIPT_URL=https://<approved-umami-domain>/script.js` (exact real HTTPS Umami URL; no invented endpoint)
- `VITE_UMAMI_WEBSITE_ID=<actual-UUID-from-this-site>` (one unique website ID for this domain)
- `VITE_OMNI_AB_PILOT_ENABLED=true` after review/QA only.

If missing or invalid, no script is loaded and original creative A is shown. Never expose API keys in VITE_ variables.

## Consent and data minimization
- Umami injected **only after valid opt-in** for analytics (OPTIMATEO has its own Umami checkbox), on named public routes, honoring DNT / GPC.
- `data-auto-pageview=false`; only allowlisted manually normalized static path pageviews; referrers, query strings, fragments, personal user IDs, order IDs and free-text fields never sent by this integration.
- Browser hook `data-before-send` blocks any unexpected payload/event. Only `ui_interest` with static interest/zone/experiment/variant and `experiment_exposure` with experiment/variant allowed.
- The selected arm is A/B/C (uniform random) stored in `sessionStorage` only after consent, never in a cross-site/user identifier. Not a persistent identity or complete multi-visit funnel.
- After withdrawal, drop script and reload to prevent a previously running SDK from continuing. Retest this specifically in browser.
- Site caveat: Žádná data narození, místo narození, atributy vypočtené mapy ani Google login.

## Active creative experiment (feature-flagged, not automatically live)
- **Landing:** https://www.humandesignchart.app/cs (verify canonical host separately).
- **Experiment:** `hd-hero-2026q4`. Three copy variants A (existing/baseline), B (outcome-oriented), C (clarity/benefit-oriented). The same underlying product, href, legal terms and pricing.
- **Leading indicator:** categorized click / exposed variant, with `ui_interest` and `experiment_exposure`.
- **Business goal:** zahájení výpočtu a ověřené nákupy. Only an independently verified server-side lead/payment/affiliate report can establish the business conversion. UI clicks do not count as sales.
- **Safety:** no direct changes to payment/auth routes, checkout, OAuth, tracking IDs, SEO canonical, or partner redirect destinations. Strict no PII in analytics.

## Decision policy
Do not rotate ongoing cohorts every day. Prepare 3 new creative ideas daily into a backlog, but hold existing test allocations; prioritize the first two commercial landing paths. On low-traffic sites, track exposure/click metrics descriptively, report denominators and uncertainty, avoid claims of winners or statistical significance on small samples. When enough sample accumulates, compare consented arm-specific CTR **plus independently verified** leads, paid orders, commission reversals and net profit. Use pre-registered stop/success criteria and guardrails (bounce, performance, accessibility, trust).

## Required gate before merge/release
1. Confirm authorized Umami v3 instance, host/domain policy and unique Website IDs, Czech privacy text and any DPA/data transfer requirements.
2. `pnpm qa:omni-umami`, project TypeScript check, focused test suites, full build, no accidental client env secret inclusion.
3. Cloudflare preview E2E at desktop + mobile with consent rejected/accepted/withdrawn, DNT/GPC, public vs sensitive routes, missing ID, CSP, event payload inspection; zero network requests pre-consent or on private routes.
4. Validate actual Umami event receipts and sample data has no personal/property/birth/order details, and stable A/B/C assignment with correct event variant.
5. Explicit release decision and SHA; postrelease production smoke and rollback. **Never Railway**.

## Financial evidence
**No income claimed** from this implementation; analytical optimization is not the same as verified revenue. Daily A/B ideation is already integrated into the existing morning synthesis automation due to the five-task schedule limit.
