# PR #88 — Cloudflare-only release gates

## Scope
Sticky English homepage navigation, mobile menu, premium hero, dedicated CZ/EN Open Graph PNGs. No OAuth, checkout, D1, migrations, payment callbacks, credit grants or customer data changes.

## Operator execution (Windows / Antigravity)

Use a **separate clean checkout** of `fix/en-sticky-hero-share-p0-20261112`. Do not stash/delete the user's main working tree. You already have `wrangler login` but this release gate also needs a **scoped Cloudflare Pages API token and account ID in environment** to read project configuration before uploading; never paste or commit the values. Retain the existing `VITE_OPENAI_ADS_PIXEL_ID` build setting; the pipeline must not ship a different measurement configuration.

```powershell
pwsh -File scripts/qa/deploy-en-share-preview.ps1
pwsh -File scripts/qa/deploy-en-share-preview.ps1 -Deploy -Capture
```

First command validates exact branch/SHA, clean tree, frozen install, typecheck, full Vitest, Cloudflare build, PNG dimensions/bytes and read-only Cloudflare preview bindings. Second uploads **only** `hd-en-share-preview` and runs actual browser test, screenshots, SSR OG verification and preview image fetches.

### GO / NO-GO
- Cloudflare preview must be isolated from production data and revenue credentials. Presence of shared IDs or unsafe secret names is NO-GO.
- Browser QA `360 / 390 / 768 / 1440 / 3840` px: header stays at viewport top beyond hero, no horizontal overflow, mobile navigation and calculator CTA work, reduced-motion stops decorative animation, no browser page error.
- WhatsApp-like crawler must receive SSR title + OG image metadata for **both** CZ/EN routes. Both preview PNG assets must be HTTP 200, `image/png`, 1200×630, <=300 KB (our conservative budget, **not** a documented platform limit).
- Record actual Cloudflare preview deployment ID and screenshots; record existing production deployment ID + rollback method before approving any merge. GitHub CI PASS alone is not sufficient.
- Do **not** merge PR #84, #85 or #86 as part of this P0 frontend/OG repair. PR #85 edits the build command and SEO metadata too; resolve intentionally when integrating it separately, avoiding lost OG generation.
- After production rollout, run `node scripts/qa/check-share-preview.mjs` to test all five public domain URLs including www and an actual WhatsApp share with an unused link. Social caches may continue showing old cards; no false PASS claim.
- Production and test-mode payment E2E must remain separate. No live checkout charges for design/OG QA.

**Current status:** preview and production unverified until real Cloudflare IDs/browser evidence exist. 

## Evidence readback

The release script fetches the **real latest successful Cloudflare production deployment ID** before any write, then verifies an actual successful preview deployment whose branch and commit hash match PR #88. It writes `qa-artifacts/en-sticky-social/release-ids.json` with the previous-production rollback point and new preview ID. `evidence.json` records the preview source SHA, five viewport checks, actual crawler metadata and image responses. Both files are deliberately gitignored and must be reviewed before any production merge. **Missing IDs, a failed preview binding check or an E2E failure means NO-GO.**
