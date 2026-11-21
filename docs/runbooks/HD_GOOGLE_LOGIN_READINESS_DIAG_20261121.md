# P0 — Why Google login is unavailable on humandesignmapa.cz (2026-11-21)

## Confirmed failure stage
Owner captured public `https://humandesignmapa.cz/api/auth/config` with `{"google":false}`. The *actual Cloudflare Pages* login component (`client/src/pages/Login.tsx`) intentionally hides the Google button when this value is false. Therefore this particular failure occurs BEFORE Google's authorization screen; changing Google consent-screen callback URLs alone cannot make `google:true`.

Current main `workers/googleOAuth.ts` requires:
1. Server-side `GOOGLE_CLIENT_ID` (in **Cloudflare Pages project humandesignchart-web / Production**, NOT the Katastr Worker).
2. Server-side `GOOGLE_CLIENT_SECRET` in the *same* Pages project and environment.
3. **Production** D1 binding `HD_ORDERS` (or `DB`) to the **actual** intended D1 database, not merely a similarly named D1 in a different Cloudflare Worker.
4. That exact bound D1 database has `hd_oauth_users` and `hd_oauth_sessions` tables.

The existing OAuth code/PR #94 is merged but production Direct Upload deployment SHA is NOT confirmed. GitHub CI PASS proves the build only; commit does not deploy itself. Google Cloud callbacks have been updated per owner, but live end-to-end auth is still not verified.

## Safe, one-step operator diagnosis after THIS patch is deployed
Visit `https://humandesignmapa.cz/api/auth/config?diagnostic=1` in your browser once. The **public JSON remains only `{"google":false}` or `{"google":true}`**. In Cloudflare → Workers & Pages → `humandesignchart-web` → Observability → Logs, search for `[hd-google-oauth] readiness:`. One code is logged (never values):
- `D1_BINDING_MISSING`: wrong Pages D1 project/production binding; inspect, do not replace customers' DB.
- `GOOGLE_CLIENT_ID_MISSING`: create the production variable in the Pages project, not in Katastr Online.
- `GOOGLE_CLIENT_SECRET_MISSING`: set the matching HDlogin secret as Cloudflare **Secret**, never paste into chat/GitHub.
- `D1_OAUTH_USERS_UNAVAILABLE` / `D1_OAUTH_SESSIONS_UNAVAILABLE`: missing table, inaccessible D1, or bad schema/binding. **Read-only** inspect the bound database, back it up and apply only the additive `migrations/cloudflare/20261029_hd_google_oauth.sql` when necessary.
- No log and `google:false`: likely old production build or request was routed to a different Worker. Confirm actual Pages production deployment ID and source.

The query flag is deliberate; ordinary end users do not cause diagnostic logs. Never add secret values, SQL error contents, personal data, or OAuth codes to logs.

## Final release gate
- Check `https://humandesignmapa.cz/api/auth/config` and `https://humandesignchart.app/api/auth/config` both return `{"google":true}`.
- GET `/api/oauth/login/google` should send HTTP 302 to Google with exact same-host `/api/oauth/callback/google` and PKCE S256.
- A **real** dedicated Google test login must return a valid session that persists after refresh, and logout must revoke the session.
- Confirm ONYX PAY Blueprint gated checkout and paid fulfillment independently, with isolated authorized payment test; keep ads OFF until both sign-in and payment E2E are verified.

**NO claim of production recovery** merely from this diagnostic patch or from screenshot of registered Google callbacks. Direct Cloudflare release remains operator-only with bound D1 backup, exact preview, rollback and read-back.
