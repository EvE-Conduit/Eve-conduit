#Requires -Version 5.1
<#
.SYNOPSIS
    Run by the graphical installer (EvE-Conduit-Setup-X.Y.Z.exe); not meant to be run by hand.

.DESCRIPTION
    -Mode Check    validates the wizard's answers (folder, domain, ports) and prints one "PROBLEM: ..."
                   line per issue; exit code 0 when there are none, 2 when there are.
    -Mode Install  unpacks the release zip next to this script and runs windows\install.ps1 with the
                   answers (non-interactive), then writes the result file for the finish page.
    -Mode Upgrade  runs "<install folder>\conduit.ps1 upgrade <zip>" on an existing install.

    The answers come in -ValuesFile ("Key=Value" lines, see ConduitSetup.psm1), which is deleted as soon
    as it's read because it can hold the EVE application secret.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('Check', 'Install', 'Upgrade')][string]$Mode,
    [Parameter(Mandatory)][string]$ValuesFile,
    [string]$Zip = '',
    [string]$ResultFile = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Import-Module (Join-Path $PSScriptRoot 'Conduit.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'ConduitSetup.psm1') -Force

$values = Read-SetupValue $ValuesFile
if ($Mode -ne 'Check') { Remove-Item -LiteralPath $ValuesFile -Force -ErrorAction SilentlyContinue }

function Get-DriveProblem([string]$Path) {
    <# Checks that need the real machine: local fixed drive, free space, empty or new folder. #>
    $drive = New-Object System.IO.DriveInfo ($Path.Substring(0, 1))
    if (-not $drive.IsReady) { return "Drive $($drive.Name) doesn't exist or isn't ready." }
    if ($drive.DriveType -ne [System.IO.DriveType]::Fixed) { return "Drive $($drive.Name) is a $($drive.DriveType.ToString().ToLower()) drive; use a fixed local disk." }
    $freeGb = [math]::Round($drive.AvailableFreeSpace / 1GB, 1)
    if ($freeGb -lt 5) { return "Drive $($drive.Name) has only $freeGb GB free; EvE Conduit needs at least 5 GB." }
    if (Test-Path -LiteralPath (Join-Path $Path 'config\conduit.env')) { return "EvE Conduit is already installed in $Path." }
    if ((Test-Path -LiteralPath $Path) -and (Get-ChildItem -LiteralPath $Path -Force | Select-Object -First 1)) {
        return "$Path already contains files. Choose an empty or new folder; the installer locks down its permissions."
    }
    return $null
}

function Expand-Release([string]$ZipPath) {
    <# Unpacks the release zip into a fresh folder beside this script; returns the release folder. #>
    $target = Join-Path $PSScriptRoot 'release'
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $target
    $inner = @(Get-ChildItem -LiteralPath $target -Directory)
    if ($inner.Count -ne 1) { throw 'The bundled release zip has an unexpected layout (expected one top-level folder).' }
    return $inner[0].FullName
}

switch ($Mode) {
    'Check' {
        $excluded = @()
        try { $excluded = ConvertFrom-ExcludedPortRange (& netsh.exe interface ipv4 show excludedportrange protocol=tcp) } catch { $excluded = @() }
        $problems = @(Get-SetupProblem -Values $values -Taken (Get-ListeningPort) -Excluded $excluded)
        $root = Format-InstallRoot ([string]$values['InstallRoot'])
        if (-not (Get-InstallRootProblem $root)) {
            $driveProblem = Get-DriveProblem $root
            if ($driveProblem) { $problems += $driveProblem }
        }
        if (Get-Service -Name 'conduit-web' -ErrorAction SilentlyContinue) {
            $problems += "EvE Conduit is already installed on this machine (service conduit-web exists)."
        }
        $lines = @(ConvertTo-ProblemLine $problems)
        foreach ($line in $lines) { Write-Output $line }
        if ($lines.Count) { exit 2 }
        exit 0
    }
    'Install' {
        if (-not (Test-Path -LiteralPath $Zip)) { throw "Release zip not found: $Zip" }
        $release = Expand-Release $Zip
        $named = ConvertTo-InstallArgument $values
        if ($ResultFile) { $named['ResultFile'] = $ResultFile }
        & (Join-Path $release 'windows\install.ps1') @named
    }
    'Upgrade' {
        $root = Format-InstallRoot ([string]$values['InstallRoot'])
        $command = Join-Path $root 'conduit.ps1'
        if (-not (Test-Path -LiteralPath $command)) { throw "No EvE Conduit install found in $root (conduit.ps1 is missing)." }
        if (-not (Test-Path -LiteralPath $Zip)) { throw "Release zip not found: $Zip" }
        Write-Output '==> Upgrading EvE Conduit (backup, install, database update, restart)'
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $command upgrade $Zip
        if ($LASTEXITCODE -ne 0) { throw "conduit upgrade failed (exit code $LASTEXITCODE)" }
        if ($ResultFile) {
            $envFile = Read-EnvFile (Join-Path $root 'config\conduit.env')
            $version = (Get-Content -LiteralPath (Join-Path $root 'app\VERSION') -TotalCount 1 -ErrorAction SilentlyContinue)
            $result = [ordered]@{ Version = $version; Root = $root; SiteUrl = $envFile['CONDUIT_SITE_URL']; SetupCode = '' }
            [IO.File]::WriteAllLines($ResultFile, (Format-SetupResult $result))
        }
    }
}
