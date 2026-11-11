# Preview-only Cloudflare Pages release for PR #85 (Windows / Antigravity).
# Usage: pwsh -File scripts/qa/deploy-motion-preview.ps1 -Deploy -Capture
# The default without -Deploy validates code and inspects configuration; it never writes externally.
param(
  [switch] $Deploy,
  [switch] $Capture
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$projectName = 'humandesignchart-web'
$expectedBranch = 'feat/bodygraph-motion-controls-20261110'
$previewBranch = 'hd-motion-preview'
$previewOrigin = "https://$previewBranch.$projectName.pages.dev"
function Assert($condition, $message) { if (-not $condition) { throw $message } }
function Exec($program, [string[]]$arguments) {
  & $program @arguments
  Assert ($LASTEXITCODE -eq 0) "Command failed ($LASTEXITCODE): $program $($arguments -join ' ')"
}
function ReadOutput($program, [string[]]$arguments) {
  $s = (& $program @arguments 2>&1 | Out-String).Trim()
  Assert ($LASTEXITCODE -eq 0) "Command failed: $program $($arguments -join ' ')"
  return $s
}
function BindingIds($config, $property, $idProperty) {
  if (-not $config -or -not $config.PSObject.Properties[$property]) { return @() }
  $bindings = $config.$property
  if (-not $bindings) { return @() }
  return @($bindings.PSObject.Properties | ForEach-Object {
    if ($_.Value -and $_.Value.PSObject.Properties[$idProperty]) { $_.Value.$idProperty }
  } | Where-Object { $_ })
}

$root = ReadOutput git @('rev-parse','--show-toplevel')
Set-Location $root
$origin = ReadOutput git @('remote','get-url','origin')
Assert ($origin -match '(?i)(?:github\.com[:/])pejtr/humandesignchart(?:\.git)?$') 'Refusing: unexpected Git remote.'
$currentBranch = ReadOutput git @('branch','--show-current')
Assert ($currentBranch -eq $expectedBranch) "Refusing: wrong source branch '$currentBranch'."
$dirty = ReadOutput git @('status','--porcelain','--untracked-files=all')
Assert (-not $dirty) "Refusing: worktree has uncommitted changes. Preserve local Antigravity WIP in a separate worktree."
Exec git @('fetch','--quiet','origin', $expectedBranch)
$sha = ReadOutput git @('rev-parse','HEAD')
$upstream = ReadOutput git @('rev-parse',"refs/remotes/origin/$expectedBranch")
Assert ($sha -eq $upstream) 'Refusing: local checkout differs from remote PR #85. Update isolated checkout.'
Write-Host "[SOURCE] $sha on $expectedBranch"

# Always validate the exact deployable artifact (no GitHub Actions required).
Exec pnpm @('install','--frozen-lockfile')
Exec pnpm @('check')
Exec pnpm @('exec','vitest','run','--maxWorkers=2','--minWorkers=1')
Exec pnpm @('build:cloudflare')
foreach ($path in @('dist/public/index.html','dist/public/_worker.js','dist/public/images/og-motion-preview.png')) {
  Assert ((Test-Path $path) -and ((Get-Item $path).Length -gt 500)) "Missing or empty build artifact: $path"
}
# Parse the PNG IHDR dimensions without any graphics dependency.
$png = [System.IO.File]::ReadAllBytes((Join-Path $root 'dist/public/images/og-motion-preview.png'))
Assert ($png.Length -gt 10000) 'OG PNG unexpectedly small.'
Assert (($png[0..7] -join ',') -eq '137,80,78,71,13,10,26,10') 'OG file is not PNG.'
$width = 16777216 * [int]$png[16] + 65536 * [int]$png[17] + 256 * [int]$png[18] + [int]$png[19]
$height = 16777216 * [int]$png[20] + 65536 * [int]$png[21] + 256 * [int]$png[22] + [int]$png[23]
Assert ($width -eq 1200 -and $height -eq 630) "Unexpected OG size: $width x $height"
Write-Host "[BUILD PASS] Typecheck, Vitest, Pages Worker, 1200x630 OG PNG."

# Read ONLY project configuration using a scoped Cloudflare token; never log it.
$accountId = [Environment]::GetEnvironmentVariable('CLOUDFLARE_ACCOUNT_ID')
$token = [Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN')
Assert ($accountId -and $token) 'Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in operator environment. Do not paste tokens in the chat.'
Assert ($accountId -match '^[a-fA-F0-9]{32}$') 'Invalid Cloudflare account id.'
$uri = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$projectName"
$headers = @{ Authorization = "Bearer $token" }
$raw = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec 30
Assert ($raw.success -and $raw.result) 'Unable to confirm Cloudflare Pages project.'
$project = $raw.result
Assert ($project.name -eq $projectName) 'Wrong Cloudflare Pages project.'
Assert ($project.production_branch -ne $previewBranch) 'Refusing: preview branch is production branch.'
$production = $project.deployment_configs.production
$preview = $project.deployment_configs.preview
Assert ($null -ne $preview -and $null -ne $production) 'Missing Cloudflare preview/production deployment config.'

# Never attach a preview to the same D1, KV, R2, DO, Hyperdrive, Queue or service as production.
foreach ($kind in @(
  @('d1_databases','id'), @('kv_namespaces','namespace_id'),
  @('r2_buckets','name'), @('durable_object_namespaces','namespace_id'),
  @('hyperdrive_bindings','id'), @('services','service')
)) {
  $previewIds = @(BindingIds $preview $kind[0] $kind[1])
  $productionIds = @(BindingIds $production $kind[0] $kind[1])
  foreach ($value in $previewIds) {
    Assert ($value -notin $productionIds) "Unsafe preview: shared $($kind[0]) binding with production."
  }
}
# Preview must not be able to charge customers, grant credits or send production email.
$previewVars = @()
if ($preview.PSObject.Properties['env_vars'] -and $preview.env_vars) {
  $previewVars = @($preview.env_vars.PSObject.Properties.Name)
}
$blockedVars = @($previewVars | Where-Object {
  $_ -match '(?i)STRIPE|COMGATE|PAYGATE|ONYX_PAY|FULFILLMENT|RESEND|BREVO|MAILGUN|OPENAI_CONVERSIONS_API_KEY|GOOGLE_CLIENT_SECRET'
})
Assert ($blockedVars.Count -eq 0) "Preview has payment, fulfillment or customer-email secrets. Disconnect from preview before deployment; no secret values were read or printed."
Write-Host '[SAFETY PASS] Preview is separate from production resource IDs and revenue credentials.'

if (-not $Deploy) {
  Write-Host '[VERIFY ONLY] No deploy attempted. For isolated preview use -Deploy after inspecting this report.'
  exit 0
}

# Re-read branch state immediately before uploading. No --branch=main is accepted here.
$dirtyAfter = ReadOutput git @('status','--porcelain','--untracked-files=all')
Assert (-not $dirtyAfter) 'Refusing: source changed during build.'
$shaAfter = ReadOutput git @('rev-parse','HEAD')
Assert ($shaAfter -eq $sha) 'Refusing: branch changed during build.'
Write-Host "[DEPLOY PREVIEW ONLY] project=$projectName branch=$previewBranch sha=$sha"
Exec npx @('--yes','wrangler@4.147.0','pages','deploy','dist/public',
  "--project-name=$projectName","--branch=$previewBranch","--commit-hash=$sha",'--commit-dirty=false')

# Only a remote readback counts as a deployed preview.
foreach ($path in @('/cs/motion-preview','/en/motion-preview')) {
  $response = Invoke-WebRequest -Uri "$previewOrigin$path" -UseBasicParsing -TimeoutSec 30
  Assert ($response.StatusCode -eq 200) "Preview returned HTTP $($response.StatusCode): $path"
  Assert ($response.Content -match '(?i)ZEN / FLOW') "Preview is missing route-specific SSR metadata: $path"
  Assert ($response.Content -match 'noindex') "Preview must remain noindex: $path"
}
$imageResponse = Invoke-WebRequest -Uri "$previewOrigin/images/og-motion-preview.png" -UseBasicParsing -TimeoutSec 30
Assert ($imageResponse.StatusCode -eq 200) 'Preview OG image unavailable.'
Write-Host "[REMOTE PASS] $previewOrigin/cs/motion-preview"
Write-Host "[REMOTE PASS] $previewOrigin/en/motion-preview"
if ($Capture) {
  $env:HD_MOTION_PREVIEW_URL = "$previewOrigin/"
  Exec node @('scripts/qa/capture-motion-preview.mjs')
  Write-Host '[QA OUTPUT] qa-artifacts/motion-preview — screenshots, video and evidence.json'
}
Write-Host '[DONE] Preview only. Production was not merged or deployed.'
