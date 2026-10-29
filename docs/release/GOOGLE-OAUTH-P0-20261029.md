# Human Design Google login — P0 release gate (Cloudflare Pages)

Applies to humandesignchart.app (EN) and humandesignmapa.cz (CS) on
the existing Direct Upload project. PR #77 was only a fail-closed UX mitigation.

## Implemented on the feature branch

- Cloudflare Pages Google authorization-code flow: PKCE S256, browser-bound
  state, OIDC nonce, Google JWKS signature verification, audience/issuer,
  token age and verified email.
- Users keyed by Google's immutable subject, not mutable email. Cryptographically
  random session cookies are Secure + HttpOnly + SameSite=Lax + host-only, with
  only a SHA-256 hash persisted in D1 and 30-day fixed expiry.
- Additive D1 users and sessions migration. Session-aware auth.me, real logout (session revoked and host-only cookie cleared).
- CZ and EN login buttons appear only if the Cloudflare production Worker
  confirms both Google configuration AND migrated D1 tables.
- A new /cs/account and /en/account landing shows verified signed-in identity and real logout. Old /dashboard depends on legacy APIs not yet implemented in Pages and is NOT the OAuth default.
- Existing payment gates, free calculator, legacy customer records and
  premium credits are left unchanged.

## Required HUMAN GATES before merge / deployment

1. Identify existing Cloudflare Pages project, production deployment SHA and
   bound D1 database: HD_ORDERS or fallback DB. Back it up/checkpoint.
   Never replace the binding or create a new production Pages project.
2. Apply migrations/cloudflare/20261029_hd_google_oauth.sql to the existing
   D1 through an approved migration process. It only creates users, sessions,
   and indexes. Do not destroy or rewrite legacy users or payment records.
3. Configure a Google Cloud OAuth consent screen and Web application with
   the exact authorized redirect URIs that serve live requests:
   - https://humandesignchart.app/api/oauth/callback/google
   - https://www.humandesignchart.app/api/oauth/callback/google
   - https://humandesignmapa.cz/api/oauth/callback/google
   - https://www.humandesignmapa.cz/api/oauth/callback/google
   Google redirect_uri MUST match exact host and path. Configure verified
   domains. Never publish the client secret.
4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET ONLY in Cloudflare Pages
   production secrets on the existing project, not in source, GitHub Actions,
   browser VITE_ variables, pull request, chat, or logs.
5. GitHub Actions is NOT required. From a clean isolated checkout execute
   bash scripts/release-hd-google-oauth.sh verify for frozen install,
   pnpm check, Vitest and the Pages build; then run the script with preview to
   direct-upload via Wrangler. This release path still requires a validated
   Cloudflare authorization and all payment/security regression gates. A
   preview pages.dev hostname cannot perform live Google OAuth until a separate
   isolated preview OAuth client and allowed callback host have been configured.
   The production mode is guarded by mandatory explicit environment approvals.
6. Test with a dedicated Google test account on BOTH domains:
   - GET /api/auth/config says google:true only with Google secrets + D1 tables.
   - GET /api/oauth/login/google yields Google 302 with PKCE, nonce, state.
   - Real Google consent redirects to the exact matching host callback.
   - Callback persists new D1 user + hashed session; auth.me returns user
     after refresh/new tab. No admin/paid credits granted automatically.
   - Google callback reaches /cs/account or /en/account, with authenticated identity shown. Logout revokes the D1 session, clears the HttpOnly cookie and auth.me becomes null.
   - Invalid state, replay, expired/foreign-host cookie, missing keys fail closed.
   - Anonymous free chart generation and checkout fail-closed behavior unchanged.
   - Check existing customer portal and entitlement endpoints independently.
7. Confirm actual Cloudflare production SHA and rollback deployment BEFORE
   production changes. No payment route, PAYGATE_LIVE_GATE, Stripe, Comgate or
   ONYX PAY modifications are part of this branch.

## Existing legacy account limitation

This creates new Google identities keyed by provider subject. Matching a
previous Express/MySQL user's email is NOT a safe entitlement migration.
Existing charts, purchases, subscriptions and paid credits are not linked
by this patch. Requires a separate reviewed account-linking migration
with verified ownership proof. Do not report customer portal complete yet.

## Safety & rollback

- Unconfigured GET /api/oauth/login/google returns HTTP 503, not fake login.
- Forged callback without same-host state cookie returns a safe login failure.
- Roll back via previous good Cloudflare Pages deployment. Leave additive D1
  tables in place until separate reviewed cleanup; do not drop customer data.

## CI-free commands (run only on the connected trusted developer machine)

- Verify only: bash scripts/release-hd-google-oauth.sh verify
- Deploy preview: bash scripts/release-hd-google-oauth.sh preview
- Production: bash scripts/release-hd-google-oauth.sh production, **only** after
  all six flags defined in the script have been independently confirmed, with
  real auth E2E and rollback plan. Those flags are a checklist, not proofs.
- Never paste Cloudflare/Google credentials into issue comments, this file,
  GitHub Actions logs, a shell transcript shared publicly or ChatGPT.
