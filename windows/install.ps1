#Requires -Version 5.1
#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Installs EvE Conduit natively on Windows, entirely inside one folder.

.DESCRIPTION
    Run from an unpacked Windows release (eve-conduit-X.Y.Z-windows.zip), in an Administrator PowerShell:

        Set-ExecutionPolicy -Scope Process Bypass
        .\windows\install.ps1 -Domain auth.example.com -Email you@example.com

    It asks where to install (suggesting C:\EvE-Conduit) and which port each service should use.
    Everything is installed into, and runs from, that folder: Python, PostgreSQL or MariaDB, Garnet
    (Redis-compatible cache/queue) with its own .NET runtime, Caddy (web server + HTTPS) and the WinSW
    service wrappers. Nothing goes to Program Files; winget isn't used. Every download is checked
    against a pinned SHA-256. Outside the folder only Windows' own registrations change: the services,
    one firewall rule and the PATH entry for the conduit command.

    See windows\README.md for what each step does and how to do it by hand.

.PARAMETER Domain
    Public hostname. Use with a DNS record pointing at this machine for automatic HTTPS.
.PARAMETER Email
    Contact address for Let's Encrypt and CCP's ESI user agent.
.PARAMETER Database
    Postgres (default, recommended) or MariaDB, installed portably into the install folder.
.PARAMETER DatabaseUrl
    Use an existing database server instead, e.g. postgres://conduit:PASSWORD@127.0.0.1:5432/conduit
.PARAMETER NoTls
    Serve plain HTTP (for a LAN, or when another proxy terminates HTTPS).
.PARAMETER InstallRoot
    Folder to install into, e.g. D:\EvE-Conduit. If omitted you're asked. Required together with -Yes.
.PARAMETER HttpPort
    Port Caddy listens on for HTTP (default 80). Asked if omitted.
.PARAMETER HttpsPort
    Port Caddy listens on for HTTPS (default 443). Asked if omitted.
.PARAMETER AppPort
    Local port of the EvE Conduit web application, behind Caddy (default 8000). Asked if omitted.
.PARAMETER CachePort
    Local port of Garnet, the cache and task queue (default 6379). Asked if omitted.
.PARAMETER DatabasePort
    Local port of the database server (default 5432 PostgreSQL, 3306 MariaDB). Asked if omitted.
