# PR #88 Cloudflare Pages preview release. No GitHub Actions deploy.
# Requires a clean isolated checkout, a scoped Cloudflare API token and PNPM.
# Usage: pwsh -File scripts/qa/deploy-en-share-preview.ps1           (verify only)
#        pwsh -File scripts/qa/deploy-en-share-preview.ps1 -Deploy -Capture
param([switch]$Deploy, [switch]$Capture)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$expectedRemote = 'pejtr/humandesignchart'
$expectedBranch = 'fix/en-sticky-hero-share-p0-20261112'
$projectName = 'humandesignchart-web'
$previewBranch = 'hd-en-share-preview'
$previewOrigin = "https://$previewBranch.$projectName.pages.dev"

function Assert([bool]$condition, [string]$message) {
  if (-not $condition) { throw $message }
}
function Exec([string]$name, [string[]]$argv) {
  & $name @argv
  Assert ($LASTEXITCODE -eq 0) "Command failed: $name $($argv -join ' ')"
}
function Out([string]$name, [string[]]$argv) {
  $result = (& $name @argv | Out-String).Trim()
  Assert ($LASTEXITCODE -eq 0) "Command failed: $name $($argv -join ' ')"
  return $result
}
function BindingIds($config, [string]$key, [string]$field) {
  if ($null -eq $config -or -not $config.PSObject.Properties[$key]) { return @() }
  $binding = $config.$key
  if ($null -eq $binding) { return @() }
  $ids = @()
  foreach ($property in $binding.PSObject.Properties) {
    if ($null -ne $property.Value -and $property.Value.PSObject.Properties[$field]) {
      $v = $property.Value.$field
      if ($v) { $ids += [string]$v }
    }
  }
  return @($ids)
}

$root = Out 'git' @('rev-parse', '--show-toplevel')
Assert (Test-Path $root) "Run from an existing local checkout of $expectedRemote."
Set-Location $root
$remote = Out 'git' @('remote','get-url','origin')
Assert ($remote -match '(?i)github\.com[:/]pejtr/humandesignchart(?:\.git)?$') 'Wrong origin repository.'
$currentBranch = Out 'git' @('branch','--show-current')
Assert ($currentBranch -eq $expectedBranch) "Expected source branch $expectedBranch; found $currentBranch."
Assert (-not (Out 'git' @('status','--porcelain','--untracked-files=all'))) 'Worktree is dirty. Use an isolated worktree; do not stash or overwrite Antigravity changes.'
Exec 'git' @('fetch','--quiet','origin', $expectedBranch)
$sha = Out 'git' @('rev-parse','HEAD')
$upstream = Out 'git' @('rev-parse','FETCH_HEAD')
Assert ($sha -eq $upstream) 'Local branch SHA differs from remote PR #88. Update your isolated checkout.'
Write-Host "[SOURCE] $sha from $expectedBranch"

Assert ($env:VITE_OPENAI_ADS_PIXEL_ID) 'Missing existing VITE_OPENAI_ADS_PIXEL_ID build setting. Never ship an untracked pixel build.'
Exec 'pnpm' @('install','--frozen-lockfile')
Exec 'pnpm' @('check')
Exec 'pnpm' @('exec','vitest','run','--maxWorkers=2','--minWorkers=1')
Exec 'pnpm' @('build:cloudflare')
foreach ($file in @('dist/public/index.html','dist/public/_worker.js',
  'dist/public/images/og-homepage-cs.png','dist/public/images/og-homepage-en.png')) {
  Assert ((Test-Path $file) -and (Get-Item $file).Length -gt 1000) "Missing deploy artifact $file"
}
foreach ($language in @('cs','en')) {
  $file = Join-Path $root "dist/public/images/og-homepage-$language.png"
  $png = [System.IO.File]::ReadAllBytes($file)
  $width = 16777216*[int]$png[16]+65536*[int]$png[17]+256*[int]$png[18]+[int]$png[19]
  $height = 16777216*[int]$png[20]+65536*[int]$png[21]+256*[int]$png[22]+[int]$png[23]
  Assert ($width -eq 1200 -and $height -eq 630 -and $png.Length -le 300000) "Unexpected $language OG asset size/dimensions"
}
Write-Host '[BUILD PASS] TypeScript + Vitest + Pages build + CZ/EN social PNGs'

