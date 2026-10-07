#Requires -Version 5.1
<#
.SYNOPSIS
    Removes EvE Conduit from this Windows machine.

.DESCRIPTION
    Undoes everything install.ps1 did: stops and removes the EvE Conduit services, closes the tray panel,
    removes the firewall rule, the PATH entry, the sign-in entry for the tray panel and the
    "Apps & features" entry, then deletes the install folder.

    Start it from "Apps & features", with "conduit uninstall", or directly:
        powershell -ExecutionPolicy Bypass -File <install folder>\uninstall.ps1

    It asks what to do:
      1. Remove everything, including the database (offers to save a backup somewhere else first)
      2. Remove the programs but keep config, data and backups in the install folder
      3. Cancel

.PARAMETER Mode
    All or KeepData, to skip the question.
.PARAMETER BackupTo
    Folder (outside the install folder) to save a final backup to before removing everything.
.PARAMETER NoBackup
    Don't offer a backup.
.PARAMETER Yes
    Don't ask anything (needs -Mode).
.PARAMETER Root
    The install folder, if this script was copied elsewhere.
#>
[CmdletBinding()]
param(
    [ValidateSet('', 'All', 'KeepData')][string]$Mode = '',
    [string]$BackupTo = '',
    [switch]$NoBackup,
    [switch]$Yes,
    [string]$Root = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# --- find the install ---------------------------------------------------------------------------------
$uninstallKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\EveConduit'
function Test-InstallFolder([string]$Path) {
    <# A complete install has config\conduit.env; one that failed part-way may only have some of these. #>
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return $false }
    foreach ($marker in @('config\conduit.env', 'services', 'releases', 'Conduit.psm1')) {
        if (Test-Path -LiteralPath (Join-Path $Path $marker)) { return $true }
    }
    return $false
}
if (-not $Root) {
    if (Test-InstallFolder $PSScriptRoot) { $Root = $PSScriptRoot }
    elseif ($env:CONDUIT_ROOT) { $Root = $env:CONDUIT_ROOT }
    elseif (Test-Path $uninstallKey) { $Root = (Get-ItemProperty $uninstallKey).InstallLocation }
}
if (-not (Test-InstallFolder $Root)) {
    throw 'Could not find an EvE Conduit installation. Pass -Root <install folder>.'
}
$Root = (Resolve-Path -LiteralPath $Root).Path.TrimEnd('\')

# --- administrator rights (Apps & features starts us without them) --------------------------------------
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', "`"$PSCommandPath`"", '-Root', "`"$Root`"")
    if ($Mode) { $argList += @('-Mode', $Mode) }
    if ($BackupTo) { $argList += @('-BackupTo', "`"$BackupTo`"") }
    if ($NoBackup) { $argList += '-NoBackup' }
    if ($Yes) { $argList += '-Yes' }
    Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs
    exit 0
}

# The module lives next to us in the install folder, or in windows\scripts in a release folder.
# An install that failed early may only have it inside a release folder.
$candidates = @((Join-Path $PSScriptRoot 'Conduit.psm1'), (Join-Path $PSScriptRoot 'scripts\Conduit.psm1'), (Join-Path $Root 'Conduit.psm1'))
$candidates += @(Get-ChildItem -LiteralPath (Join-Path $Root 'releases') -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName 'windows\scripts\Conduit.psm1' })
$module = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $module) { throw 'Conduit.psm1 not found next to this script or in the install folder.' }
Import-Module $module -Force
$p = Get-ConduitPath $Root

$services = @(Get-ConduitServiceId | Where-Object { Get-Service -Name $_ -ErrorAction SilentlyContinue })
$version = if (Test-Path (Join-Path $p.App 'VERSION')) { (Get-Content (Join-Path $p.App 'VERSION') -TotalCount 1).Trim() } else { '?' }

Write-Host ''
Write-Host "EvE Conduit $version is installed in $Root" -ForegroundColor Cyan
Write-Host "Services: $(if ($services) { $services -join ', ' } else { 'none' })"
Write-Host ''

# --- what to do ---------------------------------------------------------------------------------------------
if (-not $Mode) {
    if ($Yes) { throw 'With -Yes, also pass -Mode All or -Mode KeepData.' }
    Write-Host 'What do you want to remove?'
    Write-Host '  1. Everything, including the database (you can save a backup first)'
    Write-Host '  2. The programs only; keep config, data and backups in the install folder'
    Write-Host '  3. Cancel'
    switch ((Read-Host 'Choose 1, 2 or 3').Trim()) {
        '1' { $Mode = 'All' }
        '2' { $Mode = 'KeepData' }
        default { Write-Host 'Nothing was changed.'; exit 0 }
    }
}

$backupFile = ''
if ($Mode -eq 'All' -and -not $NoBackup) {
    $wantBackup = $true
    if (-not $BackupTo -and -not $Yes) {
        $wantBackup = (Read-Host 'Save a backup of the database and settings first? [Y/n]') -notmatch '^[Nn]'
        if ($wantBackup) {
            $default = [Environment]::GetFolderPath('Desktop')
            $answer = Read-Host "Folder to save it in (outside $Root) [$default]"
            $BackupTo = if ($answer.Trim()) { $answer.Trim().Trim('"') } else { $default }
        }
    }
    if ($wantBackup -and $BackupTo) {
        $fullBackup = [IO.Path]::GetFullPath($BackupTo).TrimEnd('\')
        if ($fullBackup -eq $Root -or $fullBackup.StartsWith("$Root\", [StringComparison]::OrdinalIgnoreCase)) {
            throw "The backup folder must be outside $Root, which is about to be deleted."
        }
        New-Item -ItemType Directory -Force -Path $fullBackup | Out-Null
        Write-Host 'Making a backup (the database must still be running)...'
        $before = @(Get-ChildItem -LiteralPath $p.Backups -Filter *.zip -ErrorAction SilentlyContinue | ForEach-Object FullName)
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'conduit.ps1') backup
        $new = @(Get-ChildItem -LiteralPath $p.Backups -Filter *.zip | Where-Object { $before -notcontains $_.FullName } | Sort-Object LastWriteTime -Descending)
        if (-not $new) { throw 'The backup failed, so nothing was removed. Fix the problem above, or run again with -NoBackup.' }
        $backupFile = Join-Path $fullBackup $new[0].Name
        Copy-Item -LiteralPath $new[0].FullName -Destination $backupFile
        Write-Host "Backup saved to $backupFile" -ForegroundColor Green
    }
}

if (-not $Yes) {
    if ($Mode -eq 'All') {
        Write-Host ''
        Write-Host "This permanently deletes $Root, including the database." -ForegroundColor Yellow
        if ((Read-Host 'Type DELETE to continue').Trim() -cne 'DELETE') { Write-Host 'Nothing was changed.'; exit 0 }
    }
    elseif ((Read-Host "Remove the EvE Conduit programs and services, keeping $Root\config, data and backups? [y/N]") -notmatch '^[Yy]$') {
        Write-Host 'Nothing was changed.'
        exit 0
    }
}

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }
$problems = New-Object System.Collections.Generic.List[string]

# --- 1. tray panels (one per signed-in user) -------------------------------------------------------------------
Write-Step 'Closing the tray panel'
$trayScript = Join-Path $p.Root 'tray\ConduitTray.ps1'
foreach ($proc in Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' OR Name = 'pwsh.exe'") {
    if ($proc.CommandLine -and $proc.CommandLine.IndexOf($trayScript, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'EvE Conduit Tray' -ErrorAction SilentlyContinue
Unregister-ConduitUpdater

# --- 2. services, last-started first ----------------------------------------------------------------------------
Write-Step 'Stopping and removing services'
$reverse = @($services)
[array]::Reverse($reverse)
foreach ($id in $reverse) {
    try { Stop-Service -Name $id -Force -ErrorAction Stop } catch { $problems.Add("Could not stop ${id}: $($_.Exception.Message)") }
}
foreach ($id in $reverse) {
    $wrapper = Join-Path $p.Services "$id.exe"
    if (Test-Path -LiteralPath $wrapper) { & $wrapper uninstall | Out-Null }
    if (Get-Service -Name $id -ErrorAction SilentlyContinue) { & sc.exe delete $id | Out-Null }
    for ($i = 0; $i -lt 20 -and (Get-Service -Name $id -ErrorAction SilentlyContinue); $i++) { Start-Sleep -Milliseconds 500 }
    if (Get-Service -Name $id -ErrorAction SilentlyContinue) { $problems.Add("Service $id is marked for removal; it disappears after a restart.") }
}

# --- 3. Windows registrations ----------------------------------------------------------------------------------
Write-Step 'Removing the firewall rule, PATH entry and Apps & features entry'
foreach ($name in @('EvE Conduit web', 'EvE Conduit HTTP/HTTPS')) {
    Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue | Remove-NetFirewallRule
}
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = Remove-PathEntry -PathValue $machinePath -Entry $Root
if ($newPath -ne $machinePath) { [Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine') }
Remove-Item -Path $uninstallKey -Recurse -ErrorAction SilentlyContinue

# --- 4. files ---------------------------------------------------------------------------------------------------
Set-Location -LiteralPath $env:SystemRoot   # we can't delete a folder we're standing in
if (Test-Path -LiteralPath $p.App) {
    # Remove the junction itself first; recursive deletes must never follow it.
    [IO.Directory]::Delete($p.App, $false)
}
if ($Mode -eq 'All') {
    Write-Step "Deleting $Root"
    & cmd.exe /c rmdir /s /q "`"$Root`""
    if (Test-Path -LiteralPath $Root) { $problems.Add("Some files in $Root are still in use; delete the folder after a restart.") }
}
else {
    Write-Step "Deleting the programs from $Root (keeping config, data and backups)"
    $keep = @('config', 'data', 'backups')
    foreach ($item in Get-ChildItem -LiteralPath $Root -Force) {
        if ($keep -contains $item.Name) { continue }
        if ($item.PSIsContainer) { & cmd.exe /c rmdir /s /q "`"$($item.FullName)`"" }
        else { Remove-Item -LiteralPath $item.FullName -Force -ErrorAction SilentlyContinue }
        if (Test-Path -LiteralPath $item.FullName) { $problems.Add("Could not delete $($item.FullName) (in use?)") }
    }
}

# --- done ----------------------------------------------------------------------------------------------------------
Write-Host ''
if ($problems.Count) {
    Write-Host 'EvE Conduit was removed, with these leftovers:' -ForegroundColor Yellow
    foreach ($problem in $problems) { Write-Host "  - $problem" -ForegroundColor Yellow }
}
else {
    Write-Host 'EvE Conduit was removed.' -ForegroundColor Green
}
if ($Mode -eq 'KeepData') {
    Write-Host "Kept in ${Root}: config (settings and passwords), data (database files) and backups."
    Write-Host 'To use them again, install EvE Conduit into a new folder and restore a backup.'
}
if ($backupFile) { Write-Host "Your final backup: $backupFile" }
