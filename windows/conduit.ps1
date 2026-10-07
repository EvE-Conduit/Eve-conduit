#Requires -Version 5.1
<#
.SYNOPSIS
    Day-to-day administration of a native Windows EvE Conduit install.

.DESCRIPTION
    Run in an Administrator terminal (the installer puts "conduit" on the PATH):

      conduit status                         service status and ports
      conduit ports                          which port each service uses
      conduit start | stop | restart [name]  name: postgres/mariadb, garnet, web, worker, beat, caddy (default: all)
      conduit logs [name]                    follow a service log (default: web)
      conduit manage <command> [args]        any Django management command
      conduit setup-code                     show the first-run setup code again
      conduit backup                         database + config to <root>\backups
      conduit upgrade <eve-conduit-X.Y.Z-windows.zip>
      conduit rollback                       back to the previous release
      conduit repair                         redo the last steps of an upgrade that stopped half-way
      conduit plugin install <package>       PyPI name, git URL or path
      conduit plugin list
      conduit tray [on|off]                  open the tray control panel, or start it at sign-in (on/off)
      conduit uninstall                      remove EvE Conduit (asks what to keep)
#>
# No param() block on purpose: arguments are passed through untouched, so things like
# "conduit manage shell -c ..." or "conduit uninstall -Mode All" aren't taken as options of this script.
$Command = if ($args.Count) { [string]$args[0] } else { 'help' }
$Rest = @(if ($args.Count -gt 1) { $args[1..($args.Count - 1)] | ForEach-Object { [string]$_ } })

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = if ($env:CONDUIT_ROOT) { $env:CONDUIT_ROOT } else { $PSScriptRoot }
Import-Module (Join-Path $Root 'Conduit.psm1') -Force
$p = Get-ConduitPath $Root

function Assert-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    if (-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this in an Administrator terminal.'
    }
}

function Get-InstalledServiceId {
    <# This install's services in start order (the database service only if EvE Conduit runs one). #>
    return @(Get-ConduitServiceId | Where-Object { Get-Service -Name $_ -ErrorAction SilentlyContinue })
}

function Resolve-ServiceId([string]$Name) {
    if (-not $Name) { return Get-InstalledServiceId }
    $id = "conduit-$Name"
    if ((Get-InstalledServiceId) -notcontains $id) { throw "Unknown service '$Name' ($((Get-InstalledServiceId | ForEach-Object { $_ -replace '^conduit-', '' }) -join ', '))" }
    return @($id)
}

function Show-Port {
    $settings = Read-EnvFile $p.EnvFile
    $db = [Uri]$settings['DATABASE_URL']
    $cache = [Uri]$settings['REDIS_URL']
    $app = ($settings['CONDUIT_BIND'] -split ':')[-1]
    $rows = @(
        [pscustomobject]@{ Service = 'Web server (HTTP)'; Port = $settings['CONDUIT_HTTP_PORT']; Reachable = 'public' }
        [pscustomobject]@{ Service = 'Web server (HTTPS)'; Port = $(if ($settings['CONDUIT_HTTPS_PORT']) { $settings['CONDUIT_HTTPS_PORT'] } else { 'off' }); Reachable = 'public' }
        [pscustomobject]@{ Service = 'EvE Conduit application'; Port = $app; Reachable = 'this machine' }
        [pscustomobject]@{ Service = 'Garnet cache/queue'; Port = $cache.Port; Reachable = 'this machine' }
        [pscustomobject]@{ Service = "Database ($($db.Scheme))"; Port = $db.Port; Reachable = "$($db.Host)" }
    )
    $rows | Format-Table -AutoSize
    Write-Host "Site address: $($settings['CONDUIT_SITE_URL'])"
}

function Stop-AppService {
    <# Everything except the database and Garnet, which have nothing to update. #>
    $ids = @(Get-InstalledServiceId | Where-Object { $_ -notin @('conduit-garnet', 'conduit-postgres', 'conduit-mariadb') })
    [array]::Reverse($ids)
    foreach ($id in $ids) { Stop-Service $id -ErrorAction SilentlyContinue }
}

