#!/usr/bin/env node
/**
 * Read-only production Google OAuth preflight for the existing Cloudflare Pages site.
 * Does not exchange OAuth codes, follow Google redirects, read user data, mutate D1,
 * or print tokens, cookies, OAuth state, client IDs, or provider secrets.
 *
 * node scripts/qa/hd-google-oauth-prod-check.mjs [--json]
 */
import { pathToFileURL } from 'node:url';

export const HOSTS = [
  'https://humandesignmapa.cz',
  'https://www.humandesignmapa.cz',
  'https://humandesignchart.app',
  'https://www.humandesignchart.app',
];

const TIMEOUT_MS = 12_000;
const providerOrigin = 'https://accounts.google.com';

function report(origin, status, detail) { return { origin, status, detail }; }

export function validateGoogleRedirect(location, effectiveOrigin) {
  if (!location) return 'GOOGLE_REDIRECT_MISSING';
  let target;
  try { target = new URL(location); } catch { return 'GOOGLE_REDIRECT_INVALID'; }
  if (target.origin !== providerOrigin || !target.pathname.startsWith('/o/oauth2/'))
    return 'GOOGLE_REDIRECT_NOT_AUTHORIZATION_ENDPOINT';
  const redirectUri = target.searchParams.get('redirect_uri');
  if (redirectUri !== `${effectiveOrigin}/api/oauth/callback/google`)
    return 'GOOGLE_CALLBACK_ORIGIN_MISMATCH';
  for (const [key, value] of [
    ['response_type', 'code'],
    ['code_challenge_method', 'S256'],
  ]) if (target.searchParams.get(key) !== value) return `GOOGLE_OAUTH_PARAMETER_INVALID_${key.toUpperCase()}`;
  for (const key of ['client_id', 'state', 'nonce', 'code_challenge'])
    if (!target.searchParams.get(key)) return `GOOGLE_OAUTH_PARAMETER_MISSING_${key.toUpperCase()}`;
  return null;
}

export async function inspectOrigin(origin, fetcher = fetch) {
  let config;
  try {
    const response = await fetcher(`${origin}/api/auth/config`, {
      redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return report(origin, 'BLOCKED', `CONFIG_HTTP_${response.status}`);
    if (!response.headers.get('content-type')?.includes('application/json'))
      return report(origin, 'BLOCKED', 'CONFIG_NOT_JSON');
    config = await response.json();
    if (config?.google !== true)
      return report(origin, 'BLOCKED', 'GOOGLE_UNAVAILABLE_CHECK_CLOUDFLARE_SECRETS_D1_MIGRATION');
  } catch (error) {
    return report(origin, 'BLOCKED', `CONFIG_REQUEST_FAILED_${error instanceof Error ? error.name : 'UNKNOWN'}`);
  }

  let current = `${origin}/api/oauth/login/google`;
  for (let hop = 0; hop < 3; hop++) {
    let response;
    try {
      response = await fetcher(current, {
        redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: 'application/json' },
      });
    } catch (error) {
      return report(origin, 'BLOCKED', `AUTH_START_REQUEST_FAILED_${error instanceof Error ? error.name : 'UNKNOWN'}`);
    }
    if (![301, 302, 303, 307, 308].includes(response.status))
      return report(origin, 'BLOCKED', `AUTH_START_HTTP_${response.status}`);
    const location = response.headers.get('location');
    if (!location) return report(origin, 'BLOCKED', 'AUTH_START_MISSING_LOCATION');
    let next;
    try { next = new URL(location, current); }
    catch { return report(origin, 'BLOCKED', 'AUTH_START_INVALID_LOCATION'); }
    if (next.origin === providerOrigin) {
      const issue = validateGoogleRedirect(next.href, new URL(current).origin);
      return issue ? report(origin, 'BLOCKED', issue) : report(origin, 'READY_FOR_BROWSER_E2E', 'GOOGLE_START_PKCE_AND_CALLBACK_MATCH');
    }
    if (!HOSTS.some(allowed => next.origin === allowed) || next.pathname !== '/api/oauth/login/google')
      return report(origin, 'BLOCKED', 'UNEXPECTED_LOCAL_AUTH_REDIRECT');
    current = next.href;
  }
  return report(origin, 'BLOCKED', 'AUTH_REDIRECT_LOOP');
}

export async function main(fetcher = fetch, json = false) {
  const results = await Promise.all(HOSTS.map(origin => inspectOrigin(origin, fetcher)));
  if (json) console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  else for (const item of results) console.log(`[${item.status}] ${item.origin} — ${item.detail}`);
  return results.every(item => item.status === 'READY_FOR_BROWSER_E2E') ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(fetch, process.argv.includes('--json')).then(code => { process.exitCode = code; });
}
