# PR #86 — Calculator ambient: guarded Cloudflare preview release

Only the **calculator visual background** is changed. No auth, payments, customer data or chart computation edits.

The pasted fallback script from another agent is incorrect for this repository: it uses npm ci, dist instead of dist/public, wrong Cloudflare project, wrong /preview route, wrong mobile position assertion and non-production domain examples. Do not use it.

**Actual project:** pejtr/humandesignchart
**Pages project:** humandesignchart-web
**Preview branch:** hd-calculator-preview
**Routes:** /en/calculate and /cs/calculate
**Production domains:** humandesignchart.app and humandesignmapa.cz

Use a separate clean checkout of branch design/calculator-ambient-background-20261112; do not stash or reset the original Antigravity worktree.

Verify only:

    pwsh -File .\scripts\qa\deploy-calculator-preview.ps1

After the read-only preflight confirms that preview bindings do not share customer storage or live payment/email settings:

    pwsh -File .\scripts\qa\deploy-calculator-preview.ps1 -Deploy

Both local CLOUDFLARE_ACCOUNT_ID and a scoped CLOUDFLARE_API_TOKEN are needed for independent preview-vs-production Cloudflare configuration inspection. Successful Wrangler OAuth login alone is not enough for this script. Never send secrets in chat.

The script prints a **real** Wrangler deployment URL and checks HTTP 200 on both locale paths. To collect real visual proof, install Playwright Chromium in the isolated QA checkout and run:

    $env:HD_CALCULATOR_PREVIEW_URL = "https://<actual-wrangler-host>.humandesignchart-web.pages.dev/"
    node .\scripts\qa\capture-calculator-preview.mjs

The QA script checks 390/1440/3840px, CZ/EN, light/dark, responsive overflow and reduced-motion, saving 12 screenshots and evidence.json. It deliberately does not test form submission, Google OAuth, real checkout or PDF fulfillment; those are independent release gates that must be verified using authorized staging/test conditions.

**Release remains NO-GO for production until actual preview browser E2E and rollback status are documented.** No GitHub Actions deploy required.
