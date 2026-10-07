# Pester tests for windows\installer\ConduitSetup.psm1, the graphical installer's bridge to install.ps1.
BeforeAll {
    $windows = Split-Path $PSScriptRoot -Parent
    Import-Module (Join-Path (Join-Path $windows 'scripts') 'Conduit.psm1') -Force
    Import-Module (Join-Path (Join-Path $windows 'installer') 'ConduitSetup.psm1') -Force
    function New-Answers([hashtable]$Overrides = @{}) {
        $values = [ordered]@{
            InstallRoot = 'D:\EvE-Conduit'; Domain = 'auth.example.com'; Email = 'fc@example.com'; Database = 'Postgres'
            NoTls = '0'; HttpPort = '80'; HttpsPort = '443'; AppPort = '8000'; CachePort = '6379'; DatabasePort = '5432'
            PublicPorts = ''; EsiClientId = ''; EsiSecret = ''
        }
        foreach ($key in $Overrides.Keys) { $values[$key] = $Overrides[$key] }
        return $values
    }
}

Describe 'Read-SetupValue' {
    It 'reads Key=Value lines, splitting on the first =' {
        $file = Join-Path ([IO.Path]::GetTempPath()) "answers-$([guid]::NewGuid()).txt"
        try {
            [IO.File]::WriteAllLines($file, @('# comment', '', 'Domain=auth.example.com', 'EsiSecret=a=b=c', 'Broken line', ' Email = fc@example.com '))
            $values = Read-SetupValue $file
            $values['Domain'] | Should -Be 'auth.example.com'
            $values['EsiSecret'] | Should -Be 'a=b=c'
            $values['Email'] | Should -Be 'fc@example.com'
            $values.Contains('Broken line') | Should -BeFalse
        }
        finally { Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue }
    }
}

Describe 'ConvertTo-InstallArgument' {
    It 'always asks nothing and leaves out empty values' {
        $named = ConvertTo-InstallArgument (New-Answers @{ HttpPort = ''; EsiClientId = '' })
        $named.Yes | Should -BeTrue
        $named.Contains('HttpPort') | Should -BeFalse
        $named.Contains('EsiClientId') | Should -BeFalse
        $named.Contains('NoTls') | Should -BeFalse
        $named.Database | Should -Be 'Postgres'
        $named.HttpsPort | Should -Be 443
    }
    It 'passes switches, MariaDB, public ports and the EVE application' {
        $named = ConvertTo-InstallArgument (New-Answers @{ NoTls = '1'; Database = 'MariaDB'; PublicPorts = 'AsChosen'; EsiClientId = 'abc'; EsiSecret = 's3cret'; NoTray = 'yes' })
        $named.NoTls | Should -BeTrue
        $named.NoTray | Should -BeTrue
        $named.Database | Should -Be 'MariaDB'
        $named.PublicPorts | Should -Be 'AsChosen'
        $named.EsiClientId | Should -Be 'abc'
        $named.EsiSecret | Should -Be 's3cret'
    }
    It 'ignores unknown public-port and database values' {
        $named = ConvertTo-InstallArgument (New-Answers @{ PublicPorts = 'Whatever'; Database = 'Oracle' })
        $named.Contains('PublicPorts') | Should -BeFalse
        $named.Database | Should -Be 'Postgres'
    }
}

Describe 'Get-SetupPortSet' {
    It 'fills in defaults and drops HTTPS with plain HTTP' {
        $ports = Get-SetupPortSet (New-Answers @{ HttpPort = ''; NoTls = '1'; Database = 'MariaDB'; DatabasePort = '' })
        $ports.Http | Should -Be 80
        $ports.Contains('Https') | Should -BeFalse
        $ports.Database | Should -Be 3306
    }
    It 'marks text that is not a number' {
        (Get-SetupPortSet (New-Answers @{ AppPort = 'eighty' })).App | Should -Be -1
    }
}

Describe 'Get-SetupProblem' {
    It 'accepts a normal set of answers' {
        Get-SetupProblem -Values (New-Answers) | Should -BeNullOrEmpty
    }
    It 'reports a bad domain, email, folder and ports' {
        $problems = Get-SetupProblem -Values (New-Answers @{ Domain = 'auth.example.com:8443/x'; Email = 'nope'; InstallRoot = 'D:\'; AppPort = 'x'; CachePort = '80' })
        ($problems -join "`n") | Should -Match "doesn't look like a domain"
        ($problems -join "`n") | Should -Match 'valid email'
        ($problems -join "`n") | Should -Match 'root of a drive'
        ($problems -join "`n") | Should -Match 'App port must be a number'
        ($problems -join "`n") | Should -Match "can't both use port 80"
    }
    It 'accepts a pasted URL as the domain' {
        Get-SetupProblem -Values (New-Answers @{ Domain = 'https://auth.example.com/' }) | Should -BeNullOrEmpty
    }
    It 'reports ports in use or reserved by Windows' {
        $problems = Get-SetupProblem -Values (New-Answers) -Taken @(443) -Excluded @(, @(7990, 8090))
        ($problems -join "`n") | Should -Match 'Port 443 \(Https\) is already in use'
        ($problems -join "`n") | Should -Match 'Port 8000 \(App\) is reserved'
    }
}

Describe 'Setup result' {
    It 'finds the setup code in conduit_init output' {
        Get-SetupCode "`n=====`n  EvE Conduit first-run setup code: Ab3_xY-9`n=====" | Should -Be 'Ab3_xY-9'
        Get-SetupCode 'nothing here' | Should -Be ''
    }
    It 'writes one Key=Value line per value, without line breaks' {
        Format-SetupResult ([ordered]@{ Version = '0.4.0'; SiteUrl = "https://a`r`nb" }) | Should -Be @('Version=0.4.0', 'SiteUrl=https://a  b')
    }
}

Describe 'Problem lines for the wizard' {
    It 'reports nothing when there are no problems, however the empty list is wrapped' {
        @(ConvertTo-ProblemLine @()).Count | Should -Be 0
        @(ConvertTo-ProblemLine @(, @())).Count | Should -Be 0
        @(ConvertTo-ProblemLine @(@(Get-SetupProblem -Values ([ordered]@{ Domain = 'auth.example.com'; Email = 'a@b.co'; InstallRoot = 'D:\EvE-Conduit' })))).Count | Should -Be 0
    }
    It 'gives one line per problem' {
        $lines = @(ConvertTo-ProblemLine (@(, @('Port 80 is in use', 'Enter a valid email address.')) + @('Drive D: is full', '')))
        $lines | Should -Be @('PROBLEM: Port 80 is in use', 'PROBLEM: Enter a valid email address.', 'PROBLEM: Drive D: is full')
    }
}
