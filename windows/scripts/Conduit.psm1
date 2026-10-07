# Shared helpers for the EvE Conduit Windows installer (install.ps1) and admin command (conduit.ps1).
# Must keep working on Windows PowerShell 5.1, which every Windows install has.
# Functions that don't touch Windows-only APIs are covered by tests\Conduit.Tests.ps1, which also
# runs on Linux/macOS PowerShell.

Set-StrictMode -Version Latest
# A module doesn't see the caller's $ErrorActionPreference, so set it here too: a failing step must stop
# the install instead of the next steps running against half-made files.
$ErrorActionPreference = 'Stop'

# Third-party tools downloaded by the installer, pinned by SHA-256. To update one, change the URL and
# hash together (download it and run Get-FileHash, or use the publisher's checksum file).
$script:Downloads = [ordered]@{
    uv     = @{
        Url    = 'https://github.com/astral-sh/uv/releases/download/0.12.23/uv-x86_64-pc-windows-msvc.zip'
        Sha256 = '75d05de6762778c31ee183398de7dd15093fad0ed90b1f236d8205ea5ec00c90'
    }
    caddy  = @{
        Url    = 'https://github.com/caddyserver/caddy/releases/download/v2.11.7/caddy_2.11.7_windows_amd64.zip'
        Sha256 = '0a1edc0b799512051c57071ce0e798d3f2cf67dc98171366f1d2b326072e3b06'
    }
    garnet = @{
        Url    = 'https://github.com/microsoft/garnet/releases/download/v2.2.0/win-x64-based-readytorun.zip'
        Sha256 = '8812ae916dd2386db6ebfaeeee3fb6508024f82ee4c66284532a1a5baa6afea2'
    }
    winsw    = @{
        Url    = 'https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe'
        Sha256 = '05b82d46ad331cc16bdc00de5c6332c1ef818df8ceefcd49c726553209b3a0da'
    }
    # .NET runtime as a plain zip, used only by Garnet (via DOTNET_ROOT); nothing is installed system-wide.
    dotnet   = @{
        Url    = 'https://builds.dotnet.microsoft.com/dotnet/Runtime/10.0.12/dotnet-runtime-10.0.12-win-x64.zip'
        Sha256 = 'da3947e6acbb5228e4e987c7585aa40ce2d7000856e3da0804e6ee3771e806dc'
    }
    # Portable database servers (zip builds, no installer).
    postgres = @{
        Url    = 'https://get.enterprisedb.com/postgresql/postgresql-17.11-2-windows-x64-binaries.zip'
        Sha256 = '2f868d77832f5cbc62182a0ca57f02df14d33d85ce0d0bbaaeb0de3a7029bd2b'
    }
    mariadb  = @{
        Url    = 'https://archive.mariadb.org/mariadb-11.8.9/winx64-packages/mariadb-11.8.9-winx64.zip'
        Sha256 = '830c46727d9278eae212ae3eca44eeb9e71b2a68704e95f344a64fba7b1963f5'
    }
    # Microsoft's Visual C++ redistributable. It is never run: the installer only unpacks
    # msvcp140.dll / vcruntime140*.dll from it and copies them next to the programs that need them.
    vcredist = @{
        Url    = 'https://download.visualstudio.microsoft.com/download/pr/bd1c8d9d-ba95-4eee-bc6e-df1fcc876373/CC0FF0EB1DC3F5188AE6300FAEF32BF5BEEBA4BDD6E8E445A9184072096B713B/VC_redist.x64.exe'
        Sha256 = 'cc0ff0eb1dc3f5188ae6300faef32bf5beeba4bdd6e8e445a9184072096b713b'
    }
}

# Start order matters: database and cache/queue first, the web server last. Only one database
# service exists on a given install (or none, with an external database).
$script:ServiceIds = @('conduit-postgres', 'conduit-mariadb', 'conduit-garnet', 'conduit-web', 'conduit-worker', 'conduit-beat', 'conduit-caddy')

function Get-ConduitDownload {
    param([Parameter(Mandatory)][string]$Name)
    if (-not $script:Downloads.Contains($Name)) { throw "Unknown download '$Name'" }
    return $script:Downloads[$Name]
}

function Get-ConduitServiceId {
    <# Service ids in start order. -Database limits the database service to the one in use. #>
    param([ValidateSet('All', 'Postgres', 'MariaDB', 'None')][string]$Database = 'All')
    $skip = switch ($Database) {
        'Postgres' { @('conduit-mariadb') }
        'MariaDB' { @('conduit-postgres') }
        'None' { @('conduit-postgres', 'conduit-mariadb') }
        default { @() }
    }
    return @($script:ServiceIds | Where-Object { $skip -notcontains $_ })
}

