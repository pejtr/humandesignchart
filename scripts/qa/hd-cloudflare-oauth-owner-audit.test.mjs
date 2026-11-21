import assert from "node:assert/strict";
import { test } from "node:test";
import { auditCloudflareOAuth, publicOauthStatus } from "./hd-cloudflare-oauth-owner-audit.mjs";

const ACCOUNT = "c".repeat(32);
const SECRET = "not-an-actual-secret";
const D1_ID = "12345678-1234-1234-1234-123456789abc";
const production = (override = {}) => ({
  env_vars: {
    GOOGLE_CLIENT_ID: { type: "plain_text", value: "public-client-id" },
    GOOGLE_CLIENT_SECRET: { type: "secret_text", value: SECRET },
  },
  d1_databases: { HD_ORDERS: { id: D1_ID } },
  ...override,
});
function fixture({ environment = production(), rows = [
  { name: "hd_oauth_users" }, { name: "hd_oauth_sessions" },
], publicGoogle = true, forbidden = false } = {}) {
  const calls = [];
  const fetcher = async (url, opts) => {
    calls.push({ url: String(url), method: opts?.method, body: opts?.body });
    if (String(url).includes("/api/auth/config")) {
      return Response.json({ google: publicGoogle });
    }
    if (forbidden) return Response.json({ success: false }, { status: 403 });
    if (String(url).endsWith("/pages/projects/humandesignchart-web")) {
      return Response.json({
        success: true,
        result: {
          deployment_configs: { production: environment },
          latest_deployment: {
            id: "deployment-id",
            environment: "production",
            deployment_trigger: { metadata: { commit_hash: "abc1234" } },
          },
        },
      });
    }
    if (String(url).includes("/d1/database/") && String(url).endsWith("/query")) {
      return Response.json({ success: true, result: [{ success: true, results: rows }] });
    }
    throw new Error("Unexpected endpoint " + url);
  };
  return { fetcher, calls };
}
test("redacts ALL credentials, checks exact production Pages project and SELECT-only D1", async () => {
  const { fetcher, calls } = fixture();
  const report = await auditCloudflareOAuth({
    accountId: ACCOUNT, token: "secret-api-token-123456", fetcher,
  });
  assert.equal(report.result, "CONFIG_PRESENT_NEEDS_BROWSER_E2E");
  assert.equal(report.public.length, 4);
  assert.deepEqual(report.blockers, []);
  assert.equal(report.credentials.clientSecretPresent, true);
  assert.equal(report.d1.binding, "HD_ORDERS");
  assert.equal(report.d1.oauthUsersTable, true);
  assert.equal(report.d1.oauthSessionsTable, true);
  assert.equal(calls.filter(v => v.method === "POST").length, 1);
  assert.match(calls.find(v => v.method === "POST").body,
    /SELECT name FROM sqlite_master/);
  assert.ok(!JSON.stringify(report).includes(SECRET));
  assert.ok(!JSON.stringify(report).includes("secret-api-token"));
  assert.ok(!JSON.stringify(report).includes("public-client-id"));
});
test("does not invent binding or schema success in a different project", async () => {
  const { fetcher } = fixture({ environment: production({ d1_databases: {} }) });
  const report = await auditCloudflareOAuth({
    accountId: ACCOUNT, token: "x", fetcher, includePublic: false,
  });
  assert.equal(report.result, "BLOCKED");
  assert.ok(report.blockers.includes("PRODUCTION_D1_BINDING_MISSING"));
});
test("detects missing sessions schema without touching any customer table", async () => {
  const { fetcher, calls } = fixture({ rows: [{ name: "hd_oauth_users" }] });
  const report = await auditCloudflareOAuth({
    accountId: ACCOUNT, token: "x", fetcher, includePublic: false,
  });
  assert.ok(report.blockers.includes("D1_OAUTH_SESSIONS_TABLE_MISSING"));
  assert.ok(calls.every(c => !c.body || !/UPDATE|DELETE|INSERT|DROP|ALTER/i.test(c.body)));
});
test("fails closed when Google secret is absent or plaintext", async () => {
  const { fetcher } = fixture({
    environment: production({ env_vars: {
      GOOGLE_CLIENT_ID: { type: "plain_text", value: "public-id" },
      GOOGLE_CLIENT_SECRET: { type: "plain_text", value: SECRET },
    } }),
  });
  const report = await auditCloudflareOAuth({
    accountId: ACCOUNT, token: "x", fetcher, includePublic: false,
  });
  assert.ok(report.blockers.includes("GOOGLE_CLIENT_SECRET_MISSING_OR_NOT_ENCRYPTED"));
  assert.equal(report.credentials.secretEncrypted, false);
});
test("never reports ready when public OAuth still shows google:false", async () => {
  const { fetcher } = fixture({ publicGoogle: false });
  const report = await auditCloudflareOAuth({ accountId: ACCOUNT, token: "x", fetcher });
  assert.ok(report.blockers.includes("PUBLIC_GOOGLE_READINESS_NOT_CONFIRMED"));
});
test("missing owner API token cannot trigger a Cloudflare D1 query", async () => {
  const { fetcher, calls } = fixture();
  const report = await auditCloudflareOAuth({ accountId: ACCOUNT, token: "", fetcher, includePublic: false });
  assert.deepEqual(report.blockers, ["CLOUDFLARE_API_ACCESS_MISSING"]);
  assert.equal(calls.length, 0);
});
test("expired/denied Cloudflare token yields sanitized public error code", async () => {
  const { fetcher } = fixture({ forbidden: true });
  const report = await auditCloudflareOAuth({ accountId: ACCOUNT, token: "x", fetcher, includePublic: false });
  assert.deepEqual(report.blockers, ["CLOUDFLARE_TOKEN_UNAUTHORIZED"]);
});
test("public probe checks all four brands without Google consent or session actions", async () => {
  const { fetcher, calls } = fixture({ publicGoogle: false });
  const statuses = await publicOauthStatus(fetcher);
  assert.equal(statuses.length, 4);
  assert.ok(statuses.every(o => o.google === false && o.http === 200));
  assert.ok(calls.every(o => o.method === "GET"));
});
