# P0 English sticky+WhatsApp release, direct Cloudflare Pages (no GitHub Actions deploy).
# Clean operator worktree on PR #87 branch. Explicit -Release is required.
# Example: pwsh -File scripts/qa/release-p0-en-share.ps1 -Release
param([switch]$Release)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$project = "humandesignchart-web"
$feature = "fix/p0-en-sticky-whatsapp-og-20261112"
$previewBranch = "hd-p0-en-share-preview"
$expectedBase = "8dfea3e0e4306245d5d6ad2a06dae5e3dff67844"
$previewUrl = "https://$previewBranch.$project.pages.dev/"
function Must($condition, $message) {
  if (-not $condition) { throw "[RELEASE NO-GO] $message" }
}
function Run($program, [string[]] $args) {
  & $program @args
  Must ($LASTEXITCODE -eq 0) "Failed: $program $($args -join ' ')"
}
function Output($program, [string[]] $args) {
  $result = (& $program @args | Out-String).Trim()
  Must ($LASTEXITCODE -eq 0) "Failed: $program $($args -join ' ')"
  return $result
}
function RemoteRead($url) {
  $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 30
  Must ($resp.StatusCode -eq 200) "Remote HTTP status $($resp.StatusCode): $url"
  return $resp
}
function ConfigBindings($config, $name, $idName) {
  if (-not $config -or -not $config.PSObject.Properties[$name]) { return @() }
  $obj = $config.$name
  if (-not $obj) { return @() }
  $ids = @()
  foreach ($item in $obj.PSObject.Properties) {
    if ($null -ne $item.Value -and $item.Value.PSObject.Properties[$idName]) {
      $ids += $item.Value.$idName
    }
  }
  return @($ids | Where-Object { $_ })
}
function ValidateFile($file) {
  Must (Test-Path $file) "Missing build artifact: $file"
  Must ((Get-Item $file).Length -gt 3000) "Empty artifact: $file"
}
function AssertPng($file) {
  ValidateFile $file
  $png = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
  Must ($png.Length -lt 600000) "OG file too large for crawler target: $file"
  Must (($png[0..7] -join ",") -eq "137,80,78,71,13,10,26,10") "Invalid PNG signature $file"
  $w = 16777216*[int]$png[16] + 65536*[int]$png[17] + 256*[int]$png[18] + [int]$png[19]
  $h = 16777216*[int]$png[20] + 65536*[int]$png[21] + 256*[int]$png[22] + [int]$png[23]
  Must ($w -eq 1200 -and $h -eq 630) "Unexpected OG dimensions: $w x $h"
}
$root=Output "git" @("rev-parse","--show-toplevel")
Set-Location $root
$origin=Output "git" @("remote","get-url","origin")
Must ($origin -match "(?i)github\.com[:/]pejtr/humandesignchart(?:\.git)?$") "Wrong GitHub remote."
$branch=Output "git" @("branch","--show-current")
Must ($branch -eq $feature) "Use a clean PR #87 worktree, not main: current branch $branch"
Must (-not (Output "git" @("status","--porcelain","--untracked-files=all"))) "Uncommitted changes; worktree must be clean."
Run "git" @("fetch","--quiet","origin","main",$feature)
$head=Output "git" @("rev-parse","HEAD")
$remoteHead=Output "git" @("rev-parse","refs/remotes/origin/$feature")
Must ($head -eq $remoteHead) "PR #87 HEAD changed locally or remotely. Recheck release SHA."
$mainBefore=Output "git" @("rev-parse","origin/main")
Must ($mainBefore -eq $expectedBase) "main advanced since this release was reviewed; re-review release diff and blockers."
$base=Output "git" @("merge-base","HEAD","origin/main")
Must ($base -eq $mainBefore) "Feature branch is no longer based on current main."
Write-Host "[SOURCE] PR #87 SHA $head; main $mainBefore"

