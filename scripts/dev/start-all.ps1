$ErrorActionPreference = "Stop"
$Root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $Root
node scripts/dev/start-all.mjs
