#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the USG Recorder Next.js production server.

.DESCRIPTION
    Locates the bundled Node.js runtime and starts the standalone Next.js server.
    Waits until port 3000 is accepting connections before exiting (so that a
    chained launcher script knows the server is ready).

.NOTES
    Expected installation layout (relative to this script's parent directory):
        runtime\node.exe          — bundled Node.js runtime
        app\server.js             — Next.js standalone server entry point
        config\.env               — production environment variables
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Resolve installation root (parent of this script) ──────────────────────────
$InstallRoot = Split-Path -Parent $PSScriptRoot

$NodeExe    = Join-Path $InstallRoot "runtime\node.exe"
$ServerJs   = Join-Path $InstallRoot "app\server.js"
$EnvFile    = Join-Path $InstallRoot "config\.env"

# ── Validate required files ────────────────────────────────────────────────────
if (-not (Test-Path $NodeExe)) {
    Write-Error "Node.js runtime not found at: $NodeExe"
    exit 1
}

if (-not (Test-Path $ServerJs)) {
    Write-Error "Server entry point not found at: $ServerJs"
    exit 1
}

# ── Load environment variables from config\.env ────────────────────────────────
if (Test-Path $EnvFile) {
    Write-Host "[USG Recorder] Loading environment from: $EnvFile"
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        # Skip blank lines and comments
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                $key   = $parts[0].Trim()
                $value = $parts[1].Trim().Trim('"').Trim("'")
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
} else {
    Write-Warning "[USG Recorder] config\.env not found. Using existing environment variables."
}

# ── Set storage directory and production port ──────────────────────────────────
$StorageDir = if ($env:STORAGE_DIR) {
    $env:STORAGE_DIR
} elseif ($env:ProgramData) {
    Join-Path $env:ProgramData "USG Recorder\storage"
} else {
    Join-Path $InstallRoot "storage"
}

$LogDir  = Join-Path $StorageDir "logs"
$LogFile = Join-Path $LogDir "server.log"
$ErrFile = Join-Path $LogDir "server-error.log"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

if (-not [System.Environment]::GetEnvironmentVariable("STORAGE_DIR", "Process")) {
    [System.Environment]::SetEnvironmentVariable("STORAGE_DIR", $StorageDir, "Process")
}

$Port = 3000
$env:PORT = $Port

# ── Start the server ───────────────────────────────────────────────────────────
Write-Host "[USG Recorder] Starting production server on port $Port ..."
Write-Host "[USG Recorder] Node: $NodeExe"
Write-Host "[USG Recorder] Server: $ServerJs"
Write-Host "[USG Recorder] Logs: $LogFile"

$ServerProcess = Start-Process `
    -FilePath $NodeExe `
    -ArgumentList "`"$ServerJs`"" `
    -WorkingDirectory (Split-Path -Parent $ServerJs) `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError $ErrFile `
    -PassThru `
    -NoNewWindow

Write-Host "[USG Recorder] Server process started (PID: $($ServerProcess.Id))"

# ── Wait until port 3000 is accepting connections ─────────────────────────────
Write-Host "[USG Recorder] Waiting for server to be ready on port $Port ..."

$MaxWaitSeconds = 60
$Elapsed        = 0
$Ready          = $false

while ($Elapsed -lt $MaxWaitSeconds) {
    try {
        $TcpClient = New-Object System.Net.Sockets.TcpClient
        $TcpClient.Connect("127.0.0.1", $Port)
        $TcpClient.Close()
        $Ready = $true
        break
    } catch {
        Start-Sleep -Milliseconds 500
        $Elapsed += 0.5
    }
}

if ($Ready) {
    Write-Host "[USG Recorder] Server is ready on http://localhost:$Port"
    exit 0
} else {
    Write-Error "[USG Recorder] Server did not become ready within $MaxWaitSeconds seconds."
    exit 1
}
