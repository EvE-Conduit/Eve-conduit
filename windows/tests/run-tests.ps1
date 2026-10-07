# Runs the Windows test suites. Fails on any failed test or container error (e.g. a test file
# that couldn't be discovered), so nothing is silently skipped.
#   pwsh windows/tests/run-tests.ps1
Import-Module Pester -MinimumVersion 5.5
$result = Invoke-Pester -Path $PSScriptRoot -PassThru -Output Detailed
$broken = @($result.Containers | Where-Object { $_.Result -ne 'Passed' })
foreach ($c in $broken) { Write-Error "Test file problem: $($c.Item) -> $($c.ErrorRecord | Select-Object -First 1)" }
if ($result.FailedCount -or $broken.Count) { exit 1 }
