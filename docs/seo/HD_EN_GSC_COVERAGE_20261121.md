# HumanDesignChart.app — Google Search Console Page Indexing (export 2026-11-21)

## Source and confirmed figures
Source: owner-uploaded GSC Page Indexing export `humandesignchart.app-Coverage-2026-11-21.zip`: `Graf.csv`, `Kritické problémy.csv`, `Nekritické problémy.csv`, `Metadata.csv`. Most recent **data row is 2026-11-16**, NOT Nov 21.

- 2026-10-16: 20 excluded, 0 indexed.
- 2026-10-24: 27 excluded, 1 indexed.
- 2026-11-10: 29 excluded, 1 indexed.
- 2026-11-14 through 2026-11-16: **31 excluded / 1 indexed** (32 discovered in this report).
- Excluded reasons on export: **9 soft 404**; **21 crawled — currently not indexed**; **1 duplicate, Google chose different canonical**.
- The three exclusion categories add to 31. They are **not** automatically 31 distinct defective public pages; many may be historical aliases/private URL patterns.
- No affected URLs, Google-selected canonical, or per-page crawl/render snapshots are included in this ZIP. Root cause for the specific 9 and 21 cannot be established from aggregate counts alone. Do NOT claim all 9 are resolved by the code patch.

## Verified code findings and this focused fix
1. Cloudflare Pages returns an HTML/React shell for unknown frontend routes. For **nonexistent editorial slugs** (known `/cs|en/blog/:slug`, `/cs|en/types/:slug`, `/cs|en/andelska-cisla/:slug`) returning 200 would be a bona fide soft-404 anti-pattern. New, tightly scoped route check preserves all *actual* static articles and types, and returns HTTP **404 with X-Robots-Tag: noindex** for missing editorial slugs.
2. Public HTML also loaded the legacy `JsonLdHead` with default `Avanito Human Design` name and `humandesign.cz` URL, which conflicted with the domain's current entity identity. Removed that extra mount; existing `index.html` Organization/WebSite/WebApplication and route-specific SEO markup remain.
3. Previous SEO/GEO PR #96 (merged 2026-11-20) supplied bilingual sitemap alternates, branded-host resolution, and public `llms.txt` and OpenAPI. A code merge alone is not evidence the production Cloudflare deploy contains it.

## Required production investigation (no change until verified)
1. GSC > Page indexing > **Soft 404** > export **Examples** of affected URLs and **Crawled — currently not indexed**. Select representative URLs. For each check URL Inspection: canonical specified vs Google-selected, last crawled, indexing allowed, fetched HTTP, screenshot and rendered HTML.
2. Check actual Cloudflare Worker build SHA/preview URL and deployed binding. Query public `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/openapi.json`, EN homepage, one valid and one invalid article with a Googlebot mobile simulation.
3. For valid editorial pages marked soft 404 or crawled-not-indexed, inspect browser bundle/network errors, page textual substance, real H1 and internal crawlable anchors. Do not reclassify a real article as 404.
4. Investigate duplicate canonical only after seeing the exact example URL and Google-selected canonical. Avoid blanket domain redirects or automatic removal of `www` until Google OAuth callback and customer sessions have passed production E2E.
5. Check migration/secret health separately; avoid changing OAuth/payment code and keep paid ads paused while `/api/auth/config` shows `{"google":false}`.

## Release gate
`pnpm check`, full Vitest, `pnpm build:cloudflare`, Cloudflare preview HTTP probes and exact SHA with rollback evidence. Never assume Github merge causes Direct Upload deployment.
After actual production verification, request GSC **Validate Fix** only for a genuinely corrected issue and use URL Inspection's Request Indexing sparingly. Indexing cannot be guaranteed.

## Income priority
**P0** Google login + paid Blueprint E2E; **P1** user-visible valid content and crawlability; **P2** agent discovery. No claimed extra organic impressions, clicks, leads or revenue until GSC and checkout telemetry prove them.
