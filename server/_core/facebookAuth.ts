/**
 * Facebook OAuth 2.0 (Authorization Code flow) helpers.
 */

const FACEBOOK_AUTH_ENDPOINT = "https://www.facebook.com/v18.0/dialog/oauth";
const FACEBOOK_TOKEN_ENDPOINT = "https://graph.facebook.com/v18.0/oauth/access_token";
const FACEBOOK_ME_ENDPOINT = "https://graph.facebook.com/v18.0/me";

export type FacebookProfile = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

export function buildFacebookAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(FACEBOOK_AUTH_ENDPOINT);
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("state", opts.state);
  url.searchParams.set("auth_type", "rerequest");
  return url.toString();
}

export async function exchangeFacebookCode(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<FacebookProfile> {
  const tokenParams = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
  });

  const tokenResp = await fetch(`${FACEBOOK_TOKEN_ENDPOINT}?${tokenParams.toString()}`);
  if (!tokenResp.ok) {
    const detail = await tokenResp.text().catch(() => tokenResp.statusText);
    throw new Error(`Facebook token exchange failed (${tokenResp.status}): ${detail}`);
  }

  const tokenData = (await tokenResp.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Facebook token response did not include an access_token");
  }

  const meResp = await fetch(
    `${FACEBOOK_ME_ENDPOINT}?fields=id,name,email&access_token=${tokenData.access_token}`
  );
  if (!meResp.ok) {
    const detail = await meResp.text().catch(() => meResp.statusText);
    throw new Error(`Facebook /me request failed (${meResp.status}): ${detail}`);
  }

  const me = (await meResp.json()) as {
    id: string;
    name?: string;
    email?: string;
  };

  return {
    id: me.id,
    email: me.email ?? null,
    name: me.name ?? null,
    picture: `https://graph.facebook.com/${me.id}/picture?type=square`,
  };
}
