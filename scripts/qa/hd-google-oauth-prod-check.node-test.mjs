import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectOrigin, validateGoogleRedirect } from './hd-google-oauth-prod-check.mjs';

const site = 'https://humandesignmapa.cz';
function config(google) { return new Response(JSON.stringify({ google }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function providerRedirect(origin = site) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  for (const [key, value] of Object.entries({
    redirect_uri: `${origin}/api/oauth/callback/google`, response_type: 'code', code_challenge_method: 'S256',
    client_id: 'dummy', state: 'dummy', nonce: 'dummy', code_challenge: 'dummy',
  })) url.searchParams.set(key, value);
  return url.toString();
}

test('blocks fail-closed provider configuration before Google is contacted', async () => {
  let calls = 0;
  const result = await inspectOrigin(site, async () => { calls++; return config(false); });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(calls, 1);
  assert.match(result.detail, /GOOGLE_UNAVAILABLE/);
});

test('accepts only matching OAuth callback, state, nonce and PKCE', () => {
  assert.equal(validateGoogleRedirect(providerRedirect(), site), null);
  assert.equal(validateGoogleRedirect(providerRedirect('https://www.humandesignmapa.cz'), site), 'GOOGLE_CALLBACK_ORIGIN_MISMATCH');
  assert.equal(validateGoogleRedirect('https://evil.invalid/', site), 'GOOGLE_REDIRECT_NOT_AUTHORIZATION_ENDPOINT');
});

test('checks OAuth start redirect without following Google login or exchanging user data', async () => {
  let calls = 0;
  const result = await inspectOrigin(site, async (url, options) => {
    calls++;
    if (url.endsWith('/api/auth/config')) return config(true);
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { location: providerRedirect() } });
  });
  assert.equal(result.status, 'READY_FOR_BROWSER_E2E');
  assert.equal(calls, 2);
});

test('rejects a worker that serves HTML shell instead of a JSON API', async () => {
  const result = await inspectOrigin(site, async () => new Response('<html>wrong</html>', { status: 200, headers: { 'content-type': 'text/html' } }));
  assert.equal(result.detail, 'CONFIG_NOT_JSON');
});
