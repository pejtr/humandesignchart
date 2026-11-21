#!/usr/bin/env node
/**
 * Human Design Google OAuth — SAFE OWNER-ONLY production preflight.
 * Read-only GET Pages project + D1 sqlite_master SELECT + public /api/auth/config.
 * No deployment, migration, secret reveal, customer data, or OAuth code exchange.
 * Usage (in an already-authorized runtime, NEVER paste token in chat):
 *   node scripts/qa/hd-cloudflare-oauth-owner-audit.mjs
 */
import { pathToFileURL } from "node:url";

export const PROJECT = "humandesignchart-web";
export const DOMAINS = [
  "https://humandesignmapa.cz",
  "https://www.humandesignmapa.cz",
  "https://humandesignchart.app",
  "https://www.humandesignchart.app",
];
const TABLES = ["hd_oauth_users", "hd_oauth_sessions"];

function configured(entry) {
  return entry && typeof entry === "object" &&
    (entry.type === "secret_text" || (entry.type === "plain_text" && typeof entry.value === "string" && entry.value.trim().length > 0));
}
function httpError(status) {
  return status === 401 || status === 403 ? "CLOUDFLARE_TOKEN_UNAUTHORIZED" :
    status === 404 ? "PAGES_PROJECT_NOT_FOUND" : "CLOUDFLARE_API_HTTP_" + status;
}
async function safeFetchJson(fetcher, url, token, method, body) {
  try {
    const response = await fetcher(url, {
      method,
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
        accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) return { error: httpError(response.status) };
    const data = await response.json();
    if (!data || data.success !== true) return { error: "CLOUDFLARE_API_REJECTED" };
    return { data: data.result };
  } catch { return { error: "CLOUDFLARE_API_UNREACHABLE" }; }
}
export async function publicOauthStatus(fetcher = fetch) {
  const statuses = [];
  for (const origin of DOMAINS) {
    try {
      const res = await fetcher(origin + "/api/auth/config", {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
        headers: { accept: "application/json" },
      });
      const status = res.status;
      const data = res.ok && res.headers.get("content-type")?.includes("application/json")
        ? await res.json() : null;
      statuses.push({ origin, http: status, google: data?.google === true });
    } catch {
      statuses.push({ origin, http: null, google: false, error: "REQUEST_FAILED" });
    }
  }
  return statuses;
}
export async function auditCloudflareOAuth(opts = {}) {
  const { accountId = "", token = "", fetcher = fetch, includePublic = true } = opts;
  const report = {
    project: PROJECT,
    scope: "read-only",
    checkedAt: new Date().toISOString(),
    result: "BLOCKED",
    blockers: [],
    deployment: null,
    credentials: { clientIdPresent: false, clientSecretPresent: false, secretEncrypted: false },
    d1: { binding: null, oauthUsersTable: false, oauthSessionsTable: false },
    public: [],
  };
  if (includePublic) report.public = await publicOauthStatus(fetcher);
  if (!/^[a-fA-F0-9]{32}$/.test(accountId) || !token || /\s/.test(token)) {
    report.blockers.push("CLOUDFLARE_API_ACCESS_MISSING");
    return report;
  }
  const root = "https://api.cloudflare.com/client/v4/accounts/" + accountId;
  const projectResult = await safeFetchJson(fetcher, root + "/pages/projects/" + PROJECT, token, "GET");
  if (projectResult.error) {
    report.blockers.push(projectResult.error);
    return report;
  }
  const project = projectResult.data;
  const prod = project?.deployment_configs?.production;
  const env = prod?.env_vars || {};
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  report.credentials.clientIdPresent = Boolean(configured(clientId));
  report.credentials.clientSecretPresent = Boolean(clientSecret && clientSecret.type === "secret_text");
  report.credentials.secretEncrypted = Boolean(clientSecret && clientSecret.type === "secret_text");
  // All variable VALUES, even plaintext Client ID, deliberately discarded.
  if (!report.credentials.clientIdPresent) report.blockers.push("GOOGLE_CLIENT_ID_MISSING_OR_EMPTY");
  if (!report.credentials.clientSecretPresent) report.blockers.push("GOOGLE_CLIENT_SECRET_MISSING_OR_NOT_ENCRYPTED");
  const latest = project?.latest_deployment;
  if (latest) report.deployment = {
    deploymentId: typeof latest.id === "string" ? latest.id : null,
    commitHash: typeof latest.deployment_trigger?.metadata?.commit_hash === "string" ?
      latest.deployment_trigger.metadata.commit_hash : null,
    environment: latest.environment || null,
  };
  const bindings = prod?.d1_databases || {};
  const bindingName = bindings.HD_ORDERS ? "HD_ORDERS" : bindings.DB ? "DB" : null;
  report.d1.binding = bindingName;
  if (!bindingName) {
    report.blockers.push("PRODUCTION_D1_BINDING_MISSING");
  } else {
    const binding = bindings[bindingName];
    const id = typeof binding?.id === "string" ? binding.id : binding?.database_id;
    if (typeof id !== "string" || !/^[a-fA-F0-9-]{32,36}$/.test(id)) {
      report.blockers.push("PRODUCTION_D1_ID_UNAVAILABLE");
    } else {
      const query = await safeFetchJson(fetcher,
        root + "/d1/database/" + id + "/query", token, "POST", {
          sql: "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('hd_oauth_users','hd_oauth_sessions') ORDER BY name",
        });
      if (query.error) {
        report.blockers.push("D1_READONLY_SCHEMA_CHECK_FAILED");
      } else {
        const objects = Array.isArray(query.data) ? query.data : [query.data];
        const names = new Set(objects.flatMap(item => Array.isArray(item?.results) ?
          item.results.map(row => row?.name) : []));
        report.d1.oauthUsersTable = names.has(TABLES[0]);
        report.d1.oauthSessionsTable = names.has(TABLES[1]);
        if (!report.d1.oauthUsersTable) report.blockers.push("D1_OAUTH_USERS_TABLE_MISSING");
        if (!report.d1.oauthSessionsTable) report.blockers.push("D1_OAUTH_SESSIONS_TABLE_MISSING");
      }
    }
  }
  if (includePublic && report.public.some(entry => !entry.google)) {
    report.blockers.push("PUBLIC_GOOGLE_READINESS_NOT_CONFIRMED");
  }
  if (report.blockers.length === 0) report.result = "CONFIG_PRESENT_NEEDS_BROWSER_E2E";
  return report;
}
async function main() {
  const report = await auditCloudflareOAuth({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    token: process.env.CLOUDFLARE_API_TOKEN || "",
  });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (report.result !== "CONFIG_PRESENT_NEEDS_BROWSER_E2E") process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { process.stderr.write("OWNER_AUDIT_FAILED\n"); process.exitCode = 1; });
}
