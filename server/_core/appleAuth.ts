/**
 * Apple Sign In (OAuth 2.0 Authorization Code flow) helpers.
 *
 * Apple returns user info (name, email) only on the FIRST authorization.
 * Subsequent logins only return the id_token. We store user data in the DB
 * on first login, so we rely on the id_token sub claim for identification.
 */

const APPLE_AUTH_ENDPOINT = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token";

export type AppleProfile = {
  sub: string;
  email: string | null;
  name: string | null;
};

export function buildAppleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(APPLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code id_token");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", opts.state);
  url.searchParams.set("response_mode", "form_post");
  return url.toString();
}

function decodeJwtClaims(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("Malformed id_token");
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(normalized, "base64").toString("utf-8");
  return JSON.parse(json) as Record<string, unknown>;
}

export async function exchangeAppleCode(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<AppleProfile> {
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });

  const resp = await fetch(APPLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Apple token exchange failed (${resp.status}): ${detail}`);
  }

  const data = (await resp.json()) as { id_token?: string };
  if (!data.id_token) {
    throw new Error("Apple token response did not include an id_token");
  }

  const claims = decodeJwtClaims(data.id_token);
  const sub = typeof claims.sub === "string" ? claims.sub : "";
  if (!sub) {
    throw new Error("Apple id_token is missing the 'sub' claim");
  }

  return {
    sub,
    email: typeof claims.email === "string" ? claims.email : null,
    name: null, // Apple only provides name on first auth; handled in oauth.ts
  };
}
