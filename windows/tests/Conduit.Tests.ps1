# Pester tests for windows\scripts\Conduit.psm1 (runs on Windows, Linux and macOS PowerShell):
#   Invoke-Pester windows/tests
# -ForEach lists are built during discovery, so the module must be loaded then too.
BeforeDiscovery {
    Import-Module (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'scripts') 'Conduit.psm1') -Force
    $serviceIds = Get-ConduitServiceId
}
BeforeAll {
    Import-Module (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'scripts') 'Conduit.psm1') -Force
}

Describe 'New-ConduitSecret' {
    It 'has the requested length and only letters and digits' {
        $s = New-ConduitSecret 60
        $s.Length | Should -Be 60
        $s | Should -Match '^[A-Za-z0-9]+$'
    }
    It 'is different every time' {
        (New-ConduitSecret) | Should -Not -Be (New-ConduitSecret)
    }
}

Describe 'New-FernetKey' {
    It 'is 32 bytes of URL-safe base64, as Fernet expects' {
        $k = New-FernetKey
        $k.Length | Should -Be 44
        $k | Should -Match '^[A-Za-z0-9_-]{43}=$'
        [Convert]::FromBase64String($k.Replace('-', '+').Replace('_', '/')).Length | Should -Be 32
    }
}

Describe 'Env file round trip' {
    It 'writes and reads back values, skipping comments' {
        $path = Join-Path ([IO.Path]::GetTempPath()) "conduit-test-$([guid]::NewGuid()).env"
        try {
            Write-EnvFile -Path $path -Header "line one`nline two" -Values ([ordered]@{ A = '1'; URL = 'postgres://u:p@h:5432/db'; EMPTY = '' })
            $raw = [IO.File]::ReadAllBytes($path)
            $raw[0] | Should -Not -Be 0xEF  # no UTF-8 BOM
            $values = Read-EnvFile $path
            $values['A'] | Should -Be '1'
            $values['URL'] | Should -Be 'postgres://u:p@h:5432/db'
            $values['EMPTY'] | Should -Be ''
            @($values.Keys) | Should -Be @('A', 'URL', 'EMPTY')
        }
        finally { Remove-Item $path -ErrorAction SilentlyContinue }
    }
    It 'refuses values with line breaks' {
        { Write-EnvFile -Path (Join-Path ([IO.Path]::GetTempPath()) 'x.env') -Values @{ A = "a`nB=evil" } } | Should -Throw '*line break*'
    }
    It 'strips matching quotes like the Python launcher does' {
        $path = Join-Path ([IO.Path]::GetTempPath()) "conduit-test-$([guid]::NewGuid()).env"
        try {
            Set-Content -LiteralPath $path -Value @('# c', 'Q="two words"', "S='x=y'", 'BROKEN')
            $v = Read-EnvFile $path
            $v['Q'] | Should -Be 'two words'
            $v['S'] | Should -Be 'x=y'
            $v.Contains('BROKEN') | Should -BeFalse
        }
        finally { Remove-Item $path -ErrorAction SilentlyContinue }
    }
}

Describe 'Expand-ConduitTemplate' {
    It 'fills placeholders' {
        Expand-ConduitTemplate -Text 'a {{X}} b {{Y}}' -Values @{ X = 1; Y = 'two' } | Should -Be 'a 1 b two'
    }
    It 'fails on unfilled placeholders' {
        { Expand-ConduitTemplate -Text '{{X}} {{MISSING}}' -Values @{ X = 1 } } | Should -Throw '*MISSING*'
    }
}