# Project config inspection must happen before any preview/production upload.
$account = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID")
$token = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN")
Must ($account -match "^[a-fA-F0-9]{32}$" -and $token) "Cloudflare account ID and scoped API token required in environment (do not paste them into chat)."
$headers=@{ Authorization="Bearer $token" }
$uri="https://api.cloudflare.com/client/v4/accounts/$account/pages/projects/$project"
$reply=Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 30
Must ($reply.success -and $reply.result -and $reply.result.name -eq $project) "Cannot verify expected Cloudflare Pages project."
Must ($reply.result.production_branch -eq "main") "Cloudflare production branch differs from reviewed main."
$preview=$reply.result.deployment_configs.preview
$production=$reply.result.deployment_configs.production
Must ($null -ne $preview -and $null -ne $production) "Cannot inspect preview and production binding configurations."
foreach ($binding in @(
  @("d1_databases","id"),
  @("kv_namespaces","namespace_id"),
  @("r2_buckets","name"),
  @("durable_object_namespaces","namespace_id"),
  @("hyperdrive_bindings","id"),
  @("services","service")
)) {
  $previewIds=@(ConfigBindings $preview $binding[0] $binding[1])
  $productionIds=@(ConfigBindings $production $binding[0] $binding[1])
  foreach ($item in $previewIds) {
    Must ($item -notin $productionIds) "Unsafe preview binding: shares $($binding[0]) with production."
  }
}
$envKeys = @()
if ($preview.PSObject.Properties["env_vars"] -and $preview.env_vars) {
  $envKeys=@($preview.env_vars.PSObject.Properties.Name)
}
foreach ($key in $envKeys) {
  Must ($key -notmatch "(?i)(STRIPE|COMGATE|PAYGATE|ONYX_PAY|FULFILLMENT|RESEND|BREVO|MAILGUN|GOOGLE_CLIENT_SECRET)") "Preview contains revenue, fulfillment or email configuration: $key"
}
Write-Host "[SAFETY PASS] Preview resource IDs separated from production."

# Capture the current production rollback point before any release write.
# Cloudflare Pages deployments API returns lower-case `id`, independently of
# Wrangler CLI JSON's PascalCase fields. Avoid parsing decorated CLI output.
$history=Invoke-RestMethod -Uri "$uri/deployments?env=production&per_page=10" -Headers $headers -TimeoutSec 30
Must ($history.success -and $history.result) "Cannot read Cloudflare production deployment history."
$items=@($history.result | Where-Object { $_ -and $_.id })
Must ($items.Count -gt 0) "Previous production deployment ID unavailable: cannot establish rollback point."
# The Pages API orders newest first. Require an actual production deployment ID.
$rollbackId=$items[0].id
Must ($rollbackId -match "^[a-zA-Z0-9-]{20,}$") "Unexpected Cloudflare deployment ID shape."
Write-Host "[ROLLBACK] Previous production deployment ID = $rollbackId"

# CI already fails when the Ads Pixel is absent. Manual releases MUST match
# this guard rather than shipping a bundle that silently loses attribution.
$pixel=[Environment]::GetEnvironmentVariable("VITE_OPENAI_ADS_PIXEL_ID")
Must (-not [string]::IsNullOrWhiteSpace($pixel)) "VITE_OPENAI_ADS_PIXEL_ID is missing. Do not deploy a build without conversion attribution."


Run "pnpm" @("install","--frozen-lockfile")
Run "pnpm" @("check")
Run "pnpm" @("exec","vitest","run","--maxWorkers=2","--minWorkers=1")
Run "pnpm" @("build:cloudflare")
ValidateFile "dist/public/index.html"
ValidateFile "dist/public/_worker.js"
AssertPng "dist/public/images/og-home-en-share-v2.png"
AssertPng "dist/public/images/og-home-cs-share-v2.png"
$jsAssets=@(Get-ChildItem "dist/public/assets" -Filter "*.js" -File)
$hasPixel=$false
foreach ($asset in $jsAssets) {
  if (Select-String -Path $asset.FullName -Pattern $pixel -SimpleMatch -Quiet) { $hasPixel=$true; break }
}
Must ($hasPixel) "Built JS assets do not contain the configured OpenAI Ads Pixel identifier."
Must (-not (Output "git" @("status","--porcelain","--untracked-files=all"))) "Build unexpectedly modified source tree."
Write-Host "[BUILD PASS] TypeScript, tests, Pages assets, both 1200x630 compact share PNGs."

