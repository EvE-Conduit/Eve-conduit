# Helpers for Setup.ps1, the bridge between the graphical installer (conduit.iss) and install.ps1.
# The installer passes the wizard's answers in a small "Key=Value" file rather than on the command line,
# so the EVE secret never shows up in a process list.

Set-StrictMode -Version Latest

function Read-SetupValue {
    <# Reads a "Key=Value" file (blank lines and # comments ignored; the first = splits). #>
    param([Parameter(Mandatory)][string]$Path)
    $values = [ordered]@{}
    foreach ($line in [IO.File]::ReadAllLines($Path)) {
        $text = $line.Trim()
        if (-not $text -or $text.StartsWith('#')) { continue }
        $at = $text.IndexOf('=')
        if ($at -lt 1) { continue }
        $values[$text.Substring(0, $at).Trim()] = $text.Substring($at + 1).Trim()
    }
    return $values
}

function Test-SetupFlag {
    <# "1", "true" and "yes" (any case) are on; anything else, or a missing key, is off. #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Values, [Parameter(Mandatory)][string]$Name)
    return $Values.Contains($Name) -and ([string]$Values[$Name]).Trim().ToLowerInvariant() -in @('1', 'true', 'yes')
}

function ConvertTo-SetupPort {
    <# The port number, 0 when empty, or -1 when it isn't a number. #>
    param([AllowEmptyString()][AllowNull()][string]$Text)
    if (-not $Text -or -not $Text.Trim()) { return 0 }
    $value = 0
    if ([int]::TryParse($Text.Trim(), [ref]$value)) { return $value }
    return -1
}

function ConvertTo-InstallArgument {
    <# The wizard's answers as named arguments for install.ps1 (always non-interactive: -Yes). #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Values)
    $named = [ordered]@{
        Domain      = [string]$Values['Domain']
        Email       = [string]$Values['Email']
        InstallRoot = [string]$Values['InstallRoot']
        Database    = $(if ([string]$Values['Database'] -eq 'MariaDB') { 'MariaDB' } else { 'Postgres' })
        Yes         = $true
    }
    foreach ($name in @('HttpPort', 'HttpsPort', 'AppPort', 'CachePort', 'DatabasePort')) {
        $port = ConvertTo-SetupPort ([string]$Values[$name])
        if ($port -gt 0) { $named[$name] = $port }
    }
    if ($Values['PublicPorts'] -in @('Standard', 'AsChosen')) { $named['PublicPorts'] = [string]$Values['PublicPorts'] }
    if ($Values['EsiClientId']) { $named['EsiClientId'] = [string]$Values['EsiClientId'] }
    if ($Values['EsiSecret']) { $named['EsiSecret'] = [string]$Values['EsiSecret'] }
    if (Test-SetupFlag $Values 'NoTls') { $named['NoTls'] = $true }
    if (Test-SetupFlag $Values 'NoTray') { $named['NoTray'] = $true }
    return $named
}

function Get-SetupPortSet {
    <# The ports the install will use ({Name = port}), as install.ps1 picks them: defaults for empty fields. #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Values)
    $defaults = Get-DefaultPort
    $ports = [ordered]@{}
    $wanted = [ordered]@{ Http = $defaults.Http; Https = $defaults.Https; App = $defaults.App; Cache = $defaults.Cache }
    if (Test-SetupFlag $Values 'NoTls') { $wanted.Remove('Https') }
    $wanted['Database'] = $(if ([string]$Values['Database'] -eq 'MariaDB') { $defaults.MariaDB } else { $defaults.Postgres })
    foreach ($name in $wanted.Keys) {
        $given = ConvertTo-SetupPort ([string]$Values["${name}Port"])
        $ports[$name] = $(if ($given -eq 0) { $wanted[$name] } else { $given })
    }
    return $ports
}

function Get-SetupProblem {
    <#
      What's wrong with the wizard's answers before anything is installed. $Taken/$Excluded are the
      machine's listening ports and Windows' reserved ranges (see Get-PortProblem).
    #>
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$Values,
        [int[]]$Taken = @(),
        [object[]]$Excluded = @()
    )
    $problems = New-Object System.Collections.Generic.List[string]
    $domain = ([string]$Values['Domain']).Trim() -replace '^[A-Za-z]+://', '' -replace '/+$', ''
    $addressProblem = Get-SiteAddressProblem -Address $domain -NoTls:(Test-SetupFlag $Values 'NoTls')
    if ($addressProblem) { $problems.Add($addressProblem) }
    if (([string]$Values['Email']) -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { $problems.Add('Enter a valid email address.') }
    $root = Format-InstallRoot ([string]$Values['InstallRoot'])
    $rootProblem = Get-InstallRootProblem $root
    if ($rootProblem) { $problems.Add($rootProblem) }
    $ports = Get-SetupPortSet $Values
    foreach ($name in @($ports.Keys)) {
        if ($ports[$name] -lt 0) { $problems.Add("The $name port must be a number from 1 to 65535."); $ports.Remove($name) }
    }
    foreach ($problem in (Get-PortProblem -Ports $ports -Taken $Taken -Excluded $Excluded)) { $problems.Add($problem) }
    return , $problems.ToArray()
}

function ConvertTo-ProblemLine {
    <#
      "PROBLEM: ..." lines for the wizard, one per problem. Accepts problems however PowerShell handed them over
      (single strings, arrays, an array wrapped in an array) and skips empty ones, so no answers that are fine
      ever show up as a blank problem.
    #>
    param([AllowNull()][object[]]$Problems)
    # Written to the pipeline one line at a time (no array wrapping): callers collect them with @(...).
    $Problems | ForEach-Object { $_ } | ForEach-Object { [string]$_ } | Where-Object { $_.Trim() } | ForEach-Object { "PROBLEM: $_" }
}

function Get-SetupCode {
    <# The first-run setup code from conduit_init's output, or ''. #>
    param([AllowEmptyString()][AllowNull()][string]$Text)
    if ($Text -match 'setup code:\s*(\S+)') { return $Matches[1] }
    return ''
}

function Format-SetupResult {
    <# "Key=Value" lines for the installer's finish page. #>
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Values)
    return @($Values.Keys | ForEach-Object { '{0}={1}' -f $_, (([string]$Values[$_]) -replace '[\r\n]', ' ') })
}

Export-ModuleMember -Function *-*
