# HDCHART P0 isolated Cloudflare Pages preview: NO production writes.
# Use from a clean isolated checkout of PR #84 (PowerShell 7+):
# pwsh -File scripts/qa/release-blueprint-preview.ps1
# pwsh -File scripts/qa/release-blueprint-preview.ps1 -Deploy
# Preview is PUBLIC-ROUTES ONLY unless a separately reviewed test-only payment/OAuth stack exists.
param([switch] $Deploy)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repo = "pejtr/humandesignchart"
$sourceBranch = "fix/p0-blueprint-valid-chart-login-20261109"
$previewBranch = "hd-blueprint-qa"
$projectName = "humandesignchart-web"

function Assert([bool] $condition, [string] $reason) {
  if (-not $condition) { throw "[NO-GO] $reason" }
}
function ReadCmd([string] $program, [string[]] $arguments) {
  $result = (& $program @arguments 2>&1 | Out-String).Trim()
  Assert ($LASTEXITCODE -eq 0) "Command failed: $program $($arguments -join ' ')"
  return $result
}
function RunCmd([string] $program, [string[]] $arguments) {
  & $program @arguments
  Assert ($LASTEXITCODE -eq 0) "Command failed: $program $($arguments -join ' ')"
}
function BindingIds($configuration, [string] $kind, [string] $identityProperty) {
  if (-not $configuration -or -not $configuration.PSObject.Properties[$kind]) { return @() }
  $collection = $configuration.$kind
  if (-not $collection) { return @() }
  $values = @()
  foreach ($binding in $collection.PSObject.Properties) {
    $identity = $binding.Value.PSObject.Properties[$identityProperty]
    Assert ($null -ne $identity -and -not [string]::IsNullOrWhiteSpace([string]$identity.Value)) "Missing identity in $kind binding: $($binding.Name)"
    $values += [string]$identity.Value
  }
  return $values
}

$root = ReadCmd "git" @("rev-parse","--show-toplevel")
Set-Location $root
$remote = ReadCmd "git" @("remote","get-url","origin")
Assert ($remote -match "(?i)github\.com[:/]pejtr/humandesignchart(?:\.git)?$") "Unexpected Git origin"
Assert (-not (ReadCmd "git" @("status","--porcelain","--untracked-files=all"))) "Dirty worktree: preserve local work in a separate checkout"
$currentBranch = ReadCmd "git" @("branch","--show-current")
Assert ($currentBranch -eq $sourceBranch -or $currentBranch -eq "") "Use PR #84 branch or a detached isolated worktree"
RunCmd "git" @("fetch","--quiet","origin","refs/heads/$sourceBranch")
$sha = ReadCmd "git" @("rev-parse","HEAD")
$expected = ReadCmd "git" @("rev-parse","FETCH_HEAD")
Assert ($sha -eq $expected) "Local HEAD differs from current remote PR #84 SHA"
Write-Host "[SOURCE PASS] repo=$repo sha=$sha"
foreach ($command in @("node","pnpm","npx")) {
  Assert ($null -ne (Get-Command $command -ErrorAction SilentlyContinue)) "Missing executable: $command"
}
RunCmd "pnpm" @("install","--frozen-lockfile")
RunCmd "pnpm" @("check")
RunCmd "pnpm" @("exec","vitest","run","--maxWorkers=2","--minWorkers=1")
RunCmd "pnpm" @("build:cloudflare")
foreach ($path in @("dist/public/index.html", "dist/public/_worker.js")) {
  Assert ((Test-Path $path) -and ((Get-Item $path).Length -gt 100)) "Missing/empty Cloudflare artifact: $path"
}
Write-Host "[BUILD PASS] TypeScript + Vitest + Pages artifacts"

