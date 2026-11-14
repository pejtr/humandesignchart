# Compatibility entry point: preview validation only. No merge/production path.
param([switch]$PreviewOnly, [switch]$Release)
$ErrorActionPreference = "Stop"
if ($Release) {
  throw "Production release is disabled here. Use -PreviewOnly for isolated preview; release needs separate reviewed evidence."
}
$runner = Join-Path $PSScriptRoot "preview-en-share.mjs"
if ($PreviewOnly) { & node $runner --deploy-preview }
else { & node $runner }
if ($LASTEXITCODE -ne 0) { throw "Preview validation failed (exit $LASTEXITCODE)." }
