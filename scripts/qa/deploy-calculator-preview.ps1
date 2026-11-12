# Human Design PR #86 — guarded preview release (no production deploy).
# Run from a CLEAN isolated checkout at PR #86 HEAD:
# pwsh -File .\scripts\qa\deploy-calculator-preview.ps1
# pwsh -File .\scripts\qa\deploy-calculator-preview.ps1 -Deploy
param([switch]$Deploy)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$branch = "design/calculator-ambient-background-20261112"
$project = "humandesignchart-web"
$previewBranch = "hd-calculator-preview"
function Check($ok, [string]$message) { if (-not $ok) { throw "[NO-GO] $message" } }
function Call([string]$exe, [string[]]$argv) {
  & $exe @argv
  Check ($LASTEXITCODE -eq 0) "Failed: $exe $($argv -join ' ')"
}
function Read([string]$exe, [string[]]$argv) {
  $v = (& $exe @argv | Out-String).Trim()
  Check ($LASTEXITCODE -eq 0) "Unable to read: $exe $($argv -join ' ')"
  return $v
}
$root = Read "git" @("rev-parse","--show-toplevel")
Set-Location $root
$origin = Read "git" @("remote","get-url","origin")
Check ($origin -match "(?i)github\.com[:/]pejtr/humandesignchart(?:\.git)?$") "Incorrect remote."
$localBranch = Read "git" @("branch","--show-current")
Check ($localBranch -eq $branch -or $localBranch -eq "") "Wrong branch. Use PR #86 or clean detached HEAD."
Check (-not (Read "git" @("status","--porcelain","--untracked-files=all"))) "Dirty checkout; use a separate clean worktree."
Call "git" @("-c","http.version=HTTP/1.1","fetch","--quiet","origin","refs/heads/$branch")
$sha = Read "git" @("rev-parse","HEAD")
Check ($sha -eq (Read "git" @("rev-parse","FETCH_HEAD"))) "Local SHA is not current PR #86 head."
Write-Host "[SOURCE PASS] $sha"
Call "pnpm" @("install","--frozen-lockfile")
Call "pnpm" @("check")
Call "pnpm" @("exec","vitest","run","--maxWorkers=2","--minWorkers=1")
Call "pnpm" @("build:cloudflare")
Check ((Test-Path "dist/public/index.html") -and (Test-Path "dist/public/_worker.js")) "Missing dist/public Cloudflare artifact."
Write-Host "[BUILD PASS]"

# Scoped token required for independent preview-vs-production binding inspection.
$accountId = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID")
$token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN")
Check ($accountId -match "^[0-9a-fA-F]{32}$") "Set CLOUDFLARE_ACCOUNT_ID locally."
Check (-not [string]::IsNullOrWhiteSpace($token)) "Set scoped CLOUDFLARE_API_TOKEN locally. Never paste secrets into chat."
$url = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$project"
$result = Invoke-RestMethod -Method Get -Uri $url -Headers @{Authorization="Bearer $token"} -TimeoutSec 30
Check ($result.success -and $result.result.name -eq $project) "Cloudflare project verification failed."
$p = $result.result
Check ($p.production_branch -ne $previewBranch) "Refusing production branch as preview."
Check ($null -ne $p.deployment_configs.preview -and $null -ne $p.deployment_configs.production) "Missing preview/production config."
$live = $p.deployment_configs.production
$test = $p.deployment_configs.preview
foreach ($spec in @(@("d1_databases","id"),@("kv_namespaces","namespace_id"),@("r2_buckets","name"),@("durable_object_namespaces","namespace_id"),@("hyperdrive_bindings","id"))) {
  $liveIds = @()
  $testIds = @()
  if ($live.PSObject.Properties[$spec[0]] -and $live.($spec[0])) {
    foreach ($b in $live.($spec[0]).PSObject.Properties) {
      if ($b.Value.PSObject.Properties[$spec[1]]) { $liveIds += [string]$b.Value.($spec[1]) }
    }
  }
  if ($test.PSObject.Properties[$spec[0]] -and $test.($spec[0])) {
    foreach ($b in $test.($spec[0]).PSObject.Properties) {
      if ($b.Value.PSObject.Properties[$spec[1]]) { $testIds += [string]$b.Value.($spec[1]) }
    }
  }
  foreach ($id in $testIds) { Check ($id -notin $liveIds) "Preview shares live $($spec[0]) resource." }
}
if ($test.PSObject.Properties["env_vars"] -and $test.env_vars) {
  $blocked = @($test.env_vars.PSObject.Properties.Name | Where-Object { $_ -match "(?i)STRIPE|COMGATE|ONYX.?PAY|RESEND|MAILGUN|BREVO|FULFILLMENT|GOOGLE_CLIENT_SECRET|DATABASE_URL" })
  Check ($blocked.Count -eq 0) "Preview contains live payment, mail, OAuth or DB credential names."
}
Write-Host "[PREVIEW SAFETY PASS] No detected shared customer storage or live secrets."
if (-not $Deploy) { Write-Host "[READ ONLY] No deploy performed; use -Deploy after review."; exit 0 }
Check (-not (Read "git" @("status","--porcelain","--untracked-files=all"))) "Worktree changed."
Check ($sha -eq (Read "git" @("rev-parse","HEAD"))) "HEAD changed."
Write-Host "[DEPLOY PREVIEW ONLY] $previewBranch $sha"
$out = (& npx --yes "wrangler@4.147.0" "pages" "deploy" "dist/public" "--project-name=$project" "--branch=$previewBranch" "--commit-hash=$sha" "--commit-dirty=false" 2>&1 | Out-String)
Check ($LASTEXITCODE -eq 0) "Wrangler failed; production untouched."
Write-Host $out
$urls = [regex]::Matches($out,"https://[a-z0-9-]+\.humandesignchart-web\.pages\.dev")
Check ($urls.Count -gt 0) "Wrangler did not return a verified preview URL."
$previewUrl = $urls[$urls.Count-1].Value
foreach ($path in @("/cs/calculate","/en/calculate")) {
  $response = Invoke-WebRequest -Uri "$previewUrl$path" -UseBasicParsing -TimeoutSec 40
  Check ($response.StatusCode -eq 200 -and $response.Content -match "<html") "Preview HTTP smoke failed on $path."
  Write-Host "[HTTP 200] $previewUrl$path"
}
Write-Host "[NO PRODUCTION CHANGE] Browser E2E and rollback review still needed."
