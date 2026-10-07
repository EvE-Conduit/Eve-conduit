# Lints the shipped Windows scripts (not the Pester tests, which need Pester 5 rather than the
# Pester 3.4 that comes with Windows) with the 5.1-compatibility settings. Exits 1 on findings
# or if the analyzer can't check a file.
#   pwsh windows/tests/lint.ps1
$windows = Split-Path $PSScriptRoot -Parent
$settings = Join-Path $windows 'PSScriptAnalyzerSettings.psd1'
$sep = [IO.Path]::DirectorySeparatorChar
$files = Get-ChildItem $windows -Recurse -Include *.ps1, *.psm1 | Where-Object { $_.FullName -notlike "*${sep}tests${sep}*" }
$findings = @()
$failed = 0
foreach ($f in $files) {
    # PSScriptAnalyzer 1.25 sometimes throws on its first run in a session while loading the
    # compatibility profiles; retry once, and treat a second failure as a real failure.
    $ok = $false
    foreach ($attempt in 1, 2) {
        try {
            $findings += @(Invoke-ScriptAnalyzer -Path $f.FullName -Settings $settings -ErrorAction Stop)
            $ok = $true
            break
        }
        catch { if ($attempt -eq 2) { Write-Warning "Could not analyse $($f.Name): $($_.Exception.Message)" } }
    }
    if (-not $ok) { $failed++ }
}
foreach ($x in $findings) { '{0}:{1} {2} - {3}' -f $x.ScriptName, $x.Line, $x.RuleName, $x.Message }
"Checked $(@($files).Count - $failed) of $(@($files).Count) files: $($findings.Count) findings"
if ($findings.Count -or $failed) { exit 1 }
