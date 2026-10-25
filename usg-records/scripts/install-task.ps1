#Requires -Version 5.1
#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Registers Windows Task Scheduler tasks for the USG Recorder application.

.DESCRIPTION
    Creates two scheduled tasks:
        1. "USG Recorder - Server"  — starts the Next.js production server at system boot
        2. "USG Recorder - Browser" — waits for the server, then opens the kiosk browser

    Both tasks run under the SYSTEM account so they start before any user logs in.
    The browser task runs under the current user account so it can open a desktop window.

.PARAMETER InstallRoot
    Root directory of the USG Recorder installation.
    Defaults to the parent directory of this script.

.EXAMPLE
    # Run from an elevated PowerShell prompt:
    .\install-task.ps1
    .\install-task.ps1 -InstallRoot "C:\Program Files\USG Recorder"
#>

param(
    [string]$InstallRoot = (Split-Path -Parent $PSScriptRoot)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$TaskFolder   = "USG Recorder"
$ServerScript = Join-Path $InstallRoot "scripts\start-server.ps1"
$BrowserScript= Join-Path $InstallRoot "scripts\launch-browser.ps1"
$NodeExe      = Join-Path $InstallRoot "runtime\node.exe"
$ServerJs     = Join-Path $InstallRoot "app\server.js"

Write-Host "[Install] Install root: $InstallRoot"

# ── Validate paths ─────────────────────────────────────────────────────────────
foreach ($path in @($ServerScript, $BrowserScript)) {
    if (-not (Test-Path $path)) {
        Write-Error "Required script not found: $path"
        exit 1
    }
}

# ── Helper: register a scheduled task ─────────────────────────────────────────
function Register-UsgTask {
    param(
        [string]$TaskName,
        [string]$Description,
        [string]$ScriptPath,
        [string]$RunAsUser,
        [string]$TriggerType = "Startup",
        [int]$DelaySeconds = 0
    )

    $FullTaskName = "$TaskFolder\$TaskName"

    # Remove existing task if present
    if (Get-ScheduledTask -TaskPath "\$TaskFolder\" -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "[Install] Removing existing task: $FullTaskName"
        Unregister-ScheduledTask -TaskPath "\$TaskFolder\" -TaskName $TaskName -Confirm:$false
    }

    $PsArgs = "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`" -InstallRoot `"$InstallRoot`""

    $Action  = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument $PsArgs `
        -WorkingDirectory $InstallRoot

    if ($TriggerType -eq "Logon") {
        $Trigger = New-ScheduledTaskTrigger -AtLogOn
    } else {
        $Trigger = New-ScheduledTaskTrigger -AtStartup
    }

    if ($DelaySeconds -gt 0) {
        $Trigger.Delay = "PT${DelaySeconds}S"
    }

    $Settings = New-ScheduledTaskSettingsSet `
        -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -StartWhenAvailable

    if ($RunAsUser -eq "SYSTEM") {
        $Principal = New-ScheduledTaskPrincipal `
            -UserId $RunAsUser `
            -LogonType ServiceAccount `
            -RunLevel Highest
    } else {
        $Principal = New-ScheduledTaskPrincipal `
            -UserId $RunAsUser `
            -LogonType Interactive `
            -RunLevel Highest
    }

    Register-ScheduledTask `
        -TaskPath "\$TaskFolder\" `
        -TaskName $TaskName `
        -Description $Description `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Force | Out-Null

    Write-Host "[Install] Registered task: $FullTaskName ($TriggerType trigger)"
}

# ── Ensure task folder exists ──────────────────────────────────────────────────
$ScheduleService = New-Object -ComObject Schedule.Service
$ScheduleService.Connect()
$RootFolder = $ScheduleService.GetFolder("\")
try {
    $RootFolder.GetFolder($TaskFolder) | Out-Null
} catch {
    Write-Host "[Install] Creating task folder: \$TaskFolder"
    $RootFolder.CreateFolder($TaskFolder) | Out-Null
}

# ── Task 1: Start the Next.js server at boot ───────────────────────────────────
Register-UsgTask `
    -TaskName     "Server" `
    -Description  "Starts the USG Recorder Next.js production server at Windows boot." `
    -ScriptPath   $ServerScript `
    -RunAsUser    "SYSTEM" `
    -TriggerType  "Startup" `
    -DelaySeconds 10

# ── Task 2: Launch kiosk browser after user logs in ───────────────────────────
# Runs interactively under the logged-in user so the browser window can display on desktop.
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Register-UsgTask `
    -TaskName     "Browser" `
    -Description  "Opens the USG Recorder UI in kiosk mode after the server is ready." `
    -ScriptPath   $BrowserScript `
    -RunAsUser    $CurrentUser `
    -TriggerType  "Logon" `
    -DelaySeconds 5

Write-Host ""
Write-Host "[Install] ✅ Task Scheduler setup complete."
Write-Host "[Install]    Tasks registered under: \$TaskFolder\"
Write-Host "[Install]    The recorder will start automatically on next Windows boot."
Write-Host ""
Write-Host "[Install] To start immediately without rebooting, run:"
Write-Host "          Start-ScheduledTask -TaskPath '\$TaskFolder\' -TaskName 'Server'"
Write-Host "          Start-ScheduledTask -TaskPath '\$TaskFolder\' -TaskName 'Browser'"