if (-not $Release) {
  Write-Host "[PREFLIGHT ONLY] No write or deployment. -Release is required after operator approval."
  exit 0
}
# Exact preview alias, not customer-facing production.
Run "npx" @("wrangler","pages","deploy","dist/public",
  "--project-name=$project","--branch=$previewBranch",
  "--commit-hash=$head","--commit-dirty=false")
Write-Host "[PREVIEW] $previewUrl"
$env:HD_EN_PREVIEW_URL=$previewUrl
$env:GIT_SHA=$head
Run "node" @("scripts/qa/capture-en-share-preview.mjs")
$evidencePath=Join-Path $root "qa-artifacts/p0-en-sticky-whatsapp/evidence.json"
Must (Test-Path $evidencePath) "Missing browser QA evidence."
$qa=Get-Content -Raw $evidencePath | ConvertFrom-Json
Must ($qa.commit -eq $head) "QA evidence refers to different commit SHA."
Must ($qa.origin -eq $previewUrl.TrimEnd('/')) "QA evidence refers to different Cloudflare preview origin."
Must (@($qa.failures).Count -eq 0 -and @($qa.consoleErrors).Count -eq 0 -and @($qa.requestFailures).Count -eq 0) "Preview QA contains errors."
Must (@($qa.screenshots).Count -ge 10) "Expected ten screenshot artifacts from real browser run."
Write-Host "[PREVIEW PASS] 10 screenshots, sticky header, mobile menu, OG image verified."

# Important: GitHub CLI merge does not do the Cloudflare production deployment.
# Do not merge while PR is Draft or when another agent advanced main.
$ghPr=Output "gh" @("pr","view","87","--repo","pejtr/humandesignchart","--json","headRefOid,baseRefOid,isDraft,mergeable")
$info=$ghPr | ConvertFrom-Json
Must ($info.headRefOid -eq $head -and $info.baseRefOid -eq $mainBefore) "PR head/base drift since QA."
Must ($info.mergeable -eq "MERGEABLE") "PR #87 reports a merge conflict."
Run "gh" @("pr","ready","87","--repo","pejtr/humandesignchart")
Run "gh" @("pr","merge","87","--repo","pejtr/humandesignchart","--merge")
Run "git" @("fetch","--quiet","origin","main")
$newMain=Output "git" @("rev-parse","origin/main")
Run "git" @("merge-base","--is-ancestor",$head,$newMain)
Must ($newMain -ne $mainBefore) "PR merge did not advance main."
Run "git" @("switch","--detach",$newMain)
Run "pnpm" @("check")
Run "pnpm" @("exec","vitest","run","--maxWorkers=2","--minWorkers=1")
Run "pnpm" @("build:cloudflare")
AssertPng "dist/public/images/og-home-en-share-v2.png"
AssertPng "dist/public/images/og-home-cs-share-v2.png"
Write-Host "[MERGED + BUILD PASS] main SHA $newMain"

Run "npx" @("wrangler","pages","deploy","dist/public",
  "--project-name=$project","--branch=main",
  "--commit-hash=$newMain","--commit-dirty=false")
Write-Host "[PRODUCTION DEPLOY ATTEMPTED] SHA $newMain"
Write-Host "[ROLLBACK ID] $rollbackId"
Run "node" @("scripts/qa/probe-whatsapp-share.mjs","https://humandesignchart.app/en")
Run "node" @("scripts/qa/probe-whatsapp-share.mjs","https://humandesignmapa.cz/cs")
Write-Host "[PRODUCTION OG HTTP PASS] Finish with a real WhatsApp send-to-self check."
Write-Host "[RELEASE COMPLETE] Production web and share metadata deployed from merged main SHA $newMain."
