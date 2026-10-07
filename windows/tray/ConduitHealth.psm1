# Health checks for the EvE Conduit tray panel. Windows-independent on purpose (no Get-Service, no
# WinForms) so it can be tested on any OS: service states are passed in, and the network checks use
# plain TCP and HTTP. Must keep working on Windows PowerShell 5.1.

Set-StrictMode -Version Latest

# What each component is, in the order shown in the panel. Core components take the site down when
# they fail; the others only degrade it (e.g. no background syncs).
$script:Components = @(
    @{ Id = 'conduit-postgres'; Label = 'Database (PostgreSQL)'; Core = $true; Check = 'Database' }
    @{ Id = 'conduit-mariadb'; Label = 'Database (MariaDB)'; Core = $true; Check = 'Database' }
    @{ Id = 'conduit-garnet'; Label = 'Cache and task queue (Garnet)'; Core = $true; Check = 'Cache' }
    @{ Id = 'conduit-web'; Label = 'EvE Conduit application'; Core = $true; Check = 'App' }
    @{ Id = 'conduit-worker'; Label = 'Background jobs (worker)'; Core = $false; Check = '' }
    @{ Id = 'conduit-beat'; Label = 'Scheduler (beat)'; Core = $false; Check = '' }
    @{ Id = 'conduit-caddy'; Label = 'Web server (Caddy)'; Core = $true; Check = 'Web' }
)

function Read-TraySetting {
    <#
    .SYNOPSIS
    The panel's settings.json (written by the installer; no secrets in it).
    #>
    param([Parameter(Mandatory)][string]$Path)
    $json = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    foreach ($key in @('SiteUrl', 'Domain', 'HttpPort', 'AppPort', 'CachePort', 'Version', 'Root')) {
        if (-not ($json.PSObject.Properties.Name -contains $key)) { throw "settings.json is missing '$key'" }
    }
    return $json
}

function Test-TcpPort {
    <#
    .SYNOPSIS
    True when something accepts a TCP connection on 127.0.0.1:$Port within the timeout.
    #>
    param([Parameter(Mandatory)][int]$Port, [int]$TimeoutMs = 1500)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $attempt = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne($TimeoutMs)) { return $false }
        $client.EndConnect($attempt)
        return $true
    }
    catch { return $false }
    finally { $client.Close() }
}

function Test-RedisPing {
    <#
    .SYNOPSIS
    Sends PING over the Redis protocol; True on +PONG. Works for Garnet and Redis.
    #>
    param([Parameter(Mandatory)][int]$Port, [int]$TimeoutMs = 1500)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $attempt = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne($TimeoutMs)) { return $false }
        $client.EndConnect($attempt)
        $stream = $client.GetStream()
        $stream.ReadTimeout = $TimeoutMs
        $ping = [Text.Encoding]::ASCII.GetBytes("PING`r`n")
        $stream.Write($ping, 0, $ping.Length)
        $buffer = New-Object byte[] 64
        $read = $stream.Read($buffer, 0, $buffer.Length)
        return ([Text.Encoding]::ASCII.GetString($buffer, 0, $read)).StartsWith('+PONG')
    }
    catch { return $false }
    finally { $client.Close() }
}

function Get-HttpStatus {
    <#
    .SYNOPSIS
    Status code of a GET to http://127.0.0.1:$Port$Path with the given Host header, without following redirects. 0 when nothing answers. A 3xx still proves the server is up.
    #>
    param(
        [Parameter(Mandatory)][int]$Port,
        [string]$Path = '/',
        [string]$HostHeader = 'localhost',
        [int]$TimeoutMs = 4000
    )
    try {
        $request = [System.Net.HttpWebRequest][System.Net.WebRequest]::Create("http://127.0.0.1:$Port$Path")
        $request.Host = $HostHeader
        $request.Method = 'GET'
        $request.AllowAutoRedirect = $false
        $request.Timeout = $TimeoutMs
        $request.ReadWriteTimeout = $TimeoutMs
        $response = $request.GetResponse()
        try { return [int]$response.StatusCode } finally { $response.Close() }
    }
    catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            $_.Exception.Response.Close()
            return $code
        }
        return 0
    }
    catch { return 0 }
}

$script:StepWords = @{ backup = 'backing up'; install = 'installing'; migrate = 'updating the database'; restart = 'restarting' }

function Read-ConduitProgress {
    <#
    .SYNOPSIS
    The updater's progress.json (copied into the tray folder while an update or plugin install runs), or $null when nothing is running. Returns @{ Kind; Target; Step; Text }. Ignores a file older than 30 minutes.
    #>
    param([Parameter(Mandatory)][string]$Path, [datetime]$Now = (Get-Date))
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try {
        $json = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
        # PowerShell 7 turns ISO dates in JSON into DateTime by itself; Windows PowerShell 5.1 leaves them as text.
        $at = if ($json.at -is [datetime]) { $json.at.ToUniversalTime() }
        else { [datetime]::Parse([string]$json.at, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) }
    }
    catch { return $null }
    if (($Now.ToUniversalTime() - $at).TotalMinutes -gt 30) { return $null }
    $step = [string]$json.step
    if (-not $script:StepWords.ContainsKey($step)) { return $null }
    $what = if ([string]$json.kind -eq 'plugins') { 'Installing plugins' } elseif ($json.target) { "Updating to $($json.target)" } else { 'Updating' }
    return @{ Kind = [string]$json.kind; Target = [string]$json.target; Step = $step; Text = "${what}: $($script:StepWords[$step])..." }
}

