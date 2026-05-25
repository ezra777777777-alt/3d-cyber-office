param(
  [int]$Port = 5194,
  [string]$Root = "",
  [string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$OutputDir = "C:\tmp\cyber-office-visual-qa"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path
}

if (-not (Test-Path -LiteralPath $Chrome)) {
  $Chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

if (-not (Test-Path -LiteralPath $Chrome)) {
  throw "No supported browser executable found. Checked Chrome and Edge."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$desktop = Join-Path $OutputDir "desktop-1366x768.png"
$mobile = Join-Path $OutputDir "mobile-390x844.png"
Remove-Item -LiteralPath $desktop, $mobile -Force -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath npm.cmd `
  -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$Port") `
  -WorkingDirectory $Root `
  -WindowStyle Hidden `
  -PassThru

try {
  $ok = $false
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $ok = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $ok) {
    throw "Vite did not respond on port $Port."
  }

  & $Chrome @(
    "--headless=new",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=$OutputDir\chrome-desktop",
    "--window-size=1366,768",
    "--virtual-time-budget=10000",
    "--screenshot=$desktop",
    "http://127.0.0.1:$Port/"
  ) | Out-Null

  & $Chrome @(
    "--headless=new",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=$OutputDir\chrome-mobile",
    "--window-size=390,844",
    "--virtual-time-budget=10000",
    "--screenshot=$mobile",
    "http://127.0.0.1:$Port/"
  ) | Out-Null

  Get-Item -LiteralPath $desktop, $mobile | Select-Object FullName, Length, LastWriteTime
}
finally {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
