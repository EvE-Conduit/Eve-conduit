<#
.SYNOPSIS
    Builds dist\EvE-Conduit-Setup-<version>.exe, the graphical Windows installer.

.DESCRIPTION
    Needs the Windows release zip (dist\eve-conduit-<version>-windows.zip, made by windows/build-release.sh
    on Linux, macOS, WSL or the release workflow) and Inno Setup 6.3 or newer. When ISCC.exe isn't found
    and Chocolatey is available, Inno Setup is installed with "choco install innosetup -y".

        pwsh windows/installer/build.ps1                     # version from backend/pyproject.toml
        pwsh windows/installer/build.ps1 -Zip path\to\eve-conduit-0.4.0-windows.zip

    Code signing: when CONDUIT_SIGN_CERT (path to a .pfx) is set, the setup is signed with signtool,
    using CONDUIT_SIGN_PASSWORD and CONDUIT_SIGN_TIMESTAMP (default http://timestamp.digicert.com).
#>
[CmdletBinding()]
param(
    [string]$Zip = '',
    [string]$Version = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$dist = Join-Path $repo 'dist'

if (-not $Version) {
    $match = Select-String -LiteralPath (Join-Path $repo 'backend\pyproject.toml') -Pattern '^version\s*=\s*"([^"]+)"' | Select-Object -First 1
    if (-not $match) { throw 'Could not read the version from backend/pyproject.toml; pass -Version.' }
    $Version = $match.Matches[0].Groups[1].Value
}
if (-not $Zip) { $Zip = Join-Path $dist "eve-conduit-$Version-windows.zip" }
if (-not (Test-Path -LiteralPath $Zip)) {
    throw "Release zip not found: $Zip. Build it first with: bash windows/build-release.sh"
}
$Zip = (Resolve-Path -LiteralPath $Zip).Path

function Find-Iscc {
    $command = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    foreach ($base in @(${env:ProgramFiles(x86)}, $env:ProgramFiles)) {
        if (-not $base) { continue }
        $candidate = Join-Path $base 'Inno Setup 6\ISCC.exe'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    return $null
}

$iscc = Find-Iscc
if (-not $iscc) {
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        throw 'Inno Setup 6 (ISCC.exe) not found. Install it from https://jrsoftware.org/isdl.php or with: choco install innosetup -y'
    }
    Write-Host 'Installing Inno Setup with Chocolatey...'
    & choco install innosetup -y --no-progress
    if ($LASTEXITCODE -ne 0) { throw 'choco install innosetup failed' }
    $iscc = Find-Iscc
    if (-not $iscc) { throw 'Inno Setup was installed but ISCC.exe still could not be found.' }
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Write-Host "Building EvE-Conduit-Setup-$Version.exe with $iscc"
& $iscc "/DAppVersion=$Version" "/DReleaseZip=$Zip" "/O$dist" (Join-Path $PSScriptRoot 'conduit.iss')
if ($LASTEXITCODE -ne 0) { throw "ISCC failed (exit code $LASTEXITCODE)" }
$setup = Join-Path $dist "EvE-Conduit-Setup-$Version.exe"
if (-not (Test-Path -LiteralPath $setup)) { throw "ISCC finished but $setup is missing." }

if ($env:CONDUIT_SIGN_CERT) {
    $signtool = Get-Command signtool.exe -ErrorAction SilentlyContinue
    if (-not $signtool) {
        $signtool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1
    }
    if (-not $signtool) { throw 'CONDUIT_SIGN_CERT is set but signtool.exe was not found (Windows SDK).' }
    $timestamp = if ($env:CONDUIT_SIGN_TIMESTAMP) { $env:CONDUIT_SIGN_TIMESTAMP } else { 'http://timestamp.digicert.com' }
    $path = if ($signtool -is [System.Management.Automation.CommandInfo]) { $signtool.Source } else { $signtool.FullName }
    & $path sign /f $env:CONDUIT_SIGN_CERT /p $env:CONDUIT_SIGN_PASSWORD /fd SHA256 /tr $timestamp /td SHA256 /d 'EvE Conduit Setup' $setup
    if ($LASTEXITCODE -ne 0) { throw 'Signing the setup failed' }
}

Write-Host "Built $setup"
Write-Output $setup