function Get-ConduitHealth {
    <#
    .SYNOPSIS
    Checks every component and returns @{ Overall = 'Healthy'|'Degraded'|'Down'|'Updating'|'NotInstalled'; Items = @(...); Summary = '...' }.  $ServiceStatus maps service id -> 'Running' | 'Stopped' | 'StartPending' | ... (from Get-Service on Windows). Services missing from it aren't installed. $Probe can replace the network checks in tests. $Progress (from Read-ConduitProgress) means the updater is at work: services it stopped are expected to be down, so the result is 'Updating' instead of a problem.
    #>
    param(
        [Parameter(Mandatory)]$Settings,
        [Parameter(Mandatory)][System.Collections.IDictionary]$ServiceStatus,
        [scriptblock]$Probe,
        [hashtable]$Progress
    )
    if (-not $Probe) {
        $Probe = {
            param($Kind, $Port, $HostHeader)
            switch ($Kind) {
                'Database' { if (Test-TcpPort -Port $Port) { 'answers' } else { '' } }
                'Cache' { if (Test-RedisPing -Port $Port) { 'answers' } else { '' } }
                'App' {
                    $code = Get-HttpStatus -Port $Port -Path '/api/core/bootstrap' -HostHeader $HostHeader
                    if ($code -eq 200) { 'answers' } elseif ($code) { "HTTP $code" } else { '' }
                }
                'Web' {
                    $code = Get-HttpStatus -Port $Port -Path '/' -HostHeader $HostHeader
                    if ($code -ge 200 -and $code -lt 400) { 'answers' } elseif ($code) { "HTTP $code" } else { '' }
                }
            }
        }
    }

    $ports = @{
        Database = $(if ($Settings.PSObject.Properties.Name -contains 'DatabasePort') { $Settings.DatabasePort } else { 0 })
        Cache    = $Settings.CachePort
        App      = $Settings.AppPort
        Web      = $Settings.HttpPort
    }
    $items = @()
    foreach ($c in $script:Components) {
        if (-not $ServiceStatus.Contains($c.Id)) { continue }   # e.g. the database runs elsewhere
        $state = [string]$ServiceStatus[$c.Id]
        $port = if ($c.Check) { $ports[$c.Check] } else { $null }
        $level = 'OK'
        $detail = ''
        if ($state -eq 'Running') {
            if ($c.Check -and $port) {
                $answer = & $Probe $c.Check $port $Settings.Domain
                if ($answer -eq 'answers') { $detail = "answering on port $port" }
                else {
                    $level = if ($c.Core) { 'Down' } else { 'Warning' }
                    $detail = if ($answer) { "port $port replied $answer" } else { "running, but nothing answers on port $port" }
                }
            }
            else { $detail = 'running' }
        }
        elseif ($state -match 'Pending') {
            $level = 'Warning'
            $words = @{ StartPending = 'starting...'; StopPending = 'stopping...'; ContinuePending = 'resuming...'; PausePending = 'pausing...' }
            $detail = if ($words.ContainsKey($state)) { $words[$state] } else { $state }
        }
        else {
            $level = if ($c.Core) { 'Down' } else { 'Warning' }
            $detail = "service is $($state.ToLower())"
        }
        $items += [pscustomobject]@{ Id = $c.Id; Name = $c.Label; Level = $level; Port = $port; Detail = $detail }
    }

    if (-not $items) {
        return @{ Overall = 'NotInstalled'; Items = @(); Summary = 'EvE Conduit services not found' }
    }
    if ($Progress) {
        foreach ($item in $items) {
            if ($item.Level -ne 'OK') { $item.Level = 'Warning'; $item.Detail = "$($item.Detail) (expected during the update)" }
        }
        return @{ Overall = 'Updating'; Items = $items; Summary = $Progress.Text }
    }
    $down = @($items | Where-Object Level -eq 'Down')
    $warn = @($items | Where-Object Level -eq 'Warning')
    if ($down) {
        $overall = 'Down'
        $summary = "Problem: $(($down | ForEach-Object Name) -join ', ')"
    }
    elseif ($warn) {
        $overall = 'Degraded'
        $summary = "Needs attention: $(($warn | ForEach-Object Name) -join ', ')"
    }
    else {
        $overall = 'Healthy'
        $summary = 'All services healthy'
    }
    return @{ Overall = $overall; Items = $items; Summary = $summary }
}

Export-ModuleMember -Function Read-TraySetting, Test-TcpPort, Test-RedisPing, Get-HttpStatus, Read-ConduitProgress, Get-ConduitHealth