Describe 'WinSW service templates' {
    BeforeAll {
        $values = [ordered]@{
            ROOT = 'C:\EvE-Conduit'; ROOT_FWD = 'C:/EvE-Conduit'; CACHE_PORT = 6380
            DB_DEPEND = "`r`n  <depend>conduit-postgres</depend>"
        }
        $templates = Get-ChildItem (Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw') -Filter *.xml
    }
    It 'has one template per service' {
        @($templates.BaseName | Sort-Object) | Should -Be @(Get-ConduitServiceId | Sort-Object)
    }
    It '<_> fills completely into valid XML that runs as Local Service' -ForEach $serviceIds {
        $file = Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw') "$_.xml"
        [xml]$xml = Expand-ConduitTemplate -Text (Get-Content $file -Raw) -Values $values
        $xml.service.id | Should -Be $_
        $xml.service.serviceaccount.user | Should -Be 'LocalService'
        $xml.service.executable | Should -BeLike 'C:\EvE-Conduit\*'
    }
    It 'makes the app services wait for Garnet and the database' {
        [xml]$xml = Expand-ConduitTemplate -Text (Get-Content (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw') 'conduit-worker.xml') -Raw) -Values $values
        @($xml.service.depend) | Should -Be @('conduit-garnet', 'conduit-postgres')
    }
    It 'starts Garnet with Lua (Celery needs it), the chosen port and the private .NET runtime' {
        [xml]$xml = Expand-ConduitTemplate -Text (Get-Content (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw') 'conduit-garnet.xml') -Raw) -Values $values
        $xml.service.arguments | Should -Match '--lua'
        $xml.service.arguments | Should -Match '--port 6380 '
        ($xml.service.env | Where-Object name -eq 'DOTNET_ROOT').value | Should -Be 'C:\EvE-Conduit\bin\dotnet'
    }
    It 'runs the databases from the install folder with a clean stop command' {
        $dir = Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw'
        [xml]$pg = Expand-ConduitTemplate -Text (Get-Content (Join-Path $dir 'conduit-postgres.xml') -Raw) -Values $values
        $pg.service.executable | Should -Be 'C:\EvE-Conduit\bin\postgres\bin\postgres.exe'
        $pg.service.startarguments | Should -Be '-D "C:\EvE-Conduit\data\postgres"'
        $pg.service.stopexecutable | Should -Be 'C:\EvE-Conduit\bin\postgres\bin\pg_ctl.exe'
        $pg.service.stoparguments | Should -Be 'stop -D "C:\EvE-Conduit\data\postgres" -m fast -w'
        [xml]$mdb = Expand-ConduitTemplate -Text (Get-Content (Join-Path $dir 'conduit-mariadb.xml') -Raw) -Values $values
        $mdb.service.executable | Should -Be 'C:\EvE-Conduit\bin\mariadb\bin\mariadbd.exe'
        $mdb.service.stoparguments | Should -BeLike '*shutdown'
    }
    It 'never points a service outside the install folder' {
        foreach ($f in Get-ChildItem (Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw') -Filter *.xml) {
            [xml]$xml = Expand-ConduitTemplate -Text (Get-Content $f.FullName -Raw) -Values $values
            $xml.service.executable | Should -BeLike 'C:\EvE-Conduit\*'
            if ($xml.service.stopexecutable) { $xml.service.stopexecutable | Should -BeLike 'C:\EvE-Conduit\*' }
        }
    }
}

Describe 'Pinned downloads' {
    It '<_> is an https download from its publisher with a SHA-256' -ForEach @('uv', 'caddy', 'garnet', 'winsw', 'dotnet', 'postgres', 'mariadb', 'vcredist') {
        $d = Get-ConduitDownload $_
        $d.Url | Should -Match '^https://(github\.com/[^/]+/[^/]+/releases/download/|builds\.dotnet\.microsoft\.com/|get\.enterprisedb\.com/|archive\.mariadb\.org/|download\.visualstudio\.microsoft\.com/)'
        $d.Sha256 | Should -Match '^[0-9a-f]{64}$'
    }
}

Describe 'Assert-FileHash' {
    It 'accepts a matching file and deletes a tampered one' {
        $path = Join-Path ([IO.Path]::GetTempPath()) "conduit-hash-$([guid]::NewGuid()).bin"
        Set-Content -LiteralPath $path -Value 'hello' -NoNewline
        $good = (Get-FileHash $path -Algorithm SHA256).Hash.ToLower()
        { Assert-FileHash -Path $path -Sha256 $good } | Should -Not -Throw
        { Assert-FileHash -Path $path -Sha256 ('0' * 64) } | Should -Throw '*Checksum mismatch*'
        Test-Path $path | Should -BeFalse
    }
}

Describe 'Release helpers' {
    It 'reads the VERSION file and module list' {
        $dir = Join-Path ([IO.Path]::GetTempPath()) "conduit-rel-$([guid]::NewGuid())"
        New-Item -ItemType Directory $dir | Out-Null
        try {
            Set-Content (Join-Path $dir 'VERSION') '1.2.3'
            Set-Content (Join-Path $dir 'requirements-modules.txt') @('# comment', '', './modules/conduit-example', '  conduit-skills==1.0  ')
            Get-ReleaseVersion $dir | Should -Be '1.2.3'
            Get-ModuleRequirement (Join-Path $dir 'requirements-modules.txt') | Should -Be @('./modules/conduit-example', 'conduit-skills==1.0')
            Set-Content (Join-Path $dir 'VERSION') '1.0; rm -rf'
            { Get-ReleaseVersion $dir } | Should -Throw
        }
        finally { Remove-Item $dir -Recurse -Force }
    }
    It 'converts paths for Caddy' {
        ConvertTo-ForwardSlashPath 'C:\EvE-Conduit\data' | Should -Be 'C:/EvE-Conduit/data'
    }
}

Describe 'Install folder rules' {
    It 'suggests C:\EvE-Conduit' {
        Get-DefaultInstallRoot | Should -Be 'C:\EvE-Conduit'
    }
    It 'accepts <_>' -ForEach @('C:\EvE-Conduit', 'D:\EvE-Conduit', 'D:\Program Files\EvE-Conduit', 'E:\Servers\Alliance Auth\EvE-Conduit', 'c:\conduit-2') {
        Get-InstallRootProblem $_ | Should -BeNullOrEmpty
    }
    It 'rejects <Path> (<Why>)' -ForEach @(
        @{ Path = ''; Why = 'empty' }
        @{ Path = 'EvE Conduit'; Why = 'relative' }
        @{ Path = '\\server\share\EvE-Conduit'; Why = 'network path' }
        @{ Path = 'C:\'; Why = 'drive root' }
        @{ Path = 'C:'; Why = 'drive only' }
        @{ Path = 'C:\Windows\EvE-Conduit'; Why = 'inside Windows' }
        @{ Path = 'c:\users\me\EvE-Conduit'; Why = 'inside Users' }
        @{ Path = 'C:\ProgramData'; Why = 'ProgramData' }
        @{ Path = 'C:\EVE & CSM'; Why = 'ampersand breaks XML' }
        @{ Path = 'C:\EVE%PATH%'; Why = 'percent is expanded by WinSW' }
        @{ Path = 'C:\a;b'; Why = 'semicolon breaks PATH' }
        @{ Path = 'C:\EvE-Conduit\..\x:y'; Why = 'extra colon' }
        @{ Path = 'C:\EvE-Conduit\\data'; Why = 'empty folder name' }
        @{ Path = 'C:\EvE-Conduit \data'; Why = 'name ends with space' }
        @{ Path = 'C:\EvE-Conduit.\data'; Why = 'name ends with dot' }
        @{ Path = ('C:\' + ('x' * 80)); Why = 'too long' }
    ) {
        Get-InstallRootProblem $Path | Should -Not -BeNullOrEmpty
    }
    It 'tidies typed input' {
        Format-InstallRoot '  "D:\EvE-Conduit\"  ' | Should -Be 'D:\EvE-Conduit'
        Format-InstallRoot 'D:\Program Files\EvE-Conduit\' | Should -Be 'D:\Program Files\EvE-Conduit'
        Format-InstallRoot 'C:\' | Should -Be 'C:\'
    }
    It 'fills service definitions correctly for a folder with spaces' {
        $file = Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'winsw') 'conduit-caddy.xml'
        $values = [ordered]@{ ROOT = 'D:\Program Files\EvE-Conduit'; ROOT_FWD = 'D:/Program Files/EvE-Conduit'; SITE_ADDRESS = 'a.example'; ACME_EMAIL = 'x@y.z'; DB_DEPEND = '' }
        [xml]$xml = Expand-ConduitTemplate -Text (Get-Content $file -Raw) -Values $values
        $xml.service.executable | Should -Be 'D:\Program Files\EvE-Conduit\bin\caddy\caddy.exe'
        $xml.service.arguments | Should -Be 'run --config "D:\Program Files\EvE-Conduit\config\Caddyfile" --adapter caddyfile'
        ($xml.service.env | Where-Object name -eq 'CONDUIT_ROOT').value | Should -Be 'D:\Program Files\EvE-Conduit'
    }
}


Describe 'Service order' {
    It 'starts the database and cache first and Caddy last' {
        Get-ConduitServiceId -Database Postgres | Should -Be @('conduit-postgres', 'conduit-garnet', 'conduit-web', 'conduit-worker', 'conduit-beat', 'conduit-caddy')
        Get-ConduitServiceId -Database MariaDB | Should -Be @('conduit-mariadb', 'conduit-garnet', 'conduit-web', 'conduit-worker', 'conduit-beat', 'conduit-caddy')
        Get-ConduitServiceId -Database None | Should -Be @('conduit-garnet', 'conduit-web', 'conduit-worker', 'conduit-beat', 'conduit-caddy')
    }
}

Describe 'Ports' {
    It 'suggests the usual ports' {
        $d = Get-DefaultPort
        @($d.Http, $d.Https, $d.App, $d.Cache, $d.Postgres, $d.MariaDB) | Should -Be @(80, 443, 8000, 6379, 5432, 3306)
    }
    It 'accepts a clean set' {
        Get-PortProblem -Ports ([ordered]@{ Http = 80; Https = 443; App = 8000; Cache = 6379 }) | Should -BeNullOrEmpty
    }
    It 'reports out-of-range ports, clashes, ports in use and reserved ranges' {
        $problems = Get-PortProblem -Ports ([ordered]@{ Http = 0; Https = 443; App = 443; Cache = 6379; Database = 50010 }) -Taken @(6379) -Excluded @(, @(50000, 50059))
        $problems.Count | Should -Be 4
        ($problems -join "`n") | Should -Match "Http port '0'"
        ($problems -join "`n") | Should -Match 'App and Https'
        ($problems -join "`n") | Should -Match 'Port 6379 \(Cache\) is already in use'
        ($problems -join "`n") | Should -Match 'reserved by Windows'
    }
    It 'reads netsh excluded port ranges' {
        $sample = @(
            '', 'Protocol tcp Port Exclusion Ranges', '',
            'Start Port    End Port', '----------    --------',
            '      5357        5357', '     50000       50059     *', '     61234       61333', '',
            '* - Administered port exclusions.'
        )
        $ranges = ConvertFrom-ExcludedPortRange $sample
        $ranges.Count | Should -Be 3
        $ranges[1][0] | Should -Be 50000
        $ranges[1][1] | Should -Be 50059
    }
    It 'lists listening ports as numbers' {
        @(Get-ListeningPort | Where-Object { $_ -isnot [int] }).Count | Should -Be 0
    }
}

Describe 'Public site address' {
    It '<Expected>' -ForEach @(
        @{ Http = 80; Https = 443; NoTls = $false; Std = $false; Expected = 'https://auth.example.com' }
        @{ Http = 8080; Https = 8443; NoTls = $false; Std = $true; Expected = 'https://auth.example.com' }
        @{ Http = 8080; Https = 8443; NoTls = $false; Std = $false; Expected = 'https://auth.example.com:8443' }
        @{ Http = 80; Https = 443; NoTls = $true; Std = $false; Expected = 'http://auth.example.com' }
        @{ Http = 8080; Https = 443; NoTls = $true; Std = $false; Expected = 'http://auth.example.com:8080' }
    ) {
        Get-PublicSiteUrl -Domain 'auth.example.com' -HttpPort $Http -HttpsPort $Https -NoTls:$NoTls -StandardPublicPorts:$Std | Should -Be $Expected
    }
}

Describe 'Generated Caddyfile' {
    BeforeAll {
        $template = Get-Content (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'caddy') 'Caddyfile.template') -Raw
        $common = @{ Template = $template; Domain = 'auth.example.com'; Email = 'a@b.c'; Root = 'D:\Program Files\EvE-Conduit'; AppPort = 8001 }
    }
    It 'uses Caddy''s own redirects on 80/443' {
        $c = New-ConduitCaddyfile @common -HttpPort 80 -HttpsPort 443
        $c | Should -Not -Match 'disable_redirects'
        $c | Should -Match 'reverse_proxy 127\.0\.0\.1:8001'
        $c | Should -Match 'root \* "D:/Program Files/EvE-Conduit/web"'
        $c | Should -Not -Match '\{\{'
    }
    It 'redirects to the standard address when the router forwards 80/443' {
        $c = New-ConduitCaddyfile @common -HttpPort 8080 -HttpsPort 8443 -StandardPublicPorts
        $c | Should -Match 'http_port 8080'
        $c | Should -Match 'https_port 8443'
        $c | Should -Match 'auto_https disable_redirects'
        $c | Should -Match 'redir https://auth\.example\.com\{uri\} permanent'
    }
    It 'redirects to the chosen port when it is public' {
        $c = New-ConduitCaddyfile @common -HttpPort 8080 -HttpsPort 8443
        $c | Should -Match 'redir https://auth\.example\.com:8443\{uri\} permanent'
    }
    It 'serves plain HTTP with -NoTls' {
        $c = New-ConduitCaddyfile @common -HttpPort 8080 -HttpsPort 443 -NoTls
        $c | Should -Match '(?m)^http://auth\.example\.com \{'
        $c | Should -Not -Match 'redir'
    }
}

Describe 'Expand-ZipSubset' {
    BeforeAll {
        Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
        function New-TestZip([string]$Path, [string[]]$Entries) {
            $zip = [System.IO.Compression.ZipFile]::Open($Path, 'Create')
            try {
                foreach ($e in $Entries) {
                    $w = New-Object IO.StreamWriter ($zip.CreateEntry($e).Open())
                    try { $w.Write("content of $e") } finally { $w.Dispose() }
                }
            }
            finally { $zip.Dispose() }
        }
    }
    It 'extracts only the wanted folders and strips the prefix' {
        $tmp = Join-Path ([IO.Path]::GetTempPath()) "conduit-zip-$([guid]::NewGuid())"
        New-Item -ItemType Directory $tmp | Out-Null
        try {
            New-TestZip (Join-Path $tmp 't.zip') @('pgsql/bin/postgres.exe', 'pgsql/lib/x.dll', 'pgsql/pgAdmin 4/big.bin', 'pgsql/doc/readme.txt')
            Expand-ZipSubset -Zip (Join-Path $tmp 't.zip') -Prefix 'pgsql/bin/', 'pgsql/lib/' -Destination (Join-Path $tmp 'out') -StripPrefix 'pgsql/' | Should -Be 2
            Test-Path (Join-Path $tmp 'out/bin/postgres.exe') | Should -BeTrue
            Test-Path (Join-Path $tmp 'out/pgAdmin 4') | Should -BeFalse
        }
        finally { Remove-Item $tmp -Recurse -Force }
    }
    It 'refuses paths that climb out of the destination' {
        $tmp = Join-Path ([IO.Path]::GetTempPath()) "conduit-zip-$([guid]::NewGuid())"
        New-Item -ItemType Directory $tmp | Out-Null
        try {
            New-TestZip (Join-Path $tmp 'evil.zip') @('pgsql/bin/../../escaped.txt')
            { Expand-ZipSubset -Zip (Join-Path $tmp 'evil.zip') -Prefix 'pgsql/bin/' -Destination (Join-Path $tmp 'out') -StripPrefix 'pgsql/' } | Should -Throw '*unsafe path*'
        }
        finally { Remove-Item $tmp -Recurse -Force }
    }
}

Describe 'Expand-VcRuntime' {
    # Needs the real redistributable and 7-Zip (standing in for expand.exe) when not on Windows:
    #   CONDUIT_TEST_VCREDIST=path/to/VC_redist.x64.exe CONDUIT_TEST_7Z=path/to/7z pwsh windows/tests/run-tests.ps1
    It 'unpacks the runtime DLLs without installing anything' -Skip:(-not $env:CONDUIT_TEST_VCREDIST) {
        $out = Join-Path ([IO.Path]::GetTempPath()) "conduit-vc-$([guid]::NewGuid())"
        New-Item -ItemType Directory $out | Out-Null
        try {
            $extractor = if ($env:CONDUIT_TEST_7Z) {
                $sevenZip = $env:CONDUIT_TEST_7Z
                { param($Cab, $OutDir) & $sevenZip x -y -bso0 -bsp0 $Cab "-o$OutDir"; if ($LASTEXITCODE) { throw '7z failed' } }.GetNewClosure()
            }
            else { $null }
            $params = @{ Installer = $env:CONDUIT_TEST_VCREDIST; Destination = $out }
            if ($extractor) { $params.Extractor = $extractor }
            Expand-VcRuntime @params | Should -Be @('msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll')
            foreach ($dll in 'msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll') {
                $bytes = [IO.File]::ReadAllBytes((Join-Path $out $dll))
                [Text.Encoding]::ASCII.GetString($bytes, 0, 2) | Should -Be 'MZ'
            }
            @(Get-ChildItem $out -Force).Count | Should -Be 3   # temporary files cleaned up
        }
        finally { Remove-Item $out -Recurse -Force }
    }
}

Describe 'ConvertTo-NamedArgument' {
    It 'turns command-line style options into named parameters' {
        $n = ConvertTo-NamedArgument @('-Mode', 'All', '-Yes', '-BackupTo', 'D:\Backups')
        $n.Mode | Should -Be 'All'
        $n.Yes | Should -BeTrue
        $n.BackupTo | Should -Be 'D:\Backups'
    }
    It 'handles nothing and rejects stray values' {
        (ConvertTo-NamedArgument @()).Count | Should -Be 0
        { ConvertTo-NamedArgument @('All') } | Should -Throw '*Unexpected*'
    }
}

Describe 'Remove-PathEntry' {
    It 'removes the install folder from PATH, ignoring case and a trailing backslash' {
        Remove-PathEntry -PathValue 'C:\Windows;D:\EvE-Conduit\;C:\Tools;;' -Entry 'd:\eve-conduit' | Should -Be 'C:\Windows;C:\Tools'
        Remove-PathEntry -PathValue 'C:\Windows' -Entry 'D:\EvE-Conduit' | Should -Be 'C:\Windows'
    }
}

Describe 'Tray settings' {
    It 'are built from the config, without secrets' {
        $root = Join-Path ([IO.Path]::GetTempPath()) "conduit-tray-$([guid]::NewGuid())"
        New-Item -ItemType Directory -Force -Path (Join-Path $root 'config'), (Join-Path $root 'app') | Out-Null
        try {
            Write-EnvFile -Path (Join-Path $root 'config/conduit.env') -Values ([ordered]@{
                    CONDUIT_SECRET_KEY = 'very-secret'; CONDUIT_SITE_URL = 'https://auth.example.com:8443'
                    CONDUIT_BIND = '127.0.0.1:8001'; REDIS_URL = 'redis://127.0.0.1:6380/0'
                    DATABASE_URL = 'postgres://conduit:hunter2@127.0.0.1:5433/conduit'; CONDUIT_HTTP_PORT = '8080'; CONDUIT_HTTPS_PORT = '8443'
                })
            Set-Content (Join-Path $root 'app/VERSION') '1.2.3'
            $s = Get-TraySetting -Root $root -Database Postgres
            $s.SiteUrl | Should -Be 'https://auth.example.com:8443'
            $s.Domain | Should -Be 'auth.example.com'
            @($s.HttpPort, $s.HttpsPort, $s.AppPort, $s.CachePort, $s.DatabasePort) | Should -Be @(8080, 8443, 8001, 6380, 5433)
            $s.Version | Should -Be '1.2.3'
            Write-TraySetting -Root $root -Database Postgres
            $json = Get-Content (Join-Path $root 'tray/settings.json') -Raw
            $json | Should -Not -Match 'very-secret|hunter2'
            Import-Module (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'tray') 'ConduitHealth.psm1') -Force
            (Read-TraySetting (Join-Path $root 'tray/settings.json')).AppPort | Should -Be 8001
        }
        finally { Remove-Item $root -Recurse -Force }
    }
}

Describe 'Health verdict' {
    BeforeAll {
        Import-Module (Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'tray') 'ConduitHealth.psm1') -Force
        $settings = [pscustomobject]@{ SiteUrl = 'http://x'; Domain = 'x'; HttpPort = 80; AppPort = 8000; CachePort = 6379; DatabasePort = 5432; Version = '1'; Root = 'C:\EvE-Conduit' }
        $allUp = { param($Kind, $Port, $HostHeader) 'answers' }
        $running = [ordered]@{ 'conduit-postgres' = 'Running'; 'conduit-garnet' = 'Running'; 'conduit-web' = 'Running'; 'conduit-worker' = 'Running'; 'conduit-beat' = 'Running'; 'conduit-caddy' = 'Running' }
    }
    It 'is Healthy when everything runs and answers' {
        (Get-ConduitHealth -Settings $settings -ServiceStatus $running -Probe $allUp).Overall | Should -Be 'Healthy'
    }
    It 'is Degraded when only a background service is stopped' {
        $s = [ordered]@{} + $running; $s['conduit-beat'] = 'Stopped'
        $h = Get-ConduitHealth -Settings $settings -ServiceStatus $s -Probe $allUp
        $h.Overall | Should -Be 'Degraded'
        $h.Summary | Should -Match 'Scheduler'
    }
    It 'is Down when a core service runs but does not answer' {
        $cacheDead = { param($Kind, $Port, $HostHeader) if ($Kind -eq 'Cache') { '' } else { 'answers' } }
        $h = Get-ConduitHealth -Settings $settings -ServiceStatus $running -Probe $cacheDead
        $h.Overall | Should -Be 'Down'
        ($h.Items | Where-Object Id -eq 'conduit-garnet').Detail | Should -Match 'nothing answers on port 6379'
    }
    It 'shows a starting service as needing attention, not down' {
        $s = [ordered]@{} + $running; $s['conduit-web'] = 'StartPending'
        $h = Get-ConduitHealth -Settings $settings -ServiceStatus $s -Probe $allUp
        $h.Overall | Should -Be 'Degraded'
        ($h.Items | Where-Object Id -eq 'conduit-web').Detail | Should -Be 'starting...'
    }
    It 'skips the database when EvE Conduit does not run one' {
        $s = [ordered]@{} + $running; $s.Remove('conduit-postgres')
        @((Get-ConduitHealth -Settings $settings -ServiceStatus $s -Probe $allUp).Items | Where-Object Id -like '*postgres*').Count | Should -Be 0
    }
    It 'says when nothing is installed' {
        (Get-ConduitHealth -Settings $settings -ServiceStatus ([ordered]@{}) -Probe $allUp).Overall | Should -Be 'NotInstalled'
    }
}