function Get-ConduitPath {
    <# The folder layout under the install root. #>
    param([Parameter(Mandatory)][string]$Root)
    return [ordered]@{
        Root     = $Root
        App      = Join-Path $Root 'app'
        Releases = Join-Path $Root 'releases'
        Venv     = Join-Path $Root 'venv'
        Python   = Join-Path $Root 'python'
        Bin      = Join-Path $Root 'bin'
        Config   = Join-Path $Root 'config'
        Data     = Join-Path $Root 'data'
        Static   = Join-Path (Join-Path $Root 'data') 'static'
        Web      = Join-Path $Root 'web'
        Logs     = Join-Path $Root 'logs'
        Backups  = Join-Path $Root 'backups'
        Services = Join-Path $Root 'services'
        Cache    = Join-Path $Root 'cache'
        Tmp      = Join-Path $Root 'tmp'
        EnvFile  = Join-Path (Join-Path $Root 'config') 'conduit.env'
        Plugins  = Join-Path (Join-Path $Root 'config') 'plugins.txt'
        # Plugins installed from Administration -> Plugins (written only by apply-update) and the newest catalog used.
        PluginsSite  = Join-Path (Join-Path $Root 'config') 'plugins-site.txt'
        PluginSerial = Join-Path (Join-Path $Root 'config') 'plugin-catalog.serial'
    }
}

function Get-RandomByte {
    param([Parameter(Mandatory)][int]$Count)
    $bytes = New-Object byte[] $Count
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return , $bytes
}

function New-ConduitSecret {
    <# A random string of letters and digits, from a cryptographic RNG (no modulo bias: 248 = 4 x 62). #>
    param([int]$Length = 50)
    $alphabet = [char[]]'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    $chars = New-Object System.Collections.Generic.List[char]
    while ($chars.Count -lt $Length) {
        foreach ($b in (Get-RandomByte -Count ($Length * 2))) {
            if ($b -lt 248 -and $chars.Count -lt $Length) { $chars.Add($alphabet[$b % 62]) }
        }
    }
    -join $chars
}

function New-FernetKey {
    <# 32 random bytes, URL-safe base64: the format CONDUIT_TOKEN_KEY expects. #>
    [Convert]::ToBase64String((Get-RandomByte -Count 32)).Replace('+', '-').Replace('/', '_')
}

function Read-EnvFile {
    <# KEY=VALUE lines into an ordered hashtable; comments and blank lines skipped. #>
    param([Parameter(Mandatory)][string]$Path)
    $values = [ordered]@{}
    foreach ($line in Get-Content -LiteralPath $Path -Encoding utf8) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) { continue }
        $key, $value = $trimmed.Split('=', 2)
        $value = $value.Trim()
        if ($value.Length -ge 2 -and $value[0] -eq $value[-1] -and $value[0] -in @('"', "'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key.Trim()] = $value
    }
    return $values
}

function Write-EnvFile {
    <# Writes KEY=VALUE lines as UTF-8 without a BOM (Python reads it either way). #>
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Values,
        [string]$Header = ''
    )
    $lines = @()
    if ($Header) { $lines += ($Header -split "`n" | ForEach-Object { "# $_".TrimEnd() }) }
    foreach ($key in $Values.Keys) {
        if ($Values[$key] -match "[`r`n]") { throw "Value for $key contains a line break" }
        $lines += "$key=$($Values[$key])"
    }
    [System.IO.File]::WriteAllText($Path, (($lines -join "`r`n") + "`r`n"), [System.Text.UTF8Encoding]::new($false))
}

function Expand-ConduitTemplate {
    <# Replaces {{NAME}} placeholders; fails if any placeholder is left unfilled. #>
    param(
        [Parameter(Mandatory)][string]$Text,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Values
    )
    foreach ($key in $Values.Keys) {
        $Text = $Text.Replace("{{$key}}", [string]$Values[$key])
    }
    $left = [regex]::Matches($Text, '\{\{([A-Z0-9_]+)\}\}') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
    if ($left) { throw "Template placeholders not filled: $($left -join ', ')" }
    return $Text
}

function Assert-FileHash {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Sha256
    )
    $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
    if ($actual -ne $Sha256.ToUpperInvariant()) {
        Remove-Item -LiteralPath $Path -Force
        throw "Checksum mismatch for $(Split-Path $Path -Leaf): expected $Sha256, got $actual. The download was deleted."
    }
}

function Invoke-ConduitDownload {
    <# Downloads a pinned tool and checks its SHA-256 before anything uses it. #>
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Destination
    )
    $item = Get-ConduitDownload $Name
    Write-Verbose "Downloading $($item.Url)"
    $ProgressPreference = 'SilentlyContinue'  # the progress bar makes Invoke-WebRequest very slow
    Invoke-WebRequest -Uri $item.Url -OutFile $Destination -UseBasicParsing
    Assert-FileHash -Path $Destination -Sha256 $item.Sha256
}

