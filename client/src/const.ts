export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Sign-in is handled server-side: /api/oauth/login builds the Google consent
// URL (with CSRF state) and redirects there. Returning a same-origin path keeps
// the redirect URI tied to the current host automatically.
export const getLoginUrl = () => "/api/oauth/login";
