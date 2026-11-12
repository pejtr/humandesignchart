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