function Restart-All {
    $ids = Get-InstalledServiceId
    [array]::Reverse($ids)
    foreach ($id in $ids) { Stop-Service $id -ErrorAction SilentlyContinue }
    foreach ($id in Get-InstalledServiceId) { Start-Service $id }
}

function Find-DatabaseTool([string]$Name) {
    <# The bundled tool first (bin\postgres or bin\mariadb), then anything on the PATH. #>
    foreach ($dir in @((Join-Path $p.Bin 'postgres\bin'), (Join-Path $p.Bin 'mariadb\bin'))) {
        $candidate = Join-Path $dir $Name
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    $onPath = Get-Command $Name -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }
    throw "$Name not found (install the database client tools or add them to the PATH)"
}

function Invoke-Backup {
    Assert-Admin
    $settings = Read-EnvFile $p.EnvFile
    $url = [Uri]$settings['DATABASE_URL']
    $user, $password = [Uri]::UnescapeDataString($url.UserInfo).Split(':', 2)
    $dbName = $url.AbsolutePath.TrimStart('/')
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $work = Join-Path $p.Backups "conduit-$stamp"
    New-Item -ItemType Directory -Force -Path $work | Out-Null
    try {
        if ($url.Scheme -like 'postgres*') {
            $dump = Find-DatabaseTool 'pg_dump.exe'
            $env:PGPASSWORD = $password
            $port = if ($url.Port -gt 0) { $url.Port } else { 5432 }
            & $dump -h $url.Host -p $port -U $user -Fc -f (Join-Path $work 'database.dump') $dbName
            Remove-Item Env:PGPASSWORD
        }
        else {
            $dump = Find-DatabaseTool 'mariadb-dump.exe'
            $env:MYSQL_PWD = $password
            $port = if ($url.Port -gt 0) { $url.Port } else { 3306 }
            & $dump -h $url.Host -P $port -u $user --single-transaction --routines "--result-file=$(Join-Path $work 'database.sql')" $dbName
            Remove-Item Env:MYSQL_PWD
        }
        if ($LASTEXITCODE -ne 0) { throw 'Database dump failed' }
        Copy-Item $p.EnvFile, $p.Plugins -Destination $work
        (Get-Item $p.App).Target | Set-Content (Join-Path $work 'release.txt')
        $zip = "$work.zip"
        Compress-Archive -Path (Join-Path $work '*') -DestinationPath $zip
        Write-Host "Backup written to $zip (contains secrets; keep it safe)"
    }
    finally { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
}

function Get-DatabaseKind {
    if (Get-Service -Name 'conduit-postgres' -ErrorAction SilentlyContinue) { return 'Postgres' }
    if (Get-Service -Name 'conduit-mariadb' -ErrorAction SilentlyContinue) { return 'MariaDB' }
    return 'None'
}

function Invoke-Finish([string]$ReleaseDir) {
    # migrate needs the database and conduit_init needs Garnet, whatever state they were left in.
    foreach ($id in @('conduit-postgres', 'conduit-mariadb', 'conduit-garnet')) {
        if (Get-Service -Name $id -ErrorAction SilentlyContinue) { Start-Service $id }
    }
    Wait-ConduitDatabase -Root $Root
    Invoke-ConduitPython -Root $Root -Arguments @('manage', 'migrate', '--noinput')
    Invoke-ConduitPython -Root $Root -Arguments @('manage', 'collectstatic', '--noinput', '-v0')
    Invoke-ConduitPython -Root $Root -Arguments @('manage', 'conduit_init') | Out-Null
    Publish-ConduitWeb -Root $Root -ReleaseDir $ReleaseDir
    # Admin command, uninstaller and tray panel come from the release too.
    Copy-Item (Join-Path $ReleaseDir 'windows\scripts\Conduit.psm1') (Join-Path $Root 'Conduit.psm1') -Force
    Copy-Item (Join-Path $ReleaseDir 'windows\conduit.ps1') (Join-Path $Root 'conduit.ps1') -Force
    Copy-Item (Join-Path $ReleaseDir 'windows\uninstall.ps1') (Join-Path $Root 'uninstall.ps1') -Force
    New-Item -ItemType Directory -Force -Path (Join-Path $Root 'tray') | Out-Null
    Copy-Item -Path (Join-Path $ReleaseDir 'windows\tray\*') -Destination (Join-Path $Root 'tray') -Force
    Write-TraySetting -Root $Root -Database (Get-DatabaseKind)
    Set-ConduitUninstallEntry -Root $Root -Version (Get-ReleaseVersion $ReleaseDir)
}

function Invoke-Uninstall([string[]]$Arguments) {
    Assert-Admin
    # Run a copy from outside the install folder, which is about to be deleted.
    $copy = Join-Path ([IO.Path]::GetTempPath()) ("conduit-uninstall-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $copy | Out-Null
    Copy-Item (Join-Path $Root 'uninstall.ps1'), (Join-Path $Root 'Conduit.psm1') -Destination $copy
    $named = ConvertTo-NamedArgument $Arguments
    $named['Root'] = $Root
    & (Join-Path $copy 'uninstall.ps1') @named
}

function Test-MariaDb { (Read-EnvFile $p.EnvFile)['DATABASE_URL'].StartsWith('mysql') }

function Invoke-Upgrade([string]$Zip) {
    Assert-Admin
    if (-not $Zip -or -not (Test-Path -LiteralPath $Zip)) { throw 'usage: conduit upgrade <eve-conduit-X.Y.Z-windows.zip>' }
    $staging = Join-Path $p.Releases "upgrade-$([guid]::NewGuid())"
    try {
        Expand-Archive -LiteralPath $Zip -DestinationPath $staging
        $inner = @(Get-ChildItem -LiteralPath $staging -Directory)
        if ($inner.Count -ne 1) { throw 'Unexpected zip layout (expected one top-level folder).' }
        $version = Get-ReleaseVersion $inner[0].FullName
        $target = Join-Path $p.Releases $version
        $current = (Get-Item $p.App).Target
        if ($current -is [array]) { $current = $current[0] }
        if ($target -eq $current) { throw "Release $version is already running. Upgrades need a newer version number (backend/pyproject.toml)." }
        Write-Host 'Backing up before upgrading...'
        Invoke-Backup
        # Windows locks DLLs that are in use, so stop the app before pip replaces anything.
        Stop-AppService
        Write-Host "Installing $version..."
        try {
            Install-ConduitPythonPackage -Root $Root -ReleaseDir $inner[0].FullName -MariaDb:(Test-MariaDb)
        }
        catch {
            Write-Warning "Upgrade failed: $_. Putting the running release back."
            Install-ConduitPythonPackage -Root $Root -ReleaseDir $current -MariaDb:(Test-MariaDb)
            Restart-All
            throw
        }
        # Only now does the staged folder become a release.
        if (Test-Path $target) { Remove-Item -LiteralPath $target -Recurse -Force }
        Move-Item -LiteralPath $inner[0].FullName -Destination $target
        Set-Content -LiteralPath (Join-Path $Root 'previous.txt') -Value $current
        Set-ConduitAppLink -Root $Root -ReleaseDir $target
        Set-ConduitAcl -Root $Root
        Invoke-Finish $target
        Restart-All
        Write-Host "EvE Conduit $version is running. 'conduit rollback' returns to the previous release."
    }
    finally { Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue }
}

function Invoke-Rollback {
    Assert-Admin
    $file = Join-Path $Root 'previous.txt'
    if (-not (Test-Path $file)) { throw 'No previous release recorded.' }
    $previous = (Get-Content $file -TotalCount 1).Trim()
    if (-not (Test-Path $previous)) { throw "Previous release folder is gone: $previous" }
    $current = (Get-Item $p.App).Target
    if ($current -is [array]) { $current = $current[0] }
    Write-Host "Rolling back to $(Split-Path $previous -Leaf). Database migrations from the newer release are NOT undone;"
    Write-Host 'restore the backup taken before the upgrade if the old version refuses to start.'
    Stop-AppService
    Install-ConduitPythonPackage -Root $Root -ReleaseDir $previous -MariaDb:(Test-MariaDb)
    Set-ConduitAppLink -Root $Root -ReleaseDir $previous
    Set-Content -LiteralPath $file -Value $current
    Invoke-ConduitPython -Root $Root -Arguments @('manage', 'collectstatic', '--noinput', '-v0')
    Publish-ConduitWeb -Root $Root -ReleaseDir $previous
    Restart-All
}

switch ($Command) {
    'status' { Get-Service conduit-* | Format-Table -AutoSize Name, Status, StartType, DisplayName; Show-Port }
    'ports' { Show-Port }
    'start' { Assert-Admin; foreach ($id in Resolve-ServiceId ($Rest | Select-Object -First 1)) { Start-Service $id } }
    'stop' {
        Assert-Admin
        # Reverse start order, so nothing is stopped while a service that depends on it still runs.
        # -Force also stops the dependents of a named service (e.g. "stop postgres" stops web and worker).
        $ids = @(Resolve-ServiceId ($Rest | Select-Object -First 1))
        [array]::Reverse($ids)
        foreach ($id in $ids) { Stop-Service $id -Force }
    }
    'restart' {
        Assert-Admin
        if ($Rest) {
            foreach ($id in Resolve-ServiceId $Rest[0]) {
                # Services that depend on this one have to stop with it; start them again afterwards.
                $dependents = @((Get-Service $id).DependentServices | Where-Object Status -eq 'Running')
                Stop-Service $id -Force
                Start-Service $id
                foreach ($dep in $dependents) { Start-Service $dep.Name }
            }
        }
        else { Restart-All }
    }
    'logs' {
        $name = if ($Rest) { $Rest[0] } else { 'web' }
        $id = (Resolve-ServiceId $name)[0]
        Get-Content -LiteralPath (Join-Path $p.Logs "$id.out.log") -Tail 100 -Wait
    }
    'manage' { Assert-Admin; Invoke-ConduitPython -Root $Root -Arguments (@('manage') + $Rest) }
    'setup-code' { Assert-Admin; Invoke-ConduitPython -Root $Root -Arguments @('manage', 'conduit_init') }
    'backup' { Invoke-Backup }
    'upgrade' { Invoke-Upgrade ($Rest | Select-Object -First 1) }
    'rollback' { Invoke-Rollback }
    'repair' {
        # Migrations, static files, web front end and admin scripts for the release that's linked now.
        Assert-Admin
        $current = (Get-Item $p.App).Target
        if ($current -is [array]) { $current = $current[0] }
        Invoke-Finish $current
        Restart-All
        Write-Host "EvE Conduit $(Get-ReleaseVersion $current) is running."
    }
    'uninstall' { Invoke-Uninstall $Rest }
    'tray' {
        switch ($Rest | Select-Object -First 1) {
            'on' { Assert-Admin; Set-ConduitTrayAutostart -Root $Root -Enabled $true; Write-Host 'The tray panel now starts when anyone signs in.' }
            'off' { Assert-Admin; Set-ConduitTrayAutostart -Root $Root -Enabled $false; Write-Host 'The tray panel no longer starts at sign-in.' }
            default { Start-ConduitTray -Root $Root }
        }
    }
    'plugin' {
        Assert-Admin
        switch ($Rest | Select-Object -First 1) {
            'install' {
                if ($Rest.Count -lt 2) { throw 'usage: conduit plugin install <package|git URL|path>' }
                $existing = @(Get-PluginRequirement $p.Plugins)
                if ($existing -notcontains $Rest[1]) { Add-Content -LiteralPath $p.Plugins -Value $Rest[1] }
                $current = (Get-Item $p.App).Target
                if ($current -is [array]) { $current = $current[0] }
                Stop-AppService
                try { Install-ConduitPythonPackage -Root $Root -ReleaseDir $current -MariaDb:(Test-MariaDb) }
                catch { Restart-All; throw }
                Invoke-Finish $current
                Restart-All
                Write-Host 'Installed. Switch it on under Administration -> Plugins.'
            }
            'list' {
                Invoke-ConduitPython -Root $Root -Arguments @('manage', 'shell', '-c',
                    "from conduit.plugins import registry`nfor mid, e in sorted(registry.discover().items()):`n    print(f'{mid:20} {e.plugin.version:10} ' + ('OK' if e.ok else 'BROKEN: ' + '; '.join(e.problems)))")
            }
            default { throw 'usage: conduit plugin install <package> | conduit plugin list' }
        }
    }
    default { Get-Help $PSCommandPath -Detailed | Out-String | Write-Host }
}
