# PR #87 — sticky EN navigation and WhatsApp share validation

**Status: DRAFT / NO-GO.** Code checks, local browser QA, Cloudflare preview and actual WhatsApp rendering are separate evidence gates. A prepared script is not a completed deployment.

## Scope

PR #87 moves the EN sticky header outside the clipped hero, adds mobile navigation, consolidates the CSS cosmic hero/copy from duplicate #88, generates localized compact PNG cards, and rewrites direct Pages preview social URLs/noindex. Compact cards are also the fallback for routes without a custom card. OAuth, checkout, payments, D1 and customer records are outside this work.

## Preview-only entry points

Use the project package manager **pnpm 10.18.0**. Install frozen dependencies first. Run from a clean checkout of `fix/p0-en-sticky-whatsapp-og-20261112` whose HEAD matches the remote branch.

```sh
node scripts/qa/preview-en-share.mjs
```

The default runs TypeScript, the full Vitest suite and the Cloudflare build, checks both generated PNGs and writes `qa-artifacts/p0-en-sticky-whatsapp/preflight.json`. It does not deploy. Local build success without the configured public Ads Pixel ID does not satisfy a release attribution gate.

```sh
node scripts/qa/preview-en-share.mjs --deploy-preview
```

This additionally requires existing `CLOUDFLARE_ACCOUNT_ID`, scoped `CLOUDFLARE_API_TOKEN` and `VITE_OPENAI_ADS_PIXEL_ID` environment values. Never paste secrets into chat or commit them. Before uploading, it reads the project configuration and fails closed unless preview has no backend resource bindings or secrets. Only the reviewed plain-text `NODE_ENV` and public Pixel ID keys are allowed. It uploads to `hd-p0-en-share-preview`, verifies successful **preview** deployment metadata for the exact source SHA, captures its deployment ID and immutable URL, then runs browser/OG QA. It stops there.

`scripts/qa/release-p0-en-share.ps1` is now a compatibility wrapper: default is local preflight, `-PreviewOnly` requests the isolated preview, and legacy `-Release` is rejected. Neither entry point can mark a PR ready, merge or deploy production. No GitHub Actions deployment is required.

## Required evidence

1. Exact source SHA, clean tree, successful TypeScript/full-suite/build logs; both versioned PNGs exist, have a valid signature, are **1200×630**, and are **10,000–599,999 bytes**. Visually inspect both cards. The generator uses a stricter 300,000-byte budget.
2. Verified Cloudflare preview configuration, successful deployment ID, immutable URL and commit association. A branch alias or a manually supplied `GIT_SHA` alone does not prove what was deployed. The root Pages hostname and known production aliases are refused by QA.
3. Browser QA at **360/390/768/1440/3840**: sticky remains at the viewport top after actually scrolling past the hero; no horizontal overflow; mobile menu opens/closes with Enter and links receive keyboard focus; visible free-chart CTA reaches the localized calculator without submitting birth data. Capture **10 top/scrolled screenshots plus 3 open-menu screenshots**. Record console/request failures and any blocked non-read-only requests. Review screenshot files manually.
4. For **EN and CZ**, fetch raw HTML and its localized PNG with **Meta and WhatsApp user agents**. Require 200, HTML/PNG MIME, title/description/url/image/secure_url/Twitter image, preview-origin URLs, noindex and valid PNG signature/dimensions/size. Save response details and SHA-256 digests. Redirects are refused rather than silently testing another host.
5. In the real WhatsApp app, paste the **exact tested preview URL** into a private composer and inspect image, title and description. Capture the URL, timestamp, app/platform and visual result. Sending is not required or authorized by this validation. HTTP probes do not establish WhatsApp rendering.

Standalone capture, after deployment identity has been independently confirmed and Playwright/Chromium are installed in the operator QA runtime:

```sh
GIT_SHA=<40-character-tested-sha> HD_EN_PREVIEW_URL=https://<deployment>.humandesignchart-web.pages.dev/ node scripts/qa/capture-en-share-preview.mjs
```

Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` selects an installed local Chromium. QA writes `evidence.json` even on browser/HTTP failure. `whatsapp` remains `NOT_VERIFIED`; there is no automatic signoff.

## Production remains a separate decision

Preview success cannot prove production-domain routing, caches or WhatsApp rendering. A later release needs resolved integration with current `main`, checks repeated on the integrated SHA, reviewed evidence, an exact known-good production rollback deployment ID and a separately authorized rollout. This preview procedure performs none of those production actions.

## Audit correction — 14 November 2026

The previous HEAD `6f34d0665b56ab1ff4b953a2c155d27e3e382587` failed CI: a static test searched for an obsolete exact opening section tag after `data-testid` was added. Its build/deploy steps were skipped. Earlier green CI and reported PNG byte counts belonged to older commits/artwork. The repair checks marker existence and header closure before the hero; runtime sticky behavior still needs browser evidence.

Current `main` has advanced beyond the old hard-coded base. Historical branch QA is not integration evidence. Keep #87 Draft and record remaining conflicts; do not merge unrelated PRs to bypass this gate.
