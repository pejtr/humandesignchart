/**
 * Google Ads API — read-only reporting client (REST, no heavy gRPC dependency).
 *
 * Auth chain: a long-lived OAuth refresh token (offline access, scope
 * `https://www.googleapis.com/auth/adwords`) is exchanged for a short-lived
 * access token, which is sent together with the developer token and the
 * login-customer-id (the Manager/MCC account) to the Google Ads REST endpoint.
 *
 * Everything here is read-only — it only runs GAQL SELECT queries. Nothing in
 * this module can create campaigns or spend money.
 */
import { ENV } from "./env";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

// Date-range presets are an allow-list of valid GAQL `DURING` literals so the
// caller can never inject arbitrary GAQL through the range parameter.
export const ADS_DATE_RANGES = [
  "TODAY",
  "YESTERDAY",
  "LAST_7_DAYS",
  "LAST_14_DAYS",
  "LAST_30_DAYS",
  "THIS_MONTH",
  "LAST_MONTH",
] as const;
export type AdsDateRange = (typeof ADS_DATE_RANGES)[number];

export type AdsCampaignRow = {
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  cost: number; // cost in account currency units (costMicros / 1_000_000)
  conversions: number;
  ctr: number; // clicks / impressions
};

export function isGoogleAdsConfigured(): boolean {
  return Boolean(
    ENV.googleAdsDeveloperToken &&
      ENV.googleAdsClientId &&
      ENV.googleAdsClientSecret &&
      ENV.googleAdsRefreshToken &&
      ENV.googleAdsCustomerId
  );
}

function assertConfigured(): void {
  const missing: string[] = [];
  if (!ENV.googleAdsDeveloperToken) missing.push("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!ENV.googleAdsClientId) missing.push("GOOGLE_ADS_CLIENT_ID");
  if (!ENV.googleAdsClientSecret) missing.push("GOOGLE_ADS_CLIENT_SECRET");
  if (!ENV.googleAdsRefreshToken) missing.push("GOOGLE_ADS_REFRESH_TOKEN");
  if (!ENV.googleAdsCustomerId) missing.push("GOOGLE_ADS_CUSTOMER_ID");
  if (missing.length > 0) {
    throw new Error(`Google Ads not configured: missing ${missing.join(", ")}`);
  }
}

const stripDashes = (id: string) => id.replace(/-/g, "").trim();

async function getAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: ENV.googleAdsClientId,
    client_secret: ENV.googleAdsClientSecret,
    refresh_token: ENV.googleAdsRefreshToken,
    grant_type: "refresh_token",
  });

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Google Ads token refresh failed (${resp.status}): ${detail}`);
  }

  const data = (await resp.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google Ads token refresh did not return an access_token");
  }
  return data.access_token;
}

/** Run a GAQL SELECT query against the configured customer and return the rows. */
async function runGaql(query: string): Promise<Record<string, any>[]> {
  assertConfigured();
  const accessToken = await getAccessToken();
  const customerId = stripDashes(ENV.googleAdsCustomerId);
  const loginCustomerId = stripDashes(
    ENV.googleAdsLoginCustomerId || ENV.googleAdsCustomerId
  );
  const version = ENV.googleAdsApiVersion;

  const url = `https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:searchStream`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "developer-token": ENV.googleAdsDeveloperToken,
      "login-customer-id": loginCustomerId,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Google Ads API error (${resp.status}): ${detail}`);
  }

  // searchStream returns an array of response chunks, each with `results`.
  const payload = (await resp.json()) as
    | Array<{ results?: Record<string, any>[] }>
    | { results?: Record<string, any>[] };
  const chunks = Array.isArray(payload) ? payload : [payload];
  return chunks.flatMap(chunk => chunk.results ?? []);
}

const toNum = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Campaign-level performance report for the given date range. */
export async function getCampaignReport(opts: {
  range?: AdsDateRange;
} = {}): Promise<AdsCampaignRow[]> {
  const range: AdsDateRange = opts.range ?? "LAST_30_DAYS";
  // `range` is constrained to the allow-list above, so this interpolation is safe.
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING ${range}
    ORDER BY metrics.cost_micros DESC
  `;

  const rows = await runGaql(query);
  return rows.map(row => {
    const impressions = toNum(row.metrics?.impressions);
    const clicks = toNum(row.metrics?.clicks);
    const costMicros = toNum(row.metrics?.costMicros);
    return {
      campaignId: String(row.campaign?.id ?? ""),
      campaignName: String(row.campaign?.name ?? ""),
      status: String(row.campaign?.status ?? ""),
      impressions,
      clicks,
      costMicros,
      cost: costMicros / 1_000_000,
      conversions: toNum(row.metrics?.conversions),
      ctr: impressions > 0 ? clicks / impressions : 0,
    };
  });
}
