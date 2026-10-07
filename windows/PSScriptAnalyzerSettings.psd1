# Lint settings for the shipped Windows scripts. Run: pwsh windows/tests/lint.ps1
@{
    # Write-Host is intended: these are interactive admin scripts.
    # ShouldProcess (-WhatIf) on internal helpers adds noise without making anything safer; the
    # scripts ask for confirmation where it matters (install.ps1 without -Yes).
    ExcludeRules = @('PSAvoidUsingWriteHost', 'PSUseShouldProcessForStateChangingFunctions')
    Rules        = @{
        # Everything must keep running on Windows PowerShell 5.1 (Windows 10 1809 / Server 2019 and newer).
        PSUseCompatibleSyntax   = @{ Enable = $true; TargetVersions = @('5.1', '7.4') }
        PSUseCompatibleCommands = @{ Enable = $true; TargetProfiles = @('win-8_x64_10.0.17763.0_5.1.17763.316_x64_4.0.30319.42000_framework') }
        PSUseCompatibleTypes    = @{ Enable = $true; TargetProfiles = @('win-8_x64_10.0.17763.0_5.1.17763.316_x64_4.0.30319.42000_framework') }
    }
}
