#!/usr/bin/env bash
# Cloudflare Pages Human Design direct-upload release — NO GitHub Actions.
# Run ONLY from an isolated checkout of pejtr/humandesignchart.
# Never set/store auth secrets in this repository or in client VITE_* vars.
set -euo pipefail

MODE="${1:-verify}"
case "$MODE" in
  verify|preview|production) ;;
  *) echo "Usage: bash scripts/release-hd-google-oauth.sh [verify|preview|production]" >&2; exit 64 ;;
esac

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Uncommitted changes: use an isolated clean release checkout." >&2
  exit 1
fi
for command_name in node pnpm git; do
  command -v "$command_name" >/dev/null || {
    echo "Missing $command_name" >&2; exit 1;
  }
done

echo "[LOCAL] Node: $(node --version); pnpm: $(pnpm --version)"
echo "[LOCAL] Source SHA: $(git rev-parse HEAD)"
echo "[LOCAL] pnpm frozen install"
pnpm install --frozen-lockfile

echo "[LOCAL] TypeScript check"
pnpm check
echo "[LOCAL] Vitest"
pnpm exec vitest run --maxWorkers=2 --minWorkers=1
echo "[LOCAL] Build Cloudflare Pages assets"
pnpm build:cloudflare
test -s dist/public/index.html
test -s dist/public/_worker.js
node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";
const worker = readFileSync("dist/public/_worker.js", "utf8");
const checks = [
  ["OAuth code-flow", "accounts.google.com"],
  ["OIDC keys", "googleapis.com/oauth2/v3/certs"],
  ["Cloudflare D1 auth", "hd_oauth_sessions"],
  ["Fail-closed provider response", "GOOGLE_LOGIN_NOT_CONFIGURED"],
];
for (const [label, match] of checks) {
  if (!worker.includes(match)) {
    console.error("Missing compiled gate: " + label);
    process.exitCode = 1;
  } else console.log("Compiled gate PASS: " + label);
}
NODE

if [[ "$MODE" == "verify" ]]; then
  echo "VERIFY completed locally. No deploy triggered."
  exit 0
fi

if [[ "$MODE" == "production" ]]; then
  echo "[HUMAN GATE] Production requires completed migration, exact Google callbacks,"
  echo "successful preview regression, rollback proof and explicit authorization."
  for flag in HD_OAUTH_D1_BACKUP_CONFIRMED HD_OAUTH_D1_MIGRATED \
              HD_GOOGLE_OAUTH_CALLBACKS_REGISTERED \
              HD_GOOGLE_AUTH_SECRETS_PRESENT HD_PREVIEW_REGRESSION_PASS \
              HD_PRODUCTION_DEPLOY_APPROVED; do
    if [[ "${!flag:-}" != "YES" ]]; then
      echo "Gate missing: $flag=YES" >&2
      exit 1
    fi
  done
  BRANCH="main"
else
  BRANCH="hd-oauth-preview"
fi

echo "Wrangler: $(npx --yes wrangler@4.147.0 --version)"
echo "Current Cloudflare deployments (read-only):"
npx --yes wrangler@4.147.0 pages deployment list --project-name=humandesignchart-web

echo "[DEPLOY] Mode=$MODE; branch=$BRANCH; existing Cloudflare Pages project"
npx --yes wrangler@4.147.0 pages deploy dist/public \
  --project-name=humandesignchart-web --branch="$BRANCH"

echo "Deployed. Verify exact URL, D1 and Google browser E2E before claiming success."
