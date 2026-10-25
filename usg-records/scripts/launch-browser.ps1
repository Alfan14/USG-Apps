    #Requires -Version 5.1
<#
.SYNOPSIS
    Launches the USG Recorder UI in browser kiosk mode.

.DESCRIPTION
    Detects an installed Chromium-based browser in order of preference:
        1. Microsoft Edge
        2. Google Chrome

    Opens http://localhost:3000/recorder in fullscreen kiosk mode.

.NOTES
    Call this script AFTER start-server.ps1 has confirmed the server is ready.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RecorderUrl = "http://localhost:3000/recorder"

# ── Browser detection ──────────────────────────────────────────────────────────
# Check common installation paths for Edge and Chrome on Windows.

$EdgePaths = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)

$ChromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

function Find-Browser {
    param([string[]]$Paths)
    foreach ($p in $Paths) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

$BrowserExe  = $null
$KioskArgs   = $null

$EdgeExe = Find-Browser $EdgePaths
if ($EdgeExe) {
    $BrowserExe = $EdgeExe
    $KioskArgs  = @("--kiosk", $RecorderUrl, "--edge-kiosk-type=fullscreen", "--no-first-run", "--disable-features=TranslateUI")
    Write-Host "[USG Recorder] Browser selected: Microsoft Edge"
    Write-Host "[USG Recorder] Path: $BrowserExe"
} else {
    $ChromeExe = Find-Browser $ChromePaths
    if ($ChromeExe) {
        $BrowserExe = $ChromeExe
        $KioskArgs  = @("--kiosk", $RecorderUrl, "--no-first-run", "--disable-features=TranslateUI")
        Write-Host "[USG Recorder] Browser selected: Google Chrome"
        Write-Host "[USG Recorder] Path: $BrowserExe"
    }
}

if (-not $BrowserExe) {
    Write-Error "[USG Recorder] No supported browser found. Please install Microsoft Edge or Google Chrome."
    exit 1
}

# ── Persist the detected browser path to config ───────────────────────────────
# This allows install-task.ps1 and future scripts to reuse the detected path
# without re-scanning on every launch.
$InstallRoot  = Split-Path -Parent $PSScriptRoot
$ConfigDir    = Join-Path $InstallRoot "config"
$BrowserCache = Join-Path $ConfigDir "browser.txt"

if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
}
$BrowserExe | Set-Content -Path $BrowserCache -Encoding UTF8
Write-Host "[USG Recorder] Browser path cached to: $BrowserCache"

# ── Wait for server to be ready ───────────────────────────────────────────────
Write-Host "[USG Recorder] Waiting for server on port 3000 before launching browser..."
$MaxWait = 60
$Elapsed = 0
$ServerReady = $false

while ($Elapsed -lt $MaxWait) {
    try {
        $TcpClient = New-Object System.Net.Sockets.TcpClient
        $TcpClient.Connect("127.0.0.1", 3000)
        $TcpClient.Close()
        $ServerReady = $true
        break
    } catch {
        Start-Sleep -Milliseconds 1000
        $Elapsed += 1
    }
}

if (-not $ServerReady) {
    Write-Warning "[USG Recorder] Server did not become ready within $MaxWait seconds. Launching browser anyway."
}

# ── Launch browser in kiosk mode ───────────────────────────────────────────────
Write-Host "[USG Recorder] Launching kiosk: $RecorderUrl"

Start-Process -FilePath $BrowserExe -ArgumentList $KioskArgs

exit 0
