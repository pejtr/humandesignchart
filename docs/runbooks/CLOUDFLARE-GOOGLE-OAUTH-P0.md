# P0 Google sign-in restoration — Cloudflare Pages

The legacy Express OAuth API is not deployed. This PR adds native OAuth endpoints
to the existing Pages Worker, with Google OIDC verification (Google JWKS, issuer,
audience, nonce), PKCE S256, 10-minute CSRF state cookie, an HttpOnly Secure
same-site session cookie, a durable D1 account row and working
`/api/trpc/auth.me` / `auth.logout`.

## Release gate — DO NOT enable paid acquisition until complete

1. Run `migrations/2026-10-29-google-oauth-d1.sql` against the **same production
   D1 database** that is exposed to Pages as `HD_ORDERS` or `DB`. Apply in
   preview first. Do not substitute local Wrangler DB for the remote D1 database.
2. Configure Cloudflare **Pages Worker runtime secrets** (not `VITE_*` build
   variables):
   - `GOOGLE_CLIENT_ID`: client ID for a Google OAuth **Web application**.
   - `GOOGLE_CLIENT_SECRET`: corresponding secret.
   - `AUTH_SESSION_SECRET`: independently generated, cryptographically random
     value of at least 32 characters. `JWT_SECRET` is accepted only as a
     temporary compatible fallback if it meets that length.
   - Bind `HD_ORDERS` or `DB` to the D1 database with `hd_auth_users`.
3. In Google Cloud Console > APIs & Services > Credentials > OAuth web client,
   register the *exact* redirect URIs for the domains being served:
   - `https://humandesignchart.app/api/oauth/callback/google`
   - `https://www.humandesignchart.app/api/oauth/callback/google`
   - `https://humandesignmapa.cz/api/oauth/callback/google`
   - `https://www.humandesignmapa.cz/api/oauth/callback/google`
   Configure OAuth app consent/testing or production user access as appropriate.
4. Deploy **preview**, run `pnpm check && pnpm test && pnpm build:cloudflare`;
   verify `GET /api/auth/status` returns `{"google":true}` on the intended
   preview domain ONLY when that domain is in the allowed origin list (preview
   pages.dev intentionally cannot sign in).
5. In production, verify: authorization redirect with PKCE and state; Google
   account selection; callback cookie; `auth.me` returns the user; logout
   clears session; refresh preserves login; spoofed state and expired session
   fail; at least one test user on CZ and EN origins. Verify full
   dashboard/saved-chart APIs separately: this change restores the login/session
   contract, **not** all legacy Express account features.

## Safety

A missing secret, invalid D1 schema, or invalid host leaves Google sign-in off.
Do not enable a merely cosmetic login button. Cookies are host-only (both
domains require separate Google sign-in) and never expose tokens to JavaScript.
Admin role, prior customer entitlements, historical charts and purchases are
**not** inferred from email; no elevation of legacy account privileges.