$accountId = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID")
$token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN")
Assert ($accountId -match "^[a-fA-F0-9]{32}$") "CLOUDFLARE_ACCOUNT_ID missing or invalid"
Assert (-not [string]::IsNullOrWhiteSpace($token)) "CLOUDFLARE_API_TOKEN missing; never put secrets in Git, logs or chat"
$uri = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$projectName"
$headers = @{ Authorization = "Bearer $token" }
$projectResponse = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers -TimeoutSec 30
Assert ($projectResponse.success -and $projectResponse.result.name -eq $projectName) "Cloudflare project lookup failed"
$project = $projectResponse.result
Assert ($project.production_branch -ne $previewBranch) "Preview branch is configured as production"
Assert ($null -ne $project.deployment_configs.production -and $null -ne $project.deployment_configs.preview) "Missing deployment_configs production/preview"
$prod = $project.deployment_configs.production
$preview = $project.deployment_configs.preview

# The Pages API, not a local wrangler.toml, is authoritative for Direct Upload bindings.
foreach ($kind in @(
  @("d1_databases","id"),
  @("kv_namespaces","namespace_id"),
  @("r2_buckets","name"),
  @("durable_object_namespaces","namespace_id"),
  @("hyperdrive_bindings","id"),
  @("services","service")
)) {
  $productionIds = @(BindingIds $prod $kind[0] $kind[1])
  $previewIds = @(BindingIds $preview $kind[0] $kind[1])
  foreach ($id in $previewIds) {
    Assert ($id -notin $productionIds) "Preview shares production $($kind[0]) identifier"
  }
}
# This script permits a zero-write public smoke only. Payment, OAuth and email
# E2E require a separately approved, *test-only* environment; don't guess from names.
if ($preview.PSObject.Properties["env_vars"] -and $preview.env_vars) {
  $secretNames = @($preview.env_vars.PSObject.Properties.Name)
  $bad = @($secretNames | Where-Object {
    $_ -match "(?i)STRIPE|COMGATE|PAYGATE|ONYX.?PAY|FULFILLMENT|RESEND|BREVO|MAILGUN|GOOGLE_CLIENT_SECRET|DATABASE_URL|OPENAI_CONVERSIONS_API_KEY"
  })
  Assert ($bad.Count -eq 0) "Preview exposes payment/OAuth/email credential names: $($bad -join ', ')"
}
Write-Host "[ISOLATION PASS] No detected shared storage IDs or payment/OAuth/email secret names"
Write-Host "[NOTE] This does NOT certify test payment, OAuth, or PDF E2E"
Write-Host "[CLOUDFLARE READ ONLY] Existing deployments:"
RunCmd "npx" @("--yes","wrangler@4.147.0","pages","deployment","list","--project-name=$projectName")
if (-not $Deploy) {
  Write-Host "[DRY RUN COMPLETE] No deployment. Rerun with -Deploy for isolated preview only."
  exit 0
}
Assert (-not (ReadCmd "git" @("status","--porcelain","--untracked-files=all"))) "Working tree modified during verification"
Assert ($sha -eq (ReadCmd "git" @("rev-parse","HEAD"))) "HEAD changed during build"
Write-Host "[PREVIEW DEPLOY ONLY] project=$projectName branch=$previewBranch sha=$sha"
$output = (& npx --yes "wrangler@4.147.0" "pages" "deploy" "dist/public" "--project-name=$projectName" "--branch=$previewBranch" "--commit-hash=$sha" "--commit-dirty=false" 2>&1 | Out-String)
Assert ($LASTEXITCODE -eq 0) "Wrangler preview upload failed"
Write-Host $output
$matches = [regex]::Matches($output,"https://[a-z0-9-]+\.humandesignchart-web\.pages\.dev")
Assert ($matches.Count -gt 0) "Missing preview URL in Wrangler output; do not claim success"
$actualUrl = $matches[$matches.Count-1].Value
foreach ($route in @("/cs","/en","/cs/calculate","/en/calculate")) {
  $resp = Invoke-WebRequest -Uri "$actualUrl$route" -TimeoutSec 40
  Assert ($resp.StatusCode -eq 200 -and $resp.Content -match "<html") "HTTP smoke failed: $route"
  Write-Host "[HTTP PASS] $actualUrl$route"
}
Write-Host "[PREVIEW ONLY] HD_AUDIT_PREVIEW_URL=$actualUrl/"
Write-Host "Run read-only audit from PR #89: node scripts/qa/audit-revenue-preview.mjs"
Write-Host "Payment, login and PDF are NOT tested. Production remains NO-GO."
