#Requires -Version 5.1
<#
.SYNOPSIS
    Unified startup launcher for USG Recorder.
.DESCRIPTION
    0. Activates Windows Mobile Hotspot (for the USG Remote phone app).
    1. Checks if the Next.js server is already running on port 3000.
    2. If not running, launches bundled Node.js server with file logging.
    3. Polls until port 3000 responds.
    4. Detects Microsoft Edge or Google Chrome.
    5. Launches the browser in fullscreen kiosk mode on the active user desktop.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ── 1. Resolve paths ───────────────────────────────────────────────────────────
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallRoot  = Split-Path -Parent $ScriptDir

$NodeExe      = Join-Path $InstallRoot "runtime\node.exe"
$ServerJs     = Join-Path $InstallRoot "app\server.js"
$EnvFile      = Join-Path $InstallRoot "config\.env"
$Port         = 3000
$RecorderUrl  = "http://localhost:$Port/recorder"

# Determine storage and log directory
$StorageDir = if ($env:STORAGE_DIR) {
    $env:STORAGE_DIR
} elseif ($env:ProgramData) {
    Join-Path $env:ProgramData "USG Recorder\storage"
} else {
    Join-Path $InstallRoot "storage"
}

$LogDir   = Join-Path $StorageDir "logs"
$LogFile  = Join-Path $LogDir "server.log"
$ErrFile  = Join-Path $LogDir "server-error.log"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$LaunchLog = Join-Path $LogDir "launcher.log"
function Log-Msg([string]$msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $msg" | Out-File -FilePath $LaunchLog -Append -Encoding UTF8
}

Log-Msg "Launcher started. InstallRoot: $InstallRoot"

# ── 1b. Activate Mobile Hotspot (non-blocking on failure) ──────────────────────
$HotspotScript = Join-Path $ScriptDir "enable-hotspot.ps1"
if (Test-Path $HotspotScript) {
    try {
        $hotspotResult = & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass `
            -File $HotspotScript -EnvFile $EnvFile 2>&1 | Out-String
        Log-Msg "Hotspot: $($hotspotResult.Trim())"
    } catch {
        Log-Msg "Hotspot: activation failed: $_"
    }
} else {
    Log-Msg "Hotspot: enable-hotspot.ps1 not found, skipping."
}

# ── 2. Check if server is already accepting connections ────────────────────────
function Test-PortOpen([int]$p) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect("127.0.0.1", $p)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

$ServerRunning = Test-PortOpen $Port

if (-not $ServerRunning) {
    Log-Msg "Server is not running. Starting production server..."

    if (-not (Test-Path $NodeExe)) {
        Log-Msg "ERROR: Node runtime not found at: $NodeExe"
        exit 1
    }

    if (-not (Test-Path $ServerJs)) {
        Log-Msg "ERROR: server.js not found at: $ServerJs"
        exit 1
    }

    # Load environment variables from config\.env
    if (Test-Path $EnvFile) {
        Log-Msg "Loading environment from: $EnvFile"
        Get-Content $EnvFile | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith("#")) {
                $parts = $line -split "=", 2
                if ($parts.Count -eq 2) {
                    $k = $parts[0].Trim()
                    $v = $parts[1].Trim().Trim('"').Trim("'")
                    [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
                }
            }
        }
    }

    # Ensure STORAGE_DIR and PORT are set in process
    if (-not [System.Environment]::GetEnvironmentVariable("STORAGE_DIR", "Process")) {
        [System.Environment]::SetEnvironmentVariable("STORAGE_DIR", $StorageDir, "Process")
    }
    [System.Environment]::SetEnvironmentVariable("PORT", "$Port", "Process")

    # Start Node process with redirected stdout and stderr for debugging
    Log-Msg "Launching: $NodeExe $ServerJs"
    Start-Process `
        -FilePath $NodeExe `
        -ArgumentList "`"$ServerJs`"" `
        -WorkingDirectory (Split-Path -Parent $ServerJs) `
        -RedirectStandardOutput $LogFile `
        -RedirectStandardError $ErrFile `
        -WindowStyle Hidden

    # Poll port 3000
    Log-Msg "Waiting for server to become ready on port $Port..."
    $MaxWait = 60
    $Elapsed = 0

    while ($Elapsed -lt $MaxWait) {
        if (Test-PortOpen $Port) {
            $ServerRunning = $true
            Log-Msg "Server is ready on port $Port after $Elapsed seconds."
            break
        }
        Start-Sleep -Milliseconds 1000
        $Elapsed += 1
    }

    if (-not $ServerRunning) {
        Log-Msg "WARNING: Server did not respond on port $Port within $MaxWait seconds. Check $ErrFile."
    }
} else {
    Log-Msg "Server is already running on port $Port."
}

# ── 3. Detect browser ──────────────────────────────────────────────────────────
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

$BrowserExe = $null
$KioskArgs  = $null

foreach ($p in $EdgePaths) {
    if (Test-Path $p) {
        $BrowserExe = $p
        $KioskArgs  = @("--kiosk", $RecorderUrl, "--edge-kiosk-type=fullscreen", "--no-first-run", "--disable-features=TranslateUI")
        Log-Msg "Selected browser: Microsoft Edge ($p)"
        break
    }
}

if (-not $BrowserExe) {
    foreach ($p in $ChromePaths) {
        if (Test-Path $p) {
            $BrowserExe = $p
            $KioskArgs  = @("--kiosk", $RecorderUrl, "--no-first-run", "--disable-features=TranslateUI")
            Log-Msg "Selected browser: Google Chrome ($p)"
            break
        }
    }
}

if (-not $BrowserExe) {
    Log-Msg "ERROR: No supported browser found (Edge or Chrome)."
    [System.Windows.Forms.MessageBox]::Show(
        "USG Recorder requires Microsoft Edge or Google Chrome to be installed.",
        "USG Recorder",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}

# ── 4. Launch browser in kiosk mode ───────────────────────────────────────────
Log-Msg "Launching kiosk browser: $BrowserExe"
Start-Process -FilePath $BrowserExe -ArgumentList $KioskArgs

Log-Msg "Launcher completed successfully."
exit 0
