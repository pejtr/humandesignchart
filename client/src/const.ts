export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sanitizeReturnPath } from "@shared/returnPath";

// Sign-in is handled server-side: /api/oauth/login builds the Google consent
// URL (with CSRF state) and redirects there. Returning a same-origin path keeps
// the redirect URI tied to the current host automatically.
//
// `returnTo` (default: the current page) is carried through the signed OAuth
// state so the visitor lands back where they started instead of on "/".
export const getLoginUrl = (returnTo?: string) => {
  const current = typeof window === "undefined" ? undefined : `${window.location.pathname}${window.location.search}`;
  const safeReturnTo = sanitizeReturnPath(returnTo ?? current);
  return safeReturnTo ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}` : "/login";
};
