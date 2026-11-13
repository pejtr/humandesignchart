# P0 English sticky navigation + WhatsApp sharing — release evidence

**Scope:** `PremiumUSHome.tsx` header structure and EN/CZ homepage social image only. No motion PR merge, OAuth, D1, Stripe, checkout, customer data or production changes.

## Why
The premium EN header was inside an `overflow-hidden` hero section, so sticky could not persist while scrolling the whole page. Moved the header above the hero, retained all primary links and provided a keyboard-accessible mobile dropdown. SEO markup was already present in server-rendered HTML source, but the original `og-homepage.png` file is ~922,692 bytes in Git; its WhatsApp compatibility was not verified. This patch generates compact versioned 1200x630 PNG files into `dist/public/images/` and changes **only home** og:image to those URLs.

## Release safety gates
1. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test` and `pnpm build:cloudflare`; verify generated PNG files exist and are 1200x630 <600 KB. Do not change OAuth/payments/D1.
2. Preview branch deploy to existing `humandesignchart-web` with safe isolated bindings. **Do not use `--branch main` until actual preview QA and an approved production release.**
3. Playwright on preview at 390, 768, 1440, 3840: verify EN navbar remains at viewport top after scrolling past hero, logo + nav + free chart CTA work, mobile dropdown is focusable, no overflow, no console errors.
4. Confirm HTML contains og:title/description/url/image tags without JS; retrieve PNG from public HTTPS (HTTP 200, content-type image/png, valid image). Example read-only command: `node scripts/qa/probe-whatsapp-share.mjs https://humandesignchart.app/en` **after production release**. For preview, use an independent script with the exact trusted preview hostname after binding safety checks.
5. In WhatsApp, paste the exact production link into a new message to yourself, verify image/title/description appear. Caching and app settings may affect rendering even when Open Graph HTML is valid.
6. Known rollback Cloudflare production deployment ID, exact tested SHA, rollback plan; only then merge and production release.

**Status until deployment and browser screenshots: CODE-ONLY / NOT PRODUCTION VERIFIED.**

## Reproducible browser QA with evidence files
With isolated preview deployed and Playwright installed in operator's QA runtime:

```powershell
$env:HD_EN_PREVIEW_URL = "https://<isolated>.humandesignchart-web.pages.dev/"
node scripts/qa/capture-en-share-preview.mjs
```

The script refuses non-Cloudflare project hosts and produces **10 real screenshots** (top/scrolled × 360/390/768/1440/3840) and `qa-artifacts/p0-en-sticky-whatsapp/evidence.json`. It asserts viewport overflow, sticky position after scrolling, desktop/menu/CTA navigation, EN raw SSR og:image, preview noindex and a real **200 OK / image/png / <600 KB / 1200×630** preview card. It only reads preview and does not trigger checkout. A green code CI is not a substitute for this evidence.

## 12 Nov audit reconciliation: PR #87 versus duplicate PR #88

An independently prepared PR #88 covered the same EN sticky/WhatsApp defect but with different OG file names and without PR #87's mobile menu and isolated preview metadata. **Do not blindly merge both.** PR #87 now incorporates PR #88's scoped CSS-only nebula/starfield/halo and more accurate, conversion-focused EN hero copy, along with its richer bilingual 1200×630 image artwork **adapted to PR #87's versioned `og-home-*-share-v2.png` names**.

Additional revenue/safety audit fixes in PR #87:
- The lighter, localized social-card image is now the **fallback for other routes**, not just `/en` and `/cs`.
- Isolated Pages preview OG URLs and preview-only `noindex` metadata are verified separately from production.
- Direct release script reads rollback deployment IDs from the documented Cloudflare API `GET /pages/projects/{name}/deployments?env=production` rather than relying on differently-cased Wrangler CLI JSON fields.
- The release script refuses to upload any build missing `VITE_OPENAI_ADS_PIXEL_ID` **or** the exact embedded identifier in the generated browser JS.
- Script fails closed if current `main`, PR head, Cloudflare project/bindings, Playwright evidence, or rollback identity differ from verified values.
- Use `scripts/qa/release-p0-en-share.ps1` from a clean isolated PR #87 branch. Default is verify-only; `-Release` is gated and performs direct Pages preview/browser QA and then production only after all gates.

This document is implementation evidence, **not** evidence of live Cloudflare deployment. Until real preview/browser checks exist, keep PR #87 **DRAFT / NO-GO**. PR #88 is a duplicate source of inspiration, not a second release target.