$account = [Environment]::GetEnvironmentVariable('CLOUDFLARE_ACCOUNT_ID')
$token = [Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN')
Assert ($account -and $token) 'Set CLOUDFLARE_ACCOUNT_ID and scoped CLOUDFLARE_API_TOKEN in environment; do not paste secrets here.'
Assert ($account -match '^[0-9a-fA-F]{32}$') 'Invalid Cloudflare account identifier.'
$uri = "https://api.cloudflare.com/client/v4/accounts/$account/pages/projects/$projectName"
try {
  $response = Invoke-RestMethod -Uri $uri -Headers @{Authorization="Bearer $token"} -Method Get -TimeoutSec 30
} catch {
  throw 'Cloudflare project readback failed (credentials, network or project permissions). No deploy attempted.'
}
Assert ($response.success -and $response.result.name -eq $projectName) 'Unexpected Cloudflare project.'
$p = $response.result
Assert ($p.production_branch -ne $previewBranch) 'Preview branch unexpectedly equals production branch.'
Assert ($p.deployment_configs -and $p.deployment_configs.production -and $p.deployment_configs.preview) 'Cloudflare did not return production+preview binding configs.'
$production = $p.deployment_configs.production
$preview = $p.deployment_configs.preview

foreach ($tuple in @(
  @('d1_databases','id'), @('kv_namespaces','namespace_id'),
  @('r2_buckets','name'), @('durable_object_namespaces','namespace_id'),
  @('hyperdrive_bindings','id'), @('services','service'),
  @('queues','queue_name')
)) {
  $prodIds = @(BindingIds $production $tuple[0] $tuple[1])
  $previewIds = @(BindingIds $preview $tuple[0] $tuple[1])
  foreach ($id in $previewIds) {
    Assert ($id -notin $prodIds) "NO-GO: Preview shares live $($tuple[0])."
  }
}
$names = @()
if ($preview.PSObject.Properties['env_vars'] -and $preview.env_vars) {
  $names = @($preview.env_vars.PSObject.Properties.Name)
}
$unsafe = @($names | Where-Object {
  $_ -match '(?i)STRIPE|COMGATE|PAYGATE|ONYX_PAY|FULFILLMENT|RESEND|BREVO|MAILGUN|GOOGLE_CLIENT_SECRET|CAPI_TOKEN'
})
Assert ($unsafe.Count -eq 0) 'NO-GO: Preview contains production-like payment/OAuth/email secrets; isolate first.'
Write-Host '[BINDING PASS] No visibly shared production resource IDs or unsafe preview secret names'
Write-Host '[NOTE] Resource-name checks alone cannot prove full runtime isolation; human owner approval is still required.'

if (-not $Deploy -and -not $Capture) {
  Write-Host '[VERIFY ONLY] Nothing deployed. For preview: -Deploy -Capture'
  exit 0
}

Assert (-not (Out 'git' @('status','--porcelain','--untracked-files=all'))) 'Local files changed during build; refusing deployment.'
Assert ((Out 'git' @('rev-parse','HEAD')) -eq $sha) 'Source SHA changed; refusing deployment.'

if ($Deploy) {
  Write-Host "[DEPLOYING PREVIEW ONLY] $previewOrigin from $sha"
  Exec 'npx' @('--yes','wrangler@4.147.0','pages','deploy','dist/public',
    "--project-name=$projectName","--branch=$previewBranch",
    "--commit-hash=$sha",'--commit-dirty=false')
}
foreach ($route in @('/en','/cs','/images/og-homepage-en.png','/images/og-homepage-cs.png')) {
  try {
    $res = Invoke-WebRequest -Uri "$previewOrigin$route" -TimeoutSec 30
    Assert ($res.StatusCode -eq 200) "Preview HTTP $($res.StatusCode): $route"
  } catch {
    throw "Preview readback failed: $route. Stop; nothing has been merged to production."
  }
}
Write-Host "[REMOTE PREVIEW 200] $previewOrigin"

if ($Capture) {
  $env:HD_EN_SHARE_PREVIEW_URL = "$previewOrigin/"
  Exec 'node' @('scripts/qa/capture-en-share-preview.mjs')
  Write-Host '[BROWSER EVIDENCE] qa-artifacts/en-sticky-social/'
}
Write-Host '[PREVIEW COMPLETE] Main and production were not modified.'
