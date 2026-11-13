#!/usr/bin/env bash
# HumanDesignChart direct Cloudflare Pages release. GitHub Actions not required.
# Default: local verification only. Production is fail-closed.
set -euo pipefail

mode="${1:-verify}"
case "$mode" in
  verify|preview|production) ;;
  *) echo 'Usage: bash scripts/p0-direct-cloudflare-release.sh [verify|preview|production]' >&2; exit 64 ;;
esac

for tool in git node pnpm npx; do
  command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 1; }
done
root="$(git rev-parse --show-toplevel)"
cd "$root"

# Never deploy an unknown repo, worktree or unpushed revision.
remote="$(git remote get-url origin)"
if [[ ! "$remote" =~ github\.com[:/]pejtr/humandesignchart(\.git)?$ ]]; then
  echo 'Refusing: origin is not pejtr/humandesignchart.' >&2; exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo 'Refusing: worktree is not clean. Use a clean checkout.' >&2; exit 1
fi
git fetch --quiet origin main
head_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse refs/remotes/origin/main)"
if [[ "$head_sha" != "$remote_sha" ]]; then
  echo "Refusing: HEAD $head_sha differs from origin/main $remote_sha." >&2
  echo 'Checkout the verified main SHA in a clean worktree.' >&2; exit 1
fi
if [[ "$(pnpm --version)" != 10.* ]]; then
  echo 'Refusing: this repository requires pnpm 10.x.' >&2; exit 1
fi
printf '[P0] mode=%s sha=%s node=%s pnpm=%s\n' "$mode" "$head_sha" "$(node --version)" "$(pnpm --version)"

pnpm install --frozen-lockfile
pnpm check
pnpm exec vitest run --maxWorkers=2 --minWorkers=1
pnpm build:cloudflare
test -s dist/public/index.html
test -s dist/public/_worker.js
printf '[PASS] TypeScript, Vitest, Cloudflare build and artifact at %s\n' "$head_sha"

if [[ "$mode" == verify ]]; then
  echo '[VERIFY ONLY] No preview or production deployment performed.'
  exit 0
fi

if [[ "$mode" == production ]]; then
  if [[ "$(git branch --show-current)" != main ]]; then
    echo 'Refusing production: current branch must be main.' >&2; exit 1
  fi
  for flag in HD_PREVIEW_E2E_PASS HD_CHECKOUT_SANDBOX_PASS HD_D1_AND_WEBHOOK_VERIFIED HD_ROLLBACK_READY HD_PRODUCTION_DEPLOY_APPROVED; do
    if [[ "${!flag:-}" != YES ]]; then
      echo "Refusing production: explicit $flag=YES evidence/approval missing." >&2
      exit 1
    fi
  done
  cf_branch=main
else
  cf_branch=hd-revenue-preview
fi

# Check authentication and the existing target project; do not create or rebind Pages.
npx --yes wrangler@4.147.0 whoami
npx --yes wrangler@4.147.0 pages deployment list --project-name=humandesignchart-web

# Re-check source revision to guard against changes while tests were running.
if [[ "$(git rev-parse HEAD)" != "$head_sha" || -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo 'Refusing: source changed during verification.' >&2; exit 1
fi
git fetch --quiet origin main
if [[ "$(git rev-parse refs/remotes/origin/main)" != "$head_sha" ]]; then
  echo 'Refusing: origin/main advanced after verification.' >&2; exit 1
fi

echo "[DEPLOY] existing Cloudflare Pages project=humandesignchart-web branch=$cf_branch sha=$head_sha"
npx --yes wrangler@4.147.0 pages deploy dist/public --project-name=humandesignchart-web --branch="$cf_branch"
echo '[DEPLOY SUBMITTED] Verify deployment URL, /api/health and full paid fulfillment before reporting success.'
