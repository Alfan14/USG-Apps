#Requires -Version 5.1
<#
.SYNOPSIS
    Queries, configures, and/or activates the Windows Mobile Hotspot used by
    the USG Remote mobile app.
.DESCRIPTION
    Uses the native Windows 10/11 WinRT tethering API
    (Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager).

    Always prints a single JSON line to stdout:
      {"ok":true,"state":"On","ssid":"MyNet","password":"secret","message":"..."}

    Modes:
      -QueryOnly   Just report current state + credentials. Do NOT start tethering.
      (default)    Apply any given SSID/Password then START tethering if not already on.

.PARAMETER Ssid
    Desired hotspot network name. Optional.
.PARAMETER Password
    Desired hotspot WPA2 passphrase (min 8 chars). Optional.
.PARAMETER EnvFile
    Optional .env file to read HOTSPOT_SSID / HOTSPOT_PASSWORD from when
    -Ssid / -Password are not supplied.
.PARAMETER QueryOnly
    If set, only reads and reports the current hotspot configuration without
    starting tethering.
#>
param(
    [string]$Ssid,
    [string]$Password,
    [string]$EnvFile,
    [switch]$QueryOnly
)

$ErrorActionPreference = "Stop"

function Write-Result([bool]$ok, [string]$state, [string]$ssid, [string]$password, [string]$message) {
    [pscustomobject]@{
        ok       = $ok
        state    = $state
        ssid     = $ssid
        password = $password
        message  = $message
    } | ConvertTo-Json -Compress
}

# ── Read credentials from .env when not passed explicitly ─────────────────────
if ($EnvFile -and (Test-Path $EnvFile)) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                $k = $parts[0].Trim()
                $v = $parts[1].Trim().Trim('"').Trim("'")
                if ($k -eq "HOTSPOT_SSID"     -and -not $Ssid)     { $Ssid     = $v }
                if ($k -eq "HOTSPOT_PASSWORD"  -and -not $Password) { $Password = $v }
            }
        }
    }
}

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime

    # Helpers to await WinRT IAsyncOperation<T> / IAsyncAction from PowerShell
    $asTaskOp = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0]
    $asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction'
    })[0]

    function Await-Op($op, [Type]$resultType) {
        $task = $asTaskOp.MakeGenericMethod($resultType).Invoke($null, @($op))
        $task.Wait(10000) | Out-Null
        return $task.Result
    }
    function Await-Action($action) {
        $task = $asTaskAction.Invoke($null, @($action))
        $task.Wait(10000) | Out-Null
    }

    [void][Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]
    [void][Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]

    # ── 1. Pick the connection profile to share ───────────────────────────────
    $profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
    if (-not $profile) {
        # No internet (e.g. LAN without gateway) — fall back to any connected adapter
        $profile = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles() |
            Where-Object { $_.GetNetworkConnectivityLevel() -ne 'None' } |
            Select-Object -First 1
    }
    if (-not $profile) {
        Write-Result $false "Off" $Ssid "" "No active network connection to share (plug in LAN or connect Wi-Fi)."
        exit 1
    }

    $manager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile)

    # ── 2. Always read current live configuration ─────────────────────────────
    $config      = $manager.GetCurrentAccessPointConfiguration()
    $liveState   = $manager.TetheringOperationalState.ToString()
    $liveSsid    = $config.Ssid
    $livePass    = $config.Passphrase

    # ── 3. QueryOnly: just report and exit ────────────────────────────────────
    if ($QueryOnly) {
        Write-Result $true $liveState $liveSsid $livePass "Hotspot configuration read successfully."
        exit 0
    }

    # ── 4. Apply SSID / password if explicitly overriding ────────────────────
    $needsConfig = ($Ssid -and $liveSsid -ne $Ssid) -or ($Password -and $livePass -ne $Password)
    if ($needsConfig) {
        if ($Password -and $Password.Length -lt 8) {
            Write-Result $false $liveState $liveSsid $livePass "HOTSPOT_PASSWORD must be at least 8 characters."
            exit 1
        }
        if ($Ssid)     { $config.Ssid       = $Ssid }
        if ($Password) { $config.Passphrase = $Password }
        Await-Action ($manager.ConfigureAccessPointAsync($config))
        # Re-read after applying
        $config   = $manager.GetCurrentAccessPointConfiguration()
        $liveSsid = $config.Ssid
        $livePass = $config.Passphrase
    }

    # ── 5. Start tethering if needed ──────────────────────────────────────────
    if ($manager.TetheringOperationalState -ne 'On') {
        $result = Await-Op ($manager.StartTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
        if ($result.Status -ne 'Success') {
            Write-Result $false $manager.TetheringOperationalState.ToString() $liveSsid $livePass "StartTethering failed: $($result.Status) $($result.AdditionalErrorMessage)"
            exit 1
        }
    }

    # ── 6. Ensure Windows Firewall allows hotspot clients to reach port 3000 ──
    # Idempotent: remove the old rule (if any) then add a fresh one.
    $ruleName = "USG Record - Port 3000 (Hotspot)"
    netsh advfirewall firewall delete rule name=$ruleName | Out-Null
    netsh advfirewall firewall add rule `
        name=$ruleName `
        dir=in `
        action=allow `
        protocol=TCP `
        localport=3000 `
        profile=private,public `
        remoteip=192.168.137.0/24 | Out-Null

    Write-Result $true $manager.TetheringOperationalState.ToString() $liveSsid $livePass "Mobile Hotspot is on."
    exit 0
} catch {
    Write-Result $false "Unknown" $Ssid "" "Hotspot error: $($_.Exception.Message)"
    exit 1
}
