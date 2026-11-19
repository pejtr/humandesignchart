# P0 Human Design Google sign-in recovery — 2026-11-19

**Incident:** Buyer sign-in reported broken on HumanDesignMapa.cz / HumanDesignChart.app.
**Ad safety:** Keep both GPT Ads campaigns and all associated ads/ad groups PAUSED. Do not spend on an unverified checkout/login funnel.
**Scope:** existing Cloudflare Pages Direct Upload project `humandesignchart-web`, using existing production D1. No Vercel or GitHub Actions.

## Evidence and limitations
- Repository code has Cloudflare-native `workers/googleOAuth.ts` with authorization code + PKCE, nonce/state, verified Google ID token, D1 session persistence, and `/api/auth/config` readiness.
- `googleAvailable()` returns `google:false` when *any* of these is missing: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, valid `HD_ORDERS` / `DB` binding with the `hd_oauth_users` and `hd_oauth_sessions` tables.
- A successful local build, a merged PR, or a payment test does **not** demonstrate working production Google sign-in.
- We do not have an authenticated Cloudflare deployment/browser session in this review; exact production fault remains UNKNOWN until a connected operator runs the checks below. Never claim a runtime repair from this documentation alone.

## Fast, public, read-only diagnosis
On a developer machine with internet access, from a clean checkout:

```bash
node --check scripts/qa/hd-google-oauth-prod-check.mjs
node --test scripts/qa/hd-google-oauth-prod-check.node-test.mjs
node scripts/qa/hd-google-oauth-prod-check.mjs --json
```

The probe checks the public `/api/auth/config` and the **start-only** Google login redirect on apex + www, CZ + EN. It never visits Google consent, completes a callback, collects cookies, reads customers, modifies Cloudflare, or prints OAuth credentials.

Interpret results:

| Result | Next action |
| --- | --- |
| `CONFIG_HTTP_404` / `CONFIG_NOT_JSON` | Incorrect/missing Cloudflare Pages `_worker.js` deployment or route handling; verify exact production deployment SHA and correct Pages project first. |
| `GOOGLE_UNAVAILABLE_CHECK_CLOUDFLARE_SECRETS_D1_MIGRATION` | Check production secret **names** + D1 binding + additive schema; do not guess which prerequisite is absent. |
| `GOOGLE_CALLBACK_ORIGIN_MISMATCH` | Inspect canonical hostname redirects and register the exact same-host callback URL in Google Cloud. |
| `AUTH_START_HTTP_503` | Google readiness differs from initiation; examine Cloudflare Worker logs. |
| `READY_FOR_BROWSER_E2E` | Start URL looks correct, **but** consent/callback/session and checkout still require real browser E2E. |

## Cloudflare / Google operator recovery (authorized owner only)

1. Inspect the existing `humandesignchart-web` **production** project, current deployment SHA, previous known-good deployment, and the D1 database bound as `HD_ORDERS` (fallback `DB`). Do not provision an unrelated database or overwrite payment records.
2. Confirm the production environment has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set as Cloudflare secrets. Check presence only; **never** print/copy values, send secrets to chat, add `VITE_` public values, or put secrets in GitHub.
3. On the existing D1, checkpoint/backup first and read-only check that both `hd_oauth_users` and `hd_oauth_sessions` exist. If absent, **only after approved backup** apply `migrations/cloudflare/20261029_hd_google_oauth.sql` (additive `CREATE TABLE IF NOT EXISTS`). No customer/payment table changes.
4. In the Google Cloud OAuth Web client register the **exact** authorized redirect URIs of every live host:
   - `https://humandesignmapa.cz/api/oauth/callback/google`
   - `https://www.humandesignmapa.cz/api/oauth/callback/google`
   - `https://humandesignchart.app/api/oauth/callback/google`
   - `https://www.humandesignchart.app/api/oauth/callback/google`
   Verify consent screen publication/test-user access and required authorized domains. Google's `redirect_uri_mismatch` needs Google client configuration, **not** a bypass in application code.
5. Run `bash scripts/release-hd-google-oauth.sh verify` on an isolated clean source checkout. If a production deployment is required, obey existing preview, approval and rollback gates; don't silently deploy or overwrite live secrets.
6. Browser test **each storefront** with a dedicated non-privileged Google test user: `/cs/login` / `/en/login` → Google → matching callback → `/cs/account` / `/en/account` → session remains after refresh → `/api/trpc/auth.me` returns user → logout revokes cookie → anonymous `auth.me` returns null. Verify both www + apex redirects and no cross-domain cookie assumption.
7. Regression: free chart, login-gated Blueprint checkout, authorized test payment, durable PAID order, fulfilled Blueprint, email, and purchase tracking. Keep ads OFF until all are evidenced.

## STOP / rollback
No automatic enabling of advertising, silent credit grants, OAuth bypass, account migration by email, Google secret rotation, or destructive D1 changes. If production fails following any change, restore the confirmed previous-good Cloudflare Pages deployment, leave additive D1 tables intact, and investigate with sanitized logs. Avoid printing OAuth `state`, `code`, cookies, private user data or token responses.

**Definition of fixed:** publicly observable `google:true` and correct Google authorization redirect on every live host **plus authenticated browser E2E, session persistence/logout, and successful buy/fulfill test on production**. Anything less is a diagnosis, not an incident resolution.
