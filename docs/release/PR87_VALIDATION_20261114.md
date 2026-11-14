# PR #87 repair validation — 14 November 2026

**Decision: DRAFT / NO-GO. No merge or production deployment performed.**

## Implemented

- Reproduced the obsolete sticky-header test failure on `6f34d0665b56ab1ff4b953a2c155d27e3e382587` and repaired the contract to require existing stable markers and a closed header before the hero.
- Added a preview-only Node preflight/deployment runner. Production/release flags are refused, the legacy PowerShell `-Release` path is disabled, and there are no merge/production operations in the replacement runner.
- Added seven behavioral Node subtests for preview origins, backend/secret isolation, PNG contracts, release-flag refusal and both localized crawler probes. The subtests are invoked by the Vitest suite.
- Extended capture to request EN/CZ HTML and PNGs with Meta/WhatsApp UAs, require preview-origin social URLs/noindex and record image digests. Prepared keyboard/open-menu/CTA and actual-scroll checks for all five widths. Execution is not implied by prepared code.

## Observed local results

| Check | Result |
|---|---|
| TypeScript application and test configs | PASS, both `tsc` commands exit 0 |
| Full Vitest suite | 59 files PASS; 454 tests PASS, 1 skipped |
| Cloudflare build | PASS in the initial validation run; creates Pages Worker and both PNGs |
| EN PNG | 1200×630, 220,792 bytes; visually inspected |
| CZ PNG | 1200×630, 227,063 bytes; visually inspected |
| Built Worker in-process probe | Four locale/UA combinations PASS with real built Worker and filesystem assets; no network deployment was involved |
| Browser screenshots | NOT VERIFIED; local Chromium could not start (`socket() failed: Operation not permitted`) |
| Local Wrangler emulator | BLOCKED by `uv_interface_addresses` runtime error |
| Remote Cloudflare preview | NOT DEPLOYED; scoped credentials absent, dashboard shows sign-in |
| Real WhatsApp rendering | NOT VERIFIED |
| Production / attribution / checkout E2E | NOT RUN |

These checks validate the repair commit containing this report, against the historical PR application source. They do not validate current-main integration. No application UI, OAuth, checkout, payment or database runtime code was changed by this repair.

Image SHA-256:

- EN: `fac225c4b6469b9b202a8e1a9bb54030356508211b9f5aacde4d836c502ce755`
- CZ: `e765a3ade31ed8c5ab0439dbb50347a3578fc1d2dbd6729036fa324d2c5bd587`

## Integration blocker

Current-main snapshot: `47e271b240f9e66c2d30af7f61692ed73c13fc24`. It already contains #88 and #85, including a different implementation of the same header/cards. A non-mutating merge-tree analysis reports seven conflicting paths:

- `client/src/pages/PremiumUSHome.tsx`
- `package.json`
- `scripts/generate-social-cards.mjs`
- `scripts/qa/capture-en-share-preview.mjs`
- `server/_core/seoMeta.ts`
- `server/cloudflare.social-meta.test.ts`
- `workers/social-meta.ts`

Do not merge this historical branch blindly or replace current-main auth/checkout protections. Integration must preserve the current-main implementation and adapt the missing validation/preview-isolation changes, with checks repeated on that exact candidate SHA. No branch history rewrite or integration merge was performed here.

## Remaining acceptance gates

1. Prepare and validate the current-main integration candidate without merging PR #87.
2. Provide an authorized Cloudflare preview execution context and verify project isolation before upload.
3. Bind deployment ID and immutable preview URL to the tested source SHA.
4. Obtain and visually inspect the five-width screenshots and crawler HTTP evidence from that remote preview.
5. Obtain actual WhatsApp composer evidence. Do not send a message as part of this check.

The public production-domain cache/WhatsApp check and exact rollback deployment ID remain requirements for a separate future release, not reasons to deploy production during preview validation.