.PARAMETER PublicPorts
    Only matters when the web ports aren't 80/443. 'Standard': your router forwards public ports 80/443
    to them, so the site stays at https://domain. 'AsChosen': people use the chosen ports directly
    (https://domain:port). Asked if omitted.
.PARAMETER NoTray
    Don't start the tray control panel at sign-in (start it any time with "conduit tray").
.PARAMETER Yes
    Don't ask any questions (needs -InstallRoot; ports not given use the defaults).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Domain,
    [Parameter(Mandatory)][string]$Email,
    [ValidateSet('Postgres', 'MariaDB')][string]$Database = 'Postgres',
    [string]$DatabaseUrl = '',
    [string]$EsiClientId = '',
    [string]$EsiSecret = '',
    [switch]$NoTls,
    [string]$InstallRoot = '',
    [int]$HttpPort = 0,
    [int]$HttpsPort = 0,
    [int]$AppPort = 0,
    [int]$CachePort = 0,
    [int]$DatabasePort = 0,
    [ValidateSet('', 'Standard', 'AsChosen')][string]$PublicPorts = '',
    [switch]$NoTray,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Import-Module (Join-Path $PSScriptRoot 'scripts\Conduit.psm1') -Force

$script:StepNumber = 0
$script:StepTotal = 0
$script:InstallStart = $null
function Write-Step([string]$Message) {
    <# "==> [3/14] Installing Python ...   (1:05)": step number and time since the install started. #>
    $script:StepNumber++
    $elapsed = (Get-Date) - $script:InstallStart
    Write-Host "`n==> [$($script:StepNumber)/$($script:StepTotal)] $Message" -ForegroundColor Cyan -NoNewline
    Write-Host ("   ({0}:{1:00})" -f [int][math]::Floor($elapsed.TotalMinutes), $elapsed.Seconds) -ForegroundColor DarkGray
}

function Save-Component([string]$Name, [string]$Destination) {
    <# Invoke-ConduitDownload with a line per file, so long downloads don't look like a hang. #>
    Write-Host "  $Name ... " -NoNewline
    $started = Get-Date
    Invoke-ConduitDownload -Name $Name -Destination $Destination
    $mb = (Get-Item -LiteralPath $Destination).Length / 1MB
    Write-Host ("{0:N0} MB in {1:N0}s" -f $mb, ((Get-Date) - $started).TotalSeconds)
}

function Get-InstallRootDriveProblem([string]$Path) {
    <# Checks that need the real machine: local fixed drive, free space, empty or new folder. #>
    # The release is copied into the install folder, so one can't contain the other (it would copy itself forever).
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\') + '\'
    $release = [IO.Path]::GetFullPath($releaseDir).TrimEnd('\') + '\'
    if ($full.StartsWith($release, [StringComparison]::OrdinalIgnoreCase) -or $release.StartsWith($full, [StringComparison]::OrdinalIgnoreCase)) {
        return "Choose a folder outside the unpacked release ($($release.TrimEnd('\'))), for example C:\EvE-Conduit."
    }
    $drive = New-Object System.IO.DriveInfo ($Path.Substring(0, 1))
    if (-not $drive.IsReady) { return "Drive $($drive.Name) doesn't exist or isn't ready." }
    if ($drive.DriveType -ne [System.IO.DriveType]::Fixed) { return "Drive $($drive.Name) is a $($drive.DriveType.ToString().ToLower()) drive; use a fixed local disk." }
    $freeGb = [math]::Round($drive.AvailableFreeSpace / 1GB, 1)
    if ($freeGb -lt 5) { return "Drive $($drive.Name) has only $freeGb GB free; EvE Conduit needs at least 5 GB." }
    if (Test-Path -LiteralPath (Join-Path $Path 'config\conduit.env')) { return "EvE Conduit is already installed in $Path. Use 'conduit upgrade <zip>' instead." }
    if ((Test-Path -LiteralPath $Path) -and (Get-ChildItem -LiteralPath $Path -Force | Select-Object -First 1)) {
        return "$Path already contains files. Choose an empty or new folder; the installer locks down its permissions."
    }
    return $null
}

function Read-InstallRoot {
    $default = Get-DefaultInstallRoot
    Write-Host ''
    Write-Host 'Where should EvE Conduit be installed?' -ForegroundColor Cyan
    Write-Host 'Everything is installed into and runs from this folder: EvE Conduit, Python, the database,'
    Write-Host 'the cache, the web server, settings, logs and backups.'
    while ($true) {
        $answer = Read-Host "Install folder [$default]"
        $candidate = if ($answer.Trim()) { Format-InstallRoot $answer } else { $default }
        $problem = Get-InstallRootProblem $candidate
        if (-not $problem) { $problem = Get-InstallRootDriveProblem $candidate }
        if (-not $problem) { return $candidate }
        Write-Host "  $problem" -ForegroundColor Yellow
    }
}

function Read-Port([string]$Prompt, [int]$Default) {
    while ($true) {
        $answer = (Read-Host "  $Prompt [$Default]").Trim()
        if (-not $answer) { return $Default }
        $value = 0
        if ([int]::TryParse($answer, [ref]$value) -and $value -ge 1 -and $value -le 65535) { return $value }
        Write-Host '    Enter a number from 1 to 65535.' -ForegroundColor Yellow
    }
}

function Get-ExcludedPortRange {
    <# Port ranges Windows reserves (Hyper-V, WSL, Docker); they can't be used even when free. #>
    try { return ConvertFrom-ExcludedPortRange (& netsh.exe interface ipv4 show excludedportrange protocol=tcp) }
    catch { return @() }
}

# --- checks ---------------------------------------------------------------------------------------
$releaseDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$version = Get-ReleaseVersion $releaseDir
if (-not (Test-Path (Join-Path $releaseDir 'web\index.html'))) { throw 'Run this from an unpacked Windows release (web\ is missing).' }
if (-not [Environment]::Is64BitOperatingSystem) { throw 'EvE Conduit needs 64-bit Windows.' }
if ([Environment]::OSVersion.Version.Build -lt 17763) { throw 'EvE Conduit needs Windows 10 1809 / Windows Server 2019 or newer.' }
$Domain = $Domain.Trim() -replace '^[A-Za-z]+://', '' -replace '/+$', ''   # accept a pasted URL
if ($Domain -notmatch '^[A-Za-z0-9.-]+$') { throw "'$Domain' doesn't look like a hostname. Pass just the name, e.g. -Domain auth.example.com (no https://, port or path)." }
if (Get-Service -Name 'conduit-web' -ErrorAction SilentlyContinue) {
    throw "EvE Conduit is already installed on this machine (service conduit-web exists). Use 'conduit upgrade <zip>' instead."
}
$installDb = -not $DatabaseUrl

# --- 1. where ---------------------------------------------------------------------------------------
if ($InstallRoot) {
    $InstallRoot = Format-InstallRoot $InstallRoot
    $problem = Get-InstallRootProblem $InstallRoot
    if (-not $problem) { $problem = Get-InstallRootDriveProblem $InstallRoot }
    if ($problem) { throw "-InstallRoot ${InstallRoot}: $problem" }
}
elseif ($Yes) {
    throw 'With -Yes nothing is asked, so also say where to install: -InstallRoot C:\EvE-Conduit (or another folder).'
}
else {
    $InstallRoot = Read-InstallRoot
}
$p = Get-ConduitPath $InstallRoot

# --- 2. ports ---------------------------------------------------------------------------------------
$defaults = Get-DefaultPort
$dbDefault = if ($Database -eq 'MariaDB') { $defaults.MariaDB } else { $defaults.Postgres }
$given = @{ Http = $HttpPort; Https = $HttpsPort; App = $AppPort; Cache = $CachePort; Database = $DatabasePort }
$labels = [ordered]@{
    Http     = @("Web server, HTTP (public)", $defaults.Http)
    Https    = @("Web server, HTTPS (public)", $defaults.Https)
    App      = @("EvE Conduit application (this machine only)", $defaults.App)
    Cache    = @("Garnet cache and task queue (this machine only)", $defaults.Cache)
    Database = @("$Database database (this machine only)", $dbDefault)
}
$wanted = @('Http', 'App', 'Cache')
if (-not $NoTls) { $wanted = @('Http', 'Https', 'App', 'Cache') }
if ($installDb) { $wanted += 'Database' }

$taken = Get-ListeningPort
$excluded = Get-ExcludedPortRange
$ports = [ordered]@{}
$ask = -not $Yes -and @($wanted | Where-Object { -not $given[$_] }).Count -gt 0
if ($ask) {
    Write-Host ''
    Write-Host 'Which ports should EvE Conduit use? Press Enter to keep the suggested port.' -ForegroundColor Cyan
}
while ($true) {
    foreach ($name in $wanted) {
        if ($given[$name]) { $ports[$name] = $given[$name] }
        elseif ($ask) { $ports[$name] = Read-Port $labels[$name][0] $labels[$name][1] }
        else { $ports[$name] = $labels[$name][1] }
    }
    $problems = Get-PortProblem -Ports $ports -Taken $taken -Excluded $excluded
    if (-not $problems) { break }
    foreach ($problem in $problems) { Write-Host "  $problem" -ForegroundColor Yellow }
    if (-not $ask) { throw 'Choose other ports (see above) with -HttpPort, -HttpsPort, -AppPort, -CachePort or -DatabasePort.' }
    Write-Host '  Please choose again.' -ForegroundColor Yellow
    foreach ($name in @($given.Keys)) { $given[$name] = 0 }
}
if (-not $ports.Contains('Https')) { $ports['Https'] = $defaults.Https }  # unused with -NoTls

$standardPublic = $true
$customWeb = ($ports.Http -ne 80) -or (-not $NoTls -and $ports.Https -ne 443)
if ($customWeb) {
    if ($PublicPorts) { $standardPublic = $PublicPorts -eq 'Standard' }
    elseif ($Yes) { throw 'The web ports are not 80/443, so also pass -PublicPorts Standard (your router forwards 80/443 to them) or -PublicPorts AsChosen.' }
    else {
        Write-Host ''
        Write-Host 'Your web ports are not the standard 80/443.' -ForegroundColor Cyan
        Write-Host '  Y: my router/firewall forwards public ports 80 and 443 to them, so the site is https://' -NoNewline
        Write-Host $Domain
        Write-Host '  N: people will use these ports directly, e.g. https://' -NoNewline
        Write-Host "${Domain}:$($ports.Https)"
        $answer = Read-Host 'Does your router forward the standard ports 80/443 to these? [Y/n]'
        $standardPublic = $answer -notmatch '^[Nn]'
    }
}
$siteUrl = Get-PublicSiteUrl -Domain $Domain -HttpPort $ports.Http -HttpsPort $ports.Https -NoTls:$NoTls -StandardPublicPorts:$standardPublic
if ($customWeb -and -not $NoTls -and -not $standardPublic -and $ports.Http -ne 80 -and $ports.Https -ne 443) {
    Write-Warning ("Let's Encrypt checks your domain on public port 80 or 443. With neither reachable it can't " +
        'issue a certificate. Forward one of them, or use -NoTls behind another proxy.')
}

# --- 3. confirm ---------------------------------------------------------------------------------------
Write-Host ''
Write-Host "Installing EvE Conduit $version"
Write-Host "  folder:    $InstallRoot"
Write-Host "  site:      $siteUrl"
Write-Host "  database:  $(if ($installDb) { "$Database in the install folder, port $($ports.Database)" } else { 'existing server (-DatabaseUrl)' })"
$portSummary = "HTTP $($ports.Http)"
if (-not $NoTls) { $portSummary += ", HTTPS $($ports.Https)" }
Write-Host "  ports:     $portSummary, app $($ports.App), cache $($ports.Cache)"
if (-not $Yes) {
    $answer = Read-Host 'Continue? [y/N]'
    if ($answer -notmatch '^[Yy]$') { exit 1 }
}

# Server Core has no desktop (and no Windows Forms), so there's no tray to sit in.
$hasDesktop = $true
try { Add-Type -AssemblyName System.Windows.Forms } catch { $hasDesktop = $false }
$showTray = -not $NoTray -and $hasDesktop
# Keep in step with the Write-Step calls below: 11 always, plus the database ones and the tray.
$script:StepTotal = 11 + $(if ($installDb) { 2 } else { 0 }) + $(if ($showTray) { 1 } else { 0 })
$script:InstallStart = Get-Date

# GitHub needs TLS 1.2; older Windows PowerShell defaults may not offer it.
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# --- 4. folders and downloads -------------------------------------------------------------------------
Write-Step 'Creating folders'
foreach ($dir in @($p.Root, $p.Releases, $p.Bin, $p.Config, $p.Data, $p.Static, $p.Logs, $p.Backups, $p.Services, $p.Cache, $p.Tmp, (Join-Path $p.Data 'caddy'))) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
# Keep every download and cache inside the install folder.
$env:TEMP = $p.Tmp
$env:TMP = $p.Tmp
$env:UV_CACHE_DIR = Join-Path $p.Cache 'uv'
$env:PIP_CACHE_DIR = Join-Path $p.Cache 'pip'
$env:UV_PYTHON_INSTALL_DIR = $p.Python

Write-Step 'Downloading components (each checked against a pinned SHA-256)'
$downloads = Join-Path $p.Tmp 'downloads'
New-Item -ItemType Directory -Force -Path $downloads | Out-Null
foreach ($tool in @('uv', 'caddy', 'garnet', 'dotnet')) {
    $zip = Join-Path $downloads "$tool.zip"
    Save-Component $tool $zip
    Expand-Archive -LiteralPath $zip -DestinationPath (Join-Path $p.Bin $tool) -Force
}
New-Item -ItemType Directory -Force -Path (Join-Path $p.Bin 'winsw') | Out-Null
Save-Component winsw (Join-Path $p.Bin 'winsw\WinSW-x64.exe')

# Visual C++ runtime DLLs, unpacked from Microsoft's redistributable without installing it.
$vcredist = Join-Path $downloads 'vc_redist.x64.exe'
Save-Component vcredist $vcredist
$vcDir = Join-Path $p.Bin 'vcruntime'
New-Item -ItemType Directory -Force -Path $vcDir | Out-Null
Expand-VcRuntime -Installer $vcredist -Destination $vcDir | Out-Null
function Copy-VcRuntime([string]$Target) {
    # Next to the programs that need them; never overwrite DLLs a component ships itself.
    foreach ($dll in Get-ChildItem -LiteralPath $vcDir -Filter *.dll) {
        $dest = Join-Path $Target $dll.Name
        if (-not (Test-Path -LiteralPath $dest)) { Copy-Item -LiteralPath $dll.FullName -Destination $dest }
    }
}
Copy-VcRuntime (Join-Path $p.Bin 'garnet\net10.0')

# --- 5. Python ------------------------------------------------------------------------------------------
Write-Step 'Installing Python 3.12 and the virtualenv'
$uv = Join-Path $p.Bin 'uv\uv.exe'
& $uv python install 3.12
if ($LASTEXITCODE -ne 0) { throw 'uv python install failed' }
& $uv venv --seed --python 3.12 $p.Venv
if ($LASTEXITCODE -ne 0) { throw 'Creating the virtualenv failed' }
$pythonHome = ((Get-Content (Join-Path $p.Venv 'pyvenv.cfg')) -match '^home\s*=' | Select-Object -First 1) -replace '^home\s*=\s*', ''
if ($pythonHome) { Copy-VcRuntime $pythonHome.Trim() }  # e.g. msvcp140.dll, which some packages need

# --- 6. database -------------------------------------------------------------------------------------------
$dbDepend = ''
$isMariaDb = $DatabaseUrl.StartsWith('mysql')
$adminNote = Join-Path $p.Config 'database-admin.txt'
if ($installDb) {
    $superPassword = New-ConduitSecret 32
    $appPassword = New-ConduitSecret 32
    $dbPort = $ports.Database
    if ($Database -eq 'Postgres') {
        Write-Step "Setting up PostgreSQL in $InstallRoot"
        $zip = Join-Path $downloads 'postgres.zip'
        Save-Component postgres $zip
        $pgHome = Join-Path $p.Bin 'postgres'
        # Server, tools and libraries only; pgAdmin and StackBuilder aren't needed.
        Expand-ZipSubset -Zip $zip -Prefix 'pgsql/bin/', 'pgsql/lib/', 'pgsql/share/' -Destination $pgHome -StripPrefix 'pgsql/' | Out-Null
        Copy-VcRuntime (Join-Path $pgHome 'bin')
        $pgData = Join-Path $p.Data 'postgres'
        $pwFile = Join-Path $p.Tmp 'pgpass.txt'
        [IO.File]::WriteAllText($pwFile, $superPassword)
        try {
            & (Join-Path $pgHome 'bin\initdb.exe') -D $pgData -U postgres "--pwfile=$pwFile" --encoding=UTF8 `
                --locale-provider=builtin --builtin-locale=C.UTF-8 --locale=C --auth=scram-sha-256 `
                -c listen_addresses=127.0.0.1 -c "port=$dbPort"
            if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
        }
        finally { Remove-Item -LiteralPath $pwFile -Force -ErrorAction SilentlyContinue }
        $dbService = 'conduit-postgres'
        $isMariaDb = $false
    }
    else {
        Write-Step "Setting up MariaDB in $InstallRoot"
        $zip = Join-Path $downloads 'mariadb.zip'
        Save-Component mariadb $zip
        $mdbHome = Join-Path $p.Bin 'mariadb'
        Expand-ZipSubset -Zip $zip -Prefix 'mariadb-11.8.9-winx64/bin/', 'mariadb-11.8.9-winx64/share/', 'mariadb-11.8.9-winx64/lib/' -Destination $mdbHome -StripPrefix 'mariadb-11.8.9-winx64/' | Out-Null
        $mdbData = Join-Path $p.Data 'mariadb'
        & (Join-Path $mdbHome 'bin\mariadb-install-db.exe') "--datadir=$mdbData" "--password=$superPassword" "--port=$dbPort"
        if ($LASTEXITCODE -ne 0) { throw 'mariadb-install-db failed' }
        # Local connections only, full Unicode.
        Add-Content -LiteralPath (Join-Path $mdbData 'my.ini') -Value @('', '[mysqld]', 'bind-address=127.0.0.1', 'character-set-server=utf8mb4', 'collation-server=utf8mb4_unicode_ci')
        # Credentials for the service's clean shutdown (readable by Administrators and the services only).
        Set-Content -LiteralPath (Join-Path $p.Config 'mariadb-admin.cnf') -Value @('[client]', 'user=root', "password=$superPassword", 'host=127.0.0.1', "port=$dbPort", 'protocol=TCP')
        $dbService = 'conduit-mariadb'
        $isMariaDb = $true
    }
    Set-Content -LiteralPath $adminNote -Value @(
        "Database administrator password (user: $(if ($isMariaDb) { 'root' } else { 'postgres' }), port $dbPort)",
        $superPassword,
        'Keep this safe; EvE Conduit itself uses the conduit user from conduit.env.'
    )
    $dbDepend = "`r`n  <depend>$dbService</depend>"
}

# --- 7. EvE Conduit itself ----------------------------------------------------------------------------------------
Write-Step "Installing EvE Conduit $version"
$target = Join-Path $p.Releases $version
if (Test-Path $target) { Remove-Item -LiteralPath $target -Recurse -Force }
Copy-Item -LiteralPath $releaseDir -Destination $target -Recurse
Set-ConduitAppLink -Root $InstallRoot -ReleaseDir $target

if ($installDb) {
    $DatabaseUrl = if ($isMariaDb) { "mysql://conduit:$appPassword@127.0.0.1:$($ports.Database)/conduit" } else { "postgres://conduit:$appPassword@127.0.0.1:$($ports.Database)/conduit" }
}
Write-EnvFile -Path $p.EnvFile -Header "Written by install.ps1 on $(Get-Date -Format yyyy-MM-dd). Apply changes with: conduit restart" -Values ([ordered]@{
        CONDUIT_SECRET_KEY      = New-ConduitSecret 60
        CONDUIT_TOKEN_KEY       = New-FernetKey
        CONDUIT_SITE_URL        = $siteUrl
        CONDUIT_ALLOWED_HOSTS   = "$Domain,localhost,127.0.0.1"
        CONDUIT_STATIC_ROOT     = $p.Static
        CONDUIT_BIND            = "127.0.0.1:$($ports.App)"
        DATABASE_URL           = $DatabaseUrl
        REDIS_URL              = "redis://127.0.0.1:$($ports.Cache)/0"
        ESI_CLIENT_ID          = $EsiClientId
        ESI_SECRET_KEY         = $EsiSecret
        ESI_USER_AGENT_CONTACT = $Email
        # Read by "conduit status"; changing them here doesn't move the web server (see README).
        CONDUIT_HTTP_PORT       = $ports.Http
        CONDUIT_HTTPS_PORT      = $(if ($NoTls) { '' } else { $ports.Https })
    })
Set-Content -LiteralPath $p.Modules -Value (Get-ModuleRequirement (Join-Path $target 'requirements-modules.txt'))
$caddyfile = New-ConduitCaddyfile -Template (Get-Content -LiteralPath (Join-Path $target 'windows\caddy\Caddyfile.template') -Raw) `
    -Domain $Domain -Email $Email -Root $InstallRoot -HttpPort $ports.Http -HttpsPort $ports.Https -AppPort $ports.App `
    -NoTls:$NoTls -StandardPublicPorts:$standardPublic
[IO.File]::WriteAllText((Join-Path $p.Config 'Caddyfile'), $caddyfile, (New-Object Text.UTF8Encoding $false))

Write-Host 'Installing the Python packages (a few minutes; pip lists each one as it goes).'
Install-ConduitPythonPackage -Root $InstallRoot -ReleaseDir $target -MariaDb:$isMariaDb
Publish-ConduitWeb -Root $InstallRoot -ReleaseDir $target

Write-Step 'Installing the tray control panel and uninstaller'
$dbKind = if (-not $installDb) { 'None' } elseif ($isMariaDb) { 'MariaDB' } else { 'Postgres' }
New-Item -ItemType Directory -Force -Path (Join-Path $InstallRoot 'tray') | Out-Null
Copy-Item -Path (Join-Path $target 'windows\tray\*') -Destination (Join-Path $InstallRoot 'tray') -Force
Write-TraySetting -Root $InstallRoot -Database $dbKind
Copy-Item -LiteralPath (Join-Path $target 'windows\uninstall.ps1') -Destination (Join-Path $InstallRoot 'uninstall.ps1') -Force

Write-Step 'Locking down folder permissions'
Set-ConduitAcl -Root $InstallRoot

# --- 8. services ------------------------------------------------------------------------------------------------
Write-Step 'Registering Windows services'
$templateValues = [ordered]@{
    ROOT       = $InstallRoot
    ROOT_FWD   = ConvertTo-ForwardSlashPath $InstallRoot
    CACHE_PORT = $ports.Cache
    DB_DEPEND  = $dbDepend
}
foreach ($id in Get-ConduitServiceId -Database $dbKind) {
    Install-ConduitService -Root $InstallRoot -Id $id -Values $templateValues
}

if ($installDb) {
    Write-Step 'Creating the EvE Conduit database'
    Start-Service $dbService
    Wait-ConduitDatabase -Root $InstallRoot
    if ($isMariaDb) {
        $sql = "CREATE DATABASE conduit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; " +
        "CREATE USER 'conduit'@'localhost' IDENTIFIED BY '$appPassword'; CREATE USER 'conduit'@'127.0.0.1' IDENTIFIED BY '$appPassword'; " +
        "GRANT ALL PRIVILEGES ON conduit.* TO 'conduit'@'localhost'; GRANT ALL PRIVILEGES ON conduit.* TO 'conduit'@'127.0.0.1'; FLUSH PRIVILEGES;"
        & (Join-Path $p.Bin 'mariadb\bin\mariadb.exe') "--defaults-extra-file=$(Join-Path $p.Config 'mariadb-admin.cnf')" -e $sql
    }
    else {
        $env:PGPASSWORD = $superPassword
        & (Join-Path $p.Bin 'postgres\bin\psql.exe') -h 127.0.0.1 -p $ports.Database -U postgres -v ON_ERROR_STOP=1 -q `
            -c "CREATE USER conduit WITH PASSWORD '$appPassword';" -c "CREATE DATABASE conduit OWNER conduit ENCODING 'UTF8';"
        Remove-Item Env:PGPASSWORD
    }
    if ($LASTEXITCODE -ne 0) { throw 'Creating the EvE Conduit database failed' }
}

Write-Step 'Preparing the database'
Invoke-ConduitPython -Root $InstallRoot -Arguments @('manage', 'migrate', '--noinput')
Invoke-ConduitPython -Root $InstallRoot -Arguments @('manage', 'collectstatic', '--noinput', '-v0')
# The init step queues the static data import, so run it once Garnet is up.
Start-Service conduit-garnet
$setupOutput = Invoke-ConduitPython -Root $InstallRoot -Arguments @('manage', 'conduit_init') 2>&1 | Out-String
foreach ($id in Get-ConduitServiceId -Database $dbKind) { Start-Service $id }

Write-Step 'Opening the firewall for the web ports'
$webPorts = @($ports.Http)
if (-not $NoTls) { $webPorts += $ports.Https }
Get-NetFirewallRule -DisplayName 'EvE Conduit web' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName 'EvE Conduit web' -Direction Inbound -Protocol TCP -LocalPort $webPorts -Action Allow | Out-Null

Write-Step 'Installing the conduit admin command'
Copy-Item -LiteralPath (Join-Path $target 'windows\conduit.ps1') -Destination (Join-Path $InstallRoot 'conduit.ps1') -Force
Copy-Item -LiteralPath (Join-Path $target 'windows\scripts\Conduit.psm1') -Destination (Join-Path $InstallRoot 'Conduit.psm1') -Force
# "& exit /b" on the same line: cmd never re-reads this file, so "conduit uninstall" can delete it.
Set-Content -LiteralPath (Join-Path $InstallRoot 'conduit.cmd') -Value "@powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"%~dp0conduit.ps1`" %* & exit /b"
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
if (($machinePath -split ';') -notcontains $InstallRoot) {
    [Environment]::SetEnvironmentVariable('Path', "$machinePath;$InstallRoot", 'Machine')
}
Remove-Item -LiteralPath $downloads -Recurse -Force -ErrorAction SilentlyContinue

Write-Step 'Registering with Apps & features'
Set-ConduitUninstallEntry -Root $InstallRoot -Version $version

if ($NoTray) {
    Write-Host 'Tray control panel not started at sign-in (-NoTray); open it any time with: conduit tray'
}
elseif (-not $hasDesktop) {
    Write-Host 'No desktop on this machine (Server Core?), so the tray control panel is skipped. Use "conduit status".'
}
else {
    Write-Step 'Starting the tray control panel'
    Set-ConduitTrayAutostart -Root $InstallRoot -Enabled $true
    Start-ConduitTray -Root $InstallRoot
}

# --- done ---------------------------------------------------------------------------------------------------------------
$elapsed = (Get-Date) - $script:InstallStart
Write-Host ("`n==> EvE Conduit $version is installed in $InstallRoot ({0}:{1:00})" -f [int][math]::Floor($elapsed.TotalMinutes), $elapsed.Seconds) -ForegroundColor Cyan
($setupOutput -split "`n") | Where-Object { $_ -match 'setup code|ESI_' } | ForEach-Object { Write-Host $_.Trim() -ForegroundColor Yellow }
Get-Service conduit-* | Format-Table -AutoSize Name, Status, DisplayName
Write-Host @"
Next steps:
  1. Create an EVE application at https://developers.eveonline.com/applications
     with callback URL: $siteUrl/sso/callback
  2. Put its Client ID and Secret Key in $($p.EnvFile), then run: conduit restart
  3. Open $siteUrl, sign in, and enter the setup code above.

Day to day (in an Administrator terminal): conduit status | logs | backup | upgrade <zip>
"@
