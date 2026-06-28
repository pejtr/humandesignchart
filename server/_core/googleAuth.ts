/**
 * Google OAuth 2.0 (Authorization Code flow) helpers.
 *
 * Google is the identity provider. The id_token returned by Google's token
 * endpoint arrives over a direct server-to-server HTTPS call, so its claims can
 * be read without re-verifying the signature (the transport is the trust here).
 */

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export type GoogleProfile = {
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

export function buildGoogleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", opts.state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

function decodeJwtClaims(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("Malformed id_token");
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(normalized, "base64").toString("utf-8");
  return JSON.parse(json) as Record<string, unknown>;
}

export async function exchangeGoogleCode(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });

  const resp = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Google token exchange failed (${resp.status}): ${detail}`);
  }

  const data = (await resp.json()) as { id_token?: string };
  if (!data.id_token) {
    throw new Error("Google token response did not include an id_token");
  }

  const claims = decodeJwtClaims(data.id_token);
  const sub = typeof claims.sub === "string" ? claims.sub : "";
  if (!sub) {
    throw new Error("Google id_token is missing the 'sub' claim");
  }

  return {
    sub,
    email: typeof claims.email === "string" ? claims.email : null,
    name: typeof claims.name === "string" ? claims.name : null,
    picture: typeof claims.picture === "string" ? claims.picture : null,
    emailVerified: claims.email_verified === true,
  };
}