function ConvertTo-ForwardSlashPath {
    param([Parameter(Mandatory)][string]$Path)
    return $Path.Replace('\', '/')
}

function Get-ReleaseVersion {
    <# The VERSION file at the top of an unpacked release folder. #>
    param([Parameter(Mandatory)][string]$ReleaseDir)
    $file = Join-Path $ReleaseDir 'VERSION'
    if (-not (Test-Path -LiteralPath $file)) { throw "$ReleaseDir is not an EvE Conduit release (no VERSION file)" }
    $version = (Get-Content -LiteralPath $file -TotalCount 1).Trim()
    if ($version -notmatch '^[0-9A-Za-z.+-]+$') { throw "Unexpected version '$version'" }
    return $version
}

function Get-PluginRequirement {
    <# Lines of requirements-plugins.txt that name a module (no comments or blanks). #>
    param([Parameter(Mandatory)][string]$Path)
    @(Get-Content -LiteralPath $Path | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
}

$script:DefaultInstallRoot = 'C:\EvE-Conduit'

function Get-DefaultInstallRoot { return $script:DefaultInstallRoot }

function Format-InstallRoot {
    <# Tidies a typed path: trims spaces and quotes, drops a trailing backslash. #>
    param([AllowEmptyString()][string]$Path)
    $clean = $Path.Trim().Trim('"').Trim()
    if ($clean -match '^[A-Za-z]:\\.+') { $clean = $clean.TrimEnd('\') }
    return $clean
}

function Get-InstallRootProblem {
    <#
      Why a folder can't be the install root, or $null if it's fine. Covers the naming rules; the
      installer also checks the drive itself (exists, local, free space) and that the folder is empty.
    #>
    param([AllowEmptyString()][string]$Path)
    if (-not $Path) { return 'Enter a folder, for example D:\EvE-Conduit.' }
    if ($Path -notmatch '^[A-Za-z]:\\') { return 'Use a full path on a local drive, for example D:\EvE-Conduit (network paths are not supported).' }
    if ($Path -match '^[A-Za-z]:\\?$') { return "Don't install into the root of a drive; use a folder such as $($Path.Substring(0, 2))\EvE-Conduit." }
    # These break the service definitions (XML, WinSW's %VAR% expansion) or the PATH variable.
    if ($Path -match '[&<>"''%;|*?]' -or $Path.Substring(2).Contains(':')) { return 'The path can''t contain & < > " '' % ; | * ? or an extra colon.' }
    foreach ($part in $Path.Substring(3).Split('\')) {
        if (-not $part) { return 'The path contains an empty folder name (two backslashes in a row).' }
        if ($part.EndsWith(' ') -or $part.EndsWith('.')) { return "Folder names can't end with a space or a dot ('$part')." }
    }
    # Python packages add deep paths inside the install folder; stay well inside Windows' 260-character limit.
    if ($Path.Length -gt 80) { return 'Keep the path under 80 characters; files deep inside it would hit Windows'' path length limit.' }
    if ($Path -match '^[A-Za-z]:\\(Windows|Users|ProgramData)(\\|$)') { return 'Choose a folder outside Windows, Users and ProgramData.' }
    return $null
}

function Expand-ZipSubset {
    <#
      Extracts only the entries under the given prefixes (e.g. 'pgsql/bin/'), dropping $StripPrefix
      from their paths. Lets us take PostgreSQL's server files without pgAdmin (most of the download).
    #>
    param(
        [Parameter(Mandatory)][string]$Zip,
        [Parameter(Mandatory)][string[]]$Prefix,
        [Parameter(Mandatory)][string]$Destination,
        [string]$StripPrefix = ''
    )
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($Zip)
    $count = 0
    try {
        foreach ($entry in $archive.Entries) {
            $name = $entry.FullName.Replace('\', '/')
            if (-not ($Prefix | Where-Object { $name.StartsWith($_) })) { continue }
            if ($name.EndsWith('/')) { continue }
            $relative = if ($StripPrefix -and $name.StartsWith($StripPrefix)) { $name.Substring($StripPrefix.Length) } else { $name }
            if ($relative -match '(^|/)\.\.(/|$)') { throw "Refusing unsafe path in archive: $name" }
            $target = Join-Path $Destination ($relative.Replace('/', [IO.Path]::DirectorySeparatorChar))
            New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
            $count++
        }
    }
    finally { $archive.Dispose() }
    if (-not $count) { throw "Nothing under $($Prefix -join ', ') in $Zip" }
    return $count
}

$script:VcRuntimeDlls = @('msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll')

function Expand-VcRuntime {
    <#
      Unpacks msvcp140.dll and vcruntime140(_1).dll from VC_redist.x64.exe WITHOUT running or
      installing it. The redistributable is a WiX bundle: its payloads sit in a CAB appended to the exe
      (the largest "MSCF" block), and the x64 runtime files are in a CAB inside that, named like
      "msvcp140.dll_amd64". -Extractor unpacks one CAB into a folder; on Windows that's expand.exe.
    #>
    param(
        [Parameter(Mandatory)][string]$Installer,
        [Parameter(Mandatory)][string]$Destination,
        [scriptblock]$Extractor = { param($Cab, $OutDir) Invoke-NativeCommand -FilePath 'expand.exe' -ArgumentList @('-F:*', $Cab, $OutDir) -FailMessage "expand.exe failed on $Cab" | Out-Null }
    )
    $bytes = [IO.File]::ReadAllBytes($Installer)
    $text = [Text.Encoding]::GetEncoding(28591).GetString($bytes)   # 1 byte = 1 char, so offsets match
    $best = $null
    $at = $text.IndexOf('MSCF', [StringComparison]::Ordinal)
    while ($at -ge 0) {
        if ($at + 12 -le $bytes.Length) {
            $size = [BitConverter]::ToUInt32($bytes, $at + 8)
            if ($size -gt 1000 -and $at + $size -le $bytes.Length -and (-not $best -or $size -gt $best.Size)) { $best = @{ Offset = $at; Size = $size } }
        }
        $at = $text.IndexOf('MSCF', $at + 4, [StringComparison]::Ordinal)
    }
    if (-not $best) { throw "No cabinet found in $Installer" }
    $work = Join-Path $Destination ('.vcx-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $work | Out-Null
    try {
        $outer = Join-Path $work 'attached.cab'
        $stream = [IO.File]::Create($outer)
        try { $stream.Write($bytes, $best.Offset, [int]$best.Size) } finally { $stream.Dispose() }
        $payloads = Join-Path $work 'payloads'
        New-Item -ItemType Directory -Path $payloads | Out-Null
        & $Extractor $outer $payloads
        $found = @{}
        foreach ($payload in Get-ChildItem -LiteralPath $payloads -File) {
            $head = New-Object byte[] 4
            $fs = [IO.File]::OpenRead($payload.FullName)
            try { [void]$fs.Read($head, 0, 4) } finally { $fs.Dispose() }
            if ([Text.Encoding]::ASCII.GetString($head) -ne 'MSCF') { continue }
            $inner = Join-Path $work $payload.Name
            New-Item -ItemType Directory -Path $inner | Out-Null
            & $Extractor $payload.FullName $inner
            foreach ($dll in $script:VcRuntimeDlls) {
                $file = Join-Path $inner "${dll}_amd64"
                if (-not $found.ContainsKey($dll) -and (Test-Path -LiteralPath $file)) { $found[$dll] = $file }
            }
            if ($found.Count -eq $script:VcRuntimeDlls.Count) { break }
        }
        $missing = @($script:VcRuntimeDlls | Where-Object { -not $found.ContainsKey($_) })
        if ($missing) { throw "Visual C++ runtime files not found in the redistributable: $($missing -join ', ')" }
        foreach ($dll in $script:VcRuntimeDlls) { Copy-Item -LiteralPath $found[$dll] -Destination (Join-Path $Destination $dll) -Force }
    }
    finally { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
    return $script:VcRuntimeDlls
}

# --- ports -----------------------------------------------------------------------------------

function Get-DefaultPort {
    <# The ports EvE Conduit uses unless told otherwise. #>
    return [ordered]@{ Http = 80; Https = 443; App = 8000; Cache = 6379; Postgres = 5432; MariaDB = 3306 }
}

function Get-PortProblem {
    <#
      Checks a set of chosen ports ({Name = port}) for range and clashes. Returns a list of problems.
      $Taken: ports already listening on this machine. $Excluded: @(@(start, end), ...) ranges Windows
      reserves (Hyper-V/WSL/Docker), from ConvertFrom-ExcludedPortRange.
    #>
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$Ports,
        [int[]]$Taken = @(),
        [object[]]$Excluded = @()
    )
    $problems = New-Object System.Collections.Generic.List[string]
    $seen = @{}
    foreach ($name in $Ports.Keys) {
        $port = $Ports[$name]
        if ($port -isnot [int] -or $port -lt 1 -or $port -gt 65535) { $problems.Add("$name port '$port' must be a number from 1 to 65535."); continue }
        if ($seen.ContainsKey($port)) { $problems.Add("$name and $($seen[$port]) can't both use port $port."); continue }
        $seen[$port] = $name
        if ($Taken -contains $port) { $problems.Add("Port $port ($name) is already in use by another program on this machine.") }
        foreach ($range in $Excluded) {
            if ($port -ge $range[0] -and $port -le $range[1]) { $problems.Add("Port $port ($name) is reserved by Windows (excluded range $($range[0])-$($range[1]), often Hyper-V, WSL or Docker).") }
        }
    }
    return , $problems.ToArray()
}

function Get-ListeningPort {
    <# TCP ports something is already listening on (works on any OS). #>
    $props = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
    return @($props.GetActiveTcpListeners() | ForEach-Object { $_.Port } | Sort-Object -Unique)
}

function ConvertFrom-ExcludedPortRange {
    <# Parses "netsh interface ipv4 show excludedportrange protocol=tcp" output into @(start, end) pairs. #>
    param([AllowEmptyString()][string[]]$Text)
    $ranges = @()
    foreach ($line in $Text) {
        if ($line -match '^\s*(\d+)\s+(\d+)\s*\*?\s*$') { $ranges += , @([int]$Matches[1], [int]$Matches[2]) }
    }
    return , $ranges
}

function Get-PublicSiteUrl {
    <#
      The address members use. Ports are left out when they're the standard ones, or when the router
      forwards the standard public ports to the chosen local ones.
    #>
    param(
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][int]$HttpPort,
        [Parameter(Mandatory)][int]$HttpsPort,
        [switch]$NoTls,
        [switch]$StandardPublicPorts
    )
    if ($NoTls) {
        if ($StandardPublicPorts -or $HttpPort -eq 80) { return "http://$Domain" }
        return "http://${Domain}:$HttpPort"
    }
    if ($StandardPublicPorts -or $HttpsPort -eq 443) { return "https://$Domain" }
    return "https://${Domain}:$HttpsPort"
}

function New-ConduitCaddyfile {
    <#
      Fills windows\caddy\Caddyfile.template for the chosen ports:
        * standard ports (80/443): Caddy's normal automatic HTTPS and redirects.
        * other local ports, router forwards public 80/443 to them: redirect to https://domain (no port).
        * other ports used as-is publicly: redirect to https://domain:port.
        * -NoTls: plain HTTP on the chosen port.
    #>
    param(
        [Parameter(Mandatory)][string]$Template,
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][string]$Email,
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][int]$HttpPort,
        [Parameter(Mandatory)][int]$HttpsPort,
        [Parameter(Mandatory)][int]$AppPort,
        [switch]$NoTls,
        [switch]$StandardPublicPorts
    )
    $globalExtra = ''
    $redirect = ''
    $site = $Domain
    if ($NoTls) {
        $site = "http://$Domain"
    }
    elseif ($HttpPort -ne 80 -or $HttpsPort -ne 443) {
        # Caddy's automatic HTTP->HTTPS redirect ignores a custom https_port, so with non-standard
        # ports we redirect ourselves, to exactly the public address (with the port if it's public).
        $target = Get-PublicSiteUrl -Domain $Domain -HttpPort $HttpPort -HttpsPort $HttpsPort -StandardPublicPorts:$StandardPublicPorts
        $globalExtra = "`n`tauto_https disable_redirects"
        $redirect = "`nhttp://$Domain {`n`tredir $target{uri} permanent`n}`n"
    }
    return Expand-ConduitTemplate -Text $Template -Values ([ordered]@{
            ACME_EMAIL     = $Email
            HTTP_PORT      = $HttpPort
            HTTPS_PORT     = $HttpsPort
            GLOBAL_EXTRA   = $globalExtra
            REDIRECT_BLOCK = $redirect
            SITE_ADDRESS   = $site
            APP_PORT       = $AppPort
            ROOT_FWD       = ConvertTo-ForwardSlashPath $Root
        })
}

function ConvertTo-NamedArgument {
    <#
      Turns @('-Mode', 'All', '-Yes') into @{ Mode = 'All'; Yes = $true } for splatting. (Splatting a
      plain array passes everything positionally, so '-Mode' would become a value.)
    #>
    param([AllowEmptyCollection()][string[]]$Arguments = @())
    $named = @{}
    for ($i = 0; $i -lt $Arguments.Count; $i++) {
        $token = $Arguments[$i]
        if (-not $token.StartsWith('-') -or $token.Length -lt 2) { throw "Unexpected argument '$token'" }
        $name = $token.TrimStart('-')
        $next = if ($i + 1 -lt $Arguments.Count) { $Arguments[$i + 1] } else { $null }
        if ($null -ne $next -and -not $next.StartsWith('-')) { $named[$name] = $next; $i++ }
        else { $named[$name] = $true }
    }
    return $named
}

function Remove-PathEntry {
    <# A PATH value without $Entry (case-insensitive, ignoring a trailing backslash and empty parts). #>
    param([AllowEmptyString()][string]$PathValue, [Parameter(Mandatory)][string]$Entry)
    $target = $Entry.TrimEnd('\')
    $kept = @($PathValue -split ';' | Where-Object { $_ -and ($_.TrimEnd('\') -ne $target) })
    return ($kept -join ';')
}

function Get-TraySetting {
    <#
      The tray panel's settings (no secrets): built from config\conduit.env, the release VERSION and which
      database service exists. The panel can't read config\ itself (Administrators only).
    #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [ValidateSet('Postgres', 'MariaDB', 'None')][string]$Database = 'None'
    )
    $p = Get-ConduitPath $Root
    $env_ = Read-EnvFile $p.EnvFile
    $site = [Uri]$env_['CONDUIT_SITE_URL']
    $cache = [Uri]$env_['REDIS_URL']
    $dbUrl = [Uri]$env_['DATABASE_URL']
    $versionFile = Join-Path $p.App 'VERSION'
    $version = if (Test-Path -LiteralPath $versionFile) { (Get-Content -LiteralPath $versionFile -TotalCount 1).Trim() } else { '' }
    $https = if ($env_.Contains('CONDUIT_HTTPS_PORT') -and $env_['CONDUIT_HTTPS_PORT']) { [int]$env_['CONDUIT_HTTPS_PORT'] } else { $null }
    return [ordered]@{
        SiteUrl      = $env_['CONDUIT_SITE_URL'].TrimEnd('/')
        Domain       = $site.Host
        HttpPort     = [int]$env_['CONDUIT_HTTP_PORT']
        HttpsPort    = $https
        AppPort      = [int](($env_['CONDUIT_BIND'] -split ':')[-1])
        CachePort    = $cache.Port
        # Only checked when EvE Conduit runs the database itself.
        DatabasePort = $(if ($Database -ne 'None') { $dbUrl.Port } else { 0 })
        Database     = $Database
        Version      = $version
        Root         = $Root
    }
}

function Write-TraySetting {
    param(
        [Parameter(Mandatory)][string]$Root,
        [ValidateSet('Postgres', 'MariaDB', 'None')][string]$Database = 'None'
    )
    $dir = Join-Path $Root 'tray'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $json = (Get-TraySetting -Root $Root -Database $Database) | ConvertTo-Json
    [IO.File]::WriteAllText((Join-Path $dir 'settings.json'), $json, (New-Object Text.UTF8Encoding $false))
}

# --- Windows-only helpers --------------------------------------------------------------------

function Set-ConduitAcl {
    <#
      Locks the install folder down. Code and config are writable by Administrators/SYSTEM only;
      the services (Local Service) can read code, read config, and write data and logs.
    #>
    param([Parameter(Mandatory)][string]$Root)
    $p = Get-ConduitPath $Root
    $admins = '*S-1-5-32-544'   # Administrators (SIDs work on every display language)
    $system = '*S-1-5-18'
    $service = '*S-1-5-19'      # NT AUTHORITY\LOCAL SERVICE
    function Invoke-Icacls {
        & icacls @args /C /Q | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "icacls $($args -join ' ') failed (exit code $LASTEXITCODE)" }
    }
    # Set the permissions on a few folders and let everything below inherit them. Don't use /T with
    # /inheritance:r: that strips the inherited entries from each file too, and the (OI)(CI) grants
    # don't apply to files, which leaves them readable by no one.
    # This also runs during "conduit upgrade" with the database up, so data and logs keep their write
    # access at every moment: their own grant is made first, and /reset only touches what's inside them.
    # (Resetting the folders themselves would drop that grant, and PostgreSQL shuts down when it can't
    # write its files.)
    Invoke-Icacls $Root /inheritance:r /grant:r "${admins}:(OI)(CI)F" "${system}:(OI)(CI)F" "${service}:(OI)(CI)RX"
    $own = @($p.Data, $p.Logs, $p.Backups)
    foreach ($dir in @($p.Data, $p.Logs)) {
        if (Test-Path -LiteralPath $dir) { Invoke-Icacls $dir /grant "${service}:(OI)(CI)M" }
    }
    # Backups contain secrets: administrators only.
    if (Test-Path -LiteralPath $p.Backups) {
        Invoke-Icacls $p.Backups /inheritance:r /grant:r "${admins}:(OI)(CI)F" "${system}:(OI)(CI)F"
    }
    # Everything else, and the contents of those three, inherits again.
    foreach ($item in Get-ChildItem -LiteralPath $Root -Force) {
        if ($own -contains $item.FullName) {
            if (Get-ChildItem -LiteralPath $item.FullName -Force | Select-Object -First 1) {
                Invoke-Icacls (Join-Path $item.FullName '*') /reset /T
            }
        }
        else { Invoke-Icacls $item.FullName /reset /T }
    }
    # The tray panel runs as whoever is signed in: let all users read its folder (no secrets in it).
    $tray = Join-Path $Root 'tray'
    if (Test-Path -LiteralPath $tray) { Invoke-Icacls $tray /grant '*S-1-5-32-545:(OI)(CI)RX' }
}

function Wait-ConduitDatabase {
    <#
      Waits until the bundled PostgreSQL or MariaDB accepts connections. A database that was just
      started (or is recovering after a crash) refuses them for a while, which would fail migrate.
      Does nothing for a database server outside the install folder.
    #>
    param([Parameter(Mandatory)][string]$Root, [int]$TimeoutSeconds = 180)
    $p = Get-ConduitPath $Root
    $url = [Uri](Read-EnvFile $p.EnvFile)['DATABASE_URL']
    if ($url.Scheme -like 'postgres*') {
        $tool = Join-Path $p.Bin 'postgres\bin\pg_isready.exe'
        $toolArgs = @('-h', $url.Host, '-p', $(if ($url.Port -gt 0) { $url.Port } else { 5432 }), '-q')
    }
    else {
        $tool = Join-Path $p.Bin 'mariadb\bin\mariadb-admin.exe'
        $toolArgs = @('ping', '-h', $url.Host, '-P', $(if ($url.Port -gt 0) { $url.Port } else { 3306 }), '--silent')
    }
    if (-not (Test-Path -LiteralPath $tool)) { return }
    $ErrorActionPreference = 'Continue'  # the tool's complaints on stderr aren't errors here
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $said = $false
    while ($true) {
        & $tool @toolArgs 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { return }
        if ((Get-Date) -gt $deadline) { throw "The database didn't accept connections within $TimeoutSeconds seconds; see $($p.Logs)." }
        if (-not $said) { Write-Host 'Waiting for the database to accept connections...'; $said = $true }
        Start-Sleep -Seconds 2
    }
}

function Install-ConduitService {
    <# Copies WinSW as <id>.exe next to the filled-in <id>.xml and registers the service. #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$Id,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Values
    )
    $p = Get-ConduitPath $Root
    $template = Join-Path (Join-Path $p.App 'windows\winsw') "$Id.xml"
    $xml = Expand-ConduitTemplate -Text (Get-Content -LiteralPath $template -Raw) -Values $Values
    [xml]$xml | Out-Null  # fail early on broken XML
    New-Item -ItemType Directory -Force -Path $p.Services | Out-Null
    $exe = Join-Path $p.Services "$Id.exe"
    Copy-Item -LiteralPath (Join-Path $p.Bin 'winsw\WinSW-x64.exe') -Destination $exe -Force
    [System.IO.File]::WriteAllText((Join-Path $p.Services "$Id.xml"), $xml, [System.Text.UTF8Encoding]::new($false))
    if (Get-Service -Name $Id -ErrorAction SilentlyContinue) {
        Invoke-NativeCommand -FilePath $exe -ArgumentList @('stop') | Out-Null
        Invoke-NativeCommand -FilePath $exe -ArgumentList @('uninstall') | Out-Null
    }
    Invoke-NativeCommand -FilePath $exe -ArgumentList @('install') -FailMessage "Installing service $Id failed" | Out-Host
}

function Get-ConduitTrayCommand {
    param([Parameter(Mandatory)][string]$Root)
    return "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $Root 'tray\ConduitTray.ps1')`""
}

function Set-ConduitTrayAutostart {
    <# Starts the tray panel when any user signs in (HKLM Run), or stops doing so. #>
    param([Parameter(Mandatory)][string]$Root, [Parameter(Mandatory)][bool]$Enabled)
    $run = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'
    if ($Enabled) { Set-ItemProperty -Path $run -Name 'EvE Conduit Tray' -Value (Get-ConduitTrayCommand $Root) }
    else { Remove-ItemProperty -Path $run -Name 'EvE Conduit Tray' -ErrorAction SilentlyContinue }
}

function Start-ConduitTray {
    param([Parameter(Mandatory)][string]$Root)
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', "`"$(Join-Path $Root 'tray\ConduitTray.ps1')`"")
}

function Set-ConduitUninstallEntry {
    <# The "Apps & features" entry, so EvE Conduit can be removed like any other program. #>
    param([Parameter(Mandatory)][string]$Root, [Parameter(Mandatory)][string]$Version)
    $key = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\EveConduit'
    New-Item -Path $key -Force | Out-Null
    $values = [ordered]@{
        DisplayName     = 'EvE Conduit'
        DisplayVersion  = $Version
        Publisher       = 'EvE Conduit'
        InstallLocation = $Root
        UninstallString = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $Root 'uninstall.ps1')`""
        URLInfoAbout    = 'https://github.com/EvE-Conduit/Eve-conduit'
    }
    foreach ($name in $values.Keys) { Set-ItemProperty -Path $key -Name $name -Value $values[$name] }
    New-ItemProperty -Path $key -Name NoModify -Value 1 -PropertyType DWord -Force | Out-Null
    New-ItemProperty -Path $key -Name NoRepair -Value 1 -PropertyType DWord -Force | Out-Null
}

function Invoke-NativeCommand {
    <#
      Runs an external program and passes its output on, stderr included, as plain text. Success is judged by the
      exit code only. Windows PowerShell 5.1 otherwise turns any stderr line into an error when its output is
      captured (as under the setup wizard), and with ErrorActionPreference Stop that aborts on a mere warning.
    #>
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [string[]]$ArgumentList = @(),
        [string]$FailMessage = ''
    )
    $ErrorActionPreference = 'Continue'
    & $FilePath @ArgumentList 2>&1 | ForEach-Object {
        if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { $_ }
    }
    $code = $LASTEXITCODE
    if ($code -ne 0 -and $FailMessage) { throw "$FailMessage (exit code $code)" }
}

function Invoke-ConduitPython {
    <# Runs the service launcher (e.g. "manage migrate") with the install's Python. #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string[]]$Arguments
    )
    $p = Get-ConduitPath $Root
    $python = Join-Path $p.Venv 'Scripts\python.exe'
    $launcher = Join-Path $p.App 'windows\service\conduit_service.py'
    $env:CONDUIT_ROOT = $Root
    Invoke-NativeCommand -FilePath $python -ArgumentList (@($launcher) + $Arguments) -FailMessage "Command failed: $($Arguments -join ' ')"
}

function Install-ConduitPythonPackage {
    <# Installs the backend, waitress and every plugin (plugins.txt and plugins-site.txt) into the venv. #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$ReleaseDir,
        [switch]$MariaDb
    )
    $p = Get-ConduitPath $Root
    $python = Join-Path $p.Venv 'Scripts\python.exe'
    $backend = if ($MariaDb) { '.\backend[mysql]' } else { '.\backend' }
    # Keep pip's cache and temporary build files inside the install folder.
    New-Item -ItemType Directory -Force -Path $p.Tmp, $p.Cache | Out-Null
    $env:PIP_CACHE_DIR = Join-Path $p.Cache 'pip'
    $env:TEMP = $p.Tmp
    $env:TMP = $p.Tmp
    Push-Location $ReleaseDir
    try {
        # Not --quiet: pip's "Collecting ..." lines and download bars are the progress indicator.
        Invoke-NativeCommand -FilePath $python -ArgumentList @('-m', 'pip', 'install', '--upgrade', '--disable-pip-version-check', $backend, 'waitress>=3') `
            -FailMessage 'Installing the EvE Conduit backend failed' | Out-Host
        if ((Test-Path -LiteralPath $p.Plugins) -and (Get-PluginRequirement $p.Plugins)) {
            Invoke-NativeCommand -FilePath $python -ArgumentList @('-m', 'pip', 'install', '--upgrade', '--disable-pip-version-check', '-r', $p.Plugins) `
                -FailMessage 'Installing plugins failed' | Out-Host
        }
        if ((Test-Path -LiteralPath $p.PluginsSite) -and (Get-PluginRequirement $p.PluginsSite)) {
            Invoke-NativeCommand -FilePath $python -ArgumentList @('-m', 'pip', 'install', '--upgrade', '--disable-pip-version-check', '-r', $p.PluginsSite) `
                -FailMessage 'Installing plugins from Administration -> Plugins failed' | Out-Host
        }
    }
    finally { Pop-Location }
}

function Publish-ConduitWeb {
    <# Replaces the served front end with the one from a release. #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$ReleaseDir
    )
    $p = Get-ConduitPath $Root
    $new = "$($p.Web).new"
    if (Test-Path -LiteralPath $new) { Remove-Item -LiteralPath $new -Recurse -Force }
    Copy-Item -LiteralPath (Join-Path $ReleaseDir 'web') -Destination $new -Recurse
    # Date the files now. Caddy's ETag is date + size, and a new index.html is usually the same size
    # as the old one, so with the date from the zip browsers would be told nothing changed.
    $now = Get-Date
    Get-ChildItem -LiteralPath $new -Recurse -File | ForEach-Object { $_.LastWriteTime = $now }
    if (Test-Path -LiteralPath $p.Web) { Remove-Item -LiteralPath $p.Web -Recurse -Force }
    Move-Item -LiteralPath $new -Destination $p.Web
}

function Set-ConduitAppLink {
    <# Points <root>\app (a directory junction) at a release folder. #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][string]$ReleaseDir
    )
    $p = Get-ConduitPath $Root
    if (Test-Path -LiteralPath $p.App) {
        # Removing a junction must not touch the folder it points to.
        [System.IO.Directory]::Delete($p.App, $false)
    }
    New-Item -ItemType Junction -Path $p.App -Target $ReleaseDir | Out-Null
}

# --- updates ---------------------------------------------------------------------------------------------------------
# The website downloads and verifies releases into data\updates and leaves install-request.json there when an
# administrator clicks Install. The website runs as Local Service and can't stop services or replace code, so a
# scheduled task running as SYSTEM ("conduit apply-update") does the install. It trusts nothing in that folder:
# it copies the files somewhere only administrators can write, checks the signature again and only then upgrades.
$script:UpdaterTaskName = 'EvE Conduit updater'

function Get-ConduitUpdatesDir {
    param([Parameter(Mandatory)][string]$Root)
    $p = Get-ConduitPath $Root
    $configured = if (Test-Path -LiteralPath $p.EnvFile) { (Read-EnvFile $p.EnvFile)['CONDUIT_UPDATES_DIR'] } else { $null }
    if ($configured) { return $configured }
    return Join-Path $p.Data 'updates'
}

function Get-ConduitUpdateRequest {
    <#
      Reads and checks install-request.json. Returns @{ Version; File } or throws. Only a plain version number and
      the matching release file name are accepted, so a request can't point the updater anywhere else.
    #>
    param([Parameter(Mandatory)][string]$Json)
    $req = $Json | ConvertFrom-Json
    $version = [string]$req.version
    if ($version -notmatch '^\d{1,4}\.\d{1,4}\.\d{1,4}$') { throw "The update request has an invalid version: '$version'" }
    $file = "eve-conduit-$version-windows.zip"
    if ([string]$req.file -ne $file) { throw "The update request names an unexpected file: '$($req.file)'" }
    return @{ Version = $version; File = $file }
}

function Write-ConduitUpdateResult {
    <# install-result.json, read by the website to show how the install went. #>
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Version,
        [Parameter(Mandatory)][ValidateSet('running', 'succeeded', 'failed')][string]$Status,
        [string]$Message = ''
    )
    $json = [ordered]@{ version = $Version; status = $Status; message = $Message; at = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json
    [IO.File]::WriteAllText($Path, $json, (New-Object Text.UTF8Encoding $false))
}

function Set-ConduitProgress {
    <#
      How far an update has got: progress.json in the updates folder (for the website) and in the tray folder (the
      tray panel runs as the signed-in user, who can only read that folder). -Clear removes both when it's over.
      Steps: backup, install, migrate, restart.
    #>
    param(
        [Parameter(Mandatory)][string]$Root,
        [ValidateSet('release', 'plugins')][string]$Kind = 'release',
        [string]$Target = '',
        [ValidateSet('backup', 'install', 'migrate', 'restart')][string]$Step = 'backup',
        [switch]$Clear
    )
    $paths = @((Join-Path (Get-ConduitUpdatesDir -Root $Root) 'progress.json'), (Join-Path (Join-Path $Root 'tray') 'progress.json'))
    if ($Clear) {
        foreach ($path in $paths) { Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue }
        $script:ProgressStarted = $null
        return
    }
    $now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    if (-not (Get-Variable -Name ProgressStarted -Scope Script -ErrorAction SilentlyContinue) -or -not $script:ProgressStarted) { $script:ProgressStarted = $now }
    $json = [ordered]@{ kind = $Kind; target = $Target; step = $Step; started_at = $script:ProgressStarted; at = $now } | ConvertTo-Json -Compress
    foreach ($path in $paths) {
        if (-not (Test-Path -LiteralPath (Split-Path $path -Parent))) { continue }
        try { [IO.File]::WriteAllText($path, $json, (New-Object Text.UTF8Encoding $false)) }
        catch { Write-Verbose "Couldn't write $path ($_)" }   # progress is only informative
    }
}

function Register-ConduitUpdater {
    <# The SYSTEM task that installs updates an administrator asked for on the website. Checks every two minutes. #>
    param([Parameter(Mandatory)][string]$Root)
    $script = Join-Path $Root 'conduit.ps1'
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$script`" apply-update"
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
    $principal = New-ScheduledTaskPrincipal -UserId 'S-1-5-18' -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
        -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Register-ScheduledTask -TaskName $script:UpdaterTaskName -Action $action -Trigger $trigger -Principal $principal `
        -Settings $settings -Description 'Installs EvE Conduit updates that an administrator approved on the website.' -Force | Out-Null
}

function Unregister-ConduitUpdater {
    Unregister-ScheduledTask -TaskName $script:UpdaterTaskName -Confirm:$false -ErrorAction SilentlyContinue
}

Export-ModuleMember -Function *-*
